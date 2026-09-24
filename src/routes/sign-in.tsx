import { useState } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { getCurrentUser, requestEmailOtp, verifyEmailOtp } from '#/lib/server/auth';
import { getPersonalAccount } from '#/lib/server/personal-account';

export const Route = createFileRoute('/sign-in')({
  // Read the optional destination from the sign-in URL.
  validateSearch: (search) => ({
    // Only allow same-origin relative paths.
    // Reject protocol-relative URLs such as "//evil.com".
    redirect:
      typeof search.redirect === 'string' &&
        search.redirect.startsWith('/') &&
        !search.redirect.startsWith('//')
        ? search.redirect
        : undefined,
  }),
  beforeLoad: async () => {
    // A signed-in user should never see the sign-in form again.
    // Check the session on the server before rendering the page.
    const user = await getCurrentUser()

    if (!user) {
      return
    }

    // Decide where an already authenticated user belongs.
    // Users without a Personal Account must complete onboarding.
    const account = await getPersonalAccount()

    throw redirect({
      to: account ? '/profile' : '/onboarding',
    })
  },
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError(null)
    setIsSubmitting(true)

    try {
      // The server sends the OTP and stores the temporary
      // verification credentials in HttpOnly cookies.
      await requestEmailOtp({
        data: {
          email,
        },
      })

      setStep('otp')
    } catch {
      setError('Unable to send the verification code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError(null)
    setIsSubmitting(true)

    try {
      // The server reads the temporary OTP credentials from
      // HttpOnly cookies and creates the authenticated session.
      await verifyEmailOtp({ data: { code } });

      // If another protected page originally sent the user to sign-in,
      // return to that exact page after authentication.
      if (redirect) {
        void navigate({ to: redirect });
        return;
      }

      // When there is no explicit redirect, decide where the user belongs
      // based on whether a Personal Account already exists.
      const account = await getPersonalAccount();

      void navigate({ to: account ? '/profile' : '/onboarding' });
    } catch {
      setError('Invalid or expired verification code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'otp') {
    return (
      <main>
        <div>
          <h1>Enter verification code</h1>

          <p>
            We sent a 6-digit verification code to <strong>{email}</strong>.
          </p>

          <form onSubmit={handleOtpSubmit}>
            <label htmlFor="code">Verification code</label>

            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              value={code}
              onChange={(event) => {
                // Keep only numeric characters in the OTP field.
                setCode(event.target.value.replace(/\D/g, ''))
              }}
              required
              disabled={isSubmitting}
            />

            {error ? <p role="alert">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
            >
              {isSubmitting ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              // Allow the user to return to the email step
              // without reloading the page.
              setStep('email')
              setCode('')
              setError(null)
            }}
            disabled={isSubmitting}
          >
            Change email
          </button>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div>
        <h1>Sign in</h1>

        <p>Enter your email to continue.</p>

        <form onSubmit={handleEmailSubmit}>
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isSubmitting}
          />

          {error ? <p role="alert">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  )
}