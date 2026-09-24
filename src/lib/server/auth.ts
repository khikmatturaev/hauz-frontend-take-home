import { ID } from 'node-appwrite';
import { z } from 'zod';
import { createServerFn } from '@tanstack/react-start';
import { setCookie, getCookie } from '@tanstack/react-start/server';
import { createAppwriteAdminClient, createAppwriteSessionClient } from './appwrite';

const OTP_USER_COOKIE = 'hauz_otp_user';
const OTP_SECRET_COOKIE = 'hauz_otp_secret';
const OTP_COOKIE_MAX_AGE = 10 * 60 // 10 minutes in seconds

// Authenticated Appwrite session secret is kept in an HttpOnly cookie.
// Browser JavaScript cannot read this value.
const SESSION_COOKIE = 'hauz_session'

const requestEmailOtpSchema = z.object({
    email: z.email(),
})

const verifyEmailOtpSchema = z.object({
    code: z.string().regex(/^\d{6}$/, 'OTP code must contain 6 digits'),
})

export const requestEmailOtp = createServerFn({ method: 'POST' })
    .validator(requestEmailOtpSchema)
    .handler(async ({ data }) => {
        const { account } = createAppwriteAdminClient()

        const token = await account.createEmailToken({
            userId: ID.unique(),
            email: data.email,
        })

        setCookie(OTP_USER_COOKIE, token.userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: OTP_COOKIE_MAX_AGE,
        })
        setCookie(OTP_SECRET_COOKIE, token.secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: OTP_COOKIE_MAX_AGE,
        })

        return {
            expire: token.expire,
        }
    })


export const verifyEmailOtp = createServerFn({ method: 'POST' })
    .validator(verifyEmailOtpSchema)
    .handler(async () => {
        // OTP request vaqtida server tomonidan yaratilgan
        // userId va secret faqat HttpOnly cookie'dan olinadi.
        const userId = getCookie(OTP_USER_COOKIE)
        const secret = getCookie(OTP_SECRET_COOKIE)

        if (!userId || !secret) {
            throw new Error('OTP session expired or not found')
        }

        const { account } = createAppwriteAdminClient()

        // Appwrite OTP secret orqali authenticated session yaratadi.
        const session = await account.createSession({
            userId,
            secret,
        })

        // Appwrite session secret browserga oddiy response sifatida
        // yuborilmaydi; u faqat HttpOnly cookie'da saqlanadi.
        setCookie(SESSION_COOKIE, session.secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        })

        // OTP uchun ishlatilgan vaqtinchalik cookie'larni o'chiramiz.
        setCookie(OTP_USER_COOKIE, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        })

        setCookie(OTP_SECRET_COOKIE, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        })

        return {
            userId: session.userId,
        }
    })


// Returns the currently authenticated Appwrite user.
// If the session is missing or invalid, the user is treated as signed out.
export const getCurrentUser = createServerFn({ method: 'GET' })
    .handler(async () => {
        const sessionSecret = getCookie(SESSION_COOKIE)

        // No session cookie means the visitor is signed out.
        if (!sessionSecret) {
            return null
        }

        try {
            // Use the user's session instead of the server API key
            // when requesting the current account.
            const { account } = createAppwriteSessionClient(sessionSecret)

            const user = await account.get()

            return {
                id: user.$id,
                email: user.email,
                name: user.name,
            }
        } catch {
            // Any invalid/expired session is treated as signed out.
            // Remove the stale cookie so subsequent requests start clean.
            setCookie(SESSION_COOKIE, '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 0,
            })

            return null
        }
    })


// Signs the current user out by deleting the local session cookie.
// Appwrite's session is also deleted when possible.
export const logout = createServerFn({ method: 'POST' }).handler(async () => {
    const sessionSecret = getCookie(SESSION_COOKIE)

    if (sessionSecret) {
        try {
            // Delete the Appwrite session associated with the current user.
            const { account } = createAppwriteSessionClient(sessionSecret)
            await account.deleteSession({
                sessionId: 'current',
            })
        } catch {
            // The session may already be expired or invalid.
            // We still clear the local cookie below.
        }
    }

    // Remove the local authentication cookie regardless of Appwrite's response.
    setCookie(SESSION_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    })

    return {
        success: true,
    }
})