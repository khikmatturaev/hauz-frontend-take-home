import { ExecutionMethod, Functions } from 'node-appwrite';
import { z } from 'zod';
import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { createAppwriteSessionClient } from './appwrite';

const SESSION_COOKIE = 'hauz_session';
const FUNCTION_ID = process.env.APPWRITE_FUNCTION_ID;

const accountResponseSchema = z.object({
    personalAccountId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['property_owner', 'realtor']),
    contactEmail: z.string().nullable(),
    bio: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

const createPersonalAccountSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    role: z.enum(['property_owner', 'realtor']),
});

const updatePersonalAccountSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    contactEmail: z.string().email('Enter a valid email address').nullable(),
    bio: z.string().trim().nullable(),
})

const executePersonalAccount = async (
    method: ExecutionMethod,
    path: string,
    body?: Record<string, unknown>,
) => {
    const sessionSecret = getCookie(SESSION_COOKIE)

    if (!sessionSecret) throw new Error('Authentication required');
    if (!FUNCTION_ID) throw new Error('APPWRITE_FUNCTION_ID is not configured');

    // Use the authenticated user's Appwrite session.
    // The Function can therefore identify the signed-in user.
    const { client } = createAppwriteSessionClient(sessionSecret);
    const functions = new Functions(client);

    const execution = await functions.createExecution({
        functionId: FUNCTION_ID,
        body: body ? JSON.stringify(body) : undefined,
        async: false,

        // Appwrite's SDK calls the HTTP execution path "xpath".
        xpath: path,
        method,
    })

    if (!execution.responseBody) throw new Error('Personal account function returned an empty response');

    const response = JSON.parse(execution.responseBody) as unknown;

    return {
        statusCode: execution.responseStatusCode,
        body: response,
    }
}

export const getPersonalAccount = createServerFn({ method: 'GET' })
    .handler(async () => {
        const result = await executePersonalAccount(ExecutionMethod.GET, '/personal-account')

        // The Function returns 404 when the authenticated user
        // does not have a Personal Account yet.
        if (result.statusCode === 404) return null;

        // Any response other than 200 is treated as an error.
        if (result.statusCode !== 200) throw new Error('Unable to load personal account');

        // Temporary debug: inspect the exact response returned
        // by the Personal Account Appwrite Function.
        console.log('GET personal account response:', {
            statusCode: result.statusCode,
            body: result.body,
        })


        return accountResponseSchema.parse(result.body)
    })

export const createPersonalAccount = createServerFn({ method: 'POST' })
    .validator(createPersonalAccountSchema)
    .handler(async ({ data }) => {
        const result = await executePersonalAccount(
            ExecutionMethod.POST,
            '/personal-account',
            {
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
            },
        )

        // 201 = account yangi yaratildi.
        // 200 = account oldindan mavjud edi.
        if (result.statusCode === 201 || result.statusCode === 200) {
            // Temporary debug: inspect the exact Appwrite Function response
            // before applying the account response schema.
            console.log('Personal account response:', {
                statusCode: result.statusCode,
                body: result.body,
            })

            return accountResponseSchema.parse(result.body)
        }

        // Function boshqa role bilan mavjud account topilganda
        // 409 qaytaradi. Role onboardingdan keyin o'zgartirilmaydi.
        if (result.statusCode === 409) {
            throw new Error('Personal account already exists with another role')
        }

        throw new Error('Unable to create personal account')
    })


export const updatePersonalAccount = createServerFn({ method: 'POST' })
    .validator(updatePersonalAccountSchema)
    .handler(async ({ data }) => {
        const result = await executePersonalAccount(
            ExecutionMethod.PATCH,
            '/personal-account',
            {
                firstName: data.firstName,
                lastName: data.lastName,

                // Empty optional values are converted to null so the
                // backend actually removes the stored value.
                contactEmail: data.contactEmail,
                bio: data.bio,
            },
        )

        if (result.statusCode !== 200) {
            throw new Error('Unable to update personal account')
        }

        return accountResponseSchema.parse(result.body)
    })