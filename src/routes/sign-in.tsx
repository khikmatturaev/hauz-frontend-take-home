import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { requestEmailOtp, verifyEmailOtp } from '#/lib/server/auth'
import { authStateQueryKey, authStateQueryOptions } from '#/lib/client/auth-state'

export const Route = createFileRoute('/sign-in')({
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
  beforeLoad: async ({ context }) => {
    const { user, account } = await context.queryClient.ensureQueryData(
      authStateQueryOptions(),
    )

    if (user) {
      throw redirect({
        to: account ? '/profile' : '/onboarding',
      })
    }
  },
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { redirect: redirectPath } = Route.useSearch()
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
      await requestEmailOtp({ data: { email } })
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
      await verifyEmailOtp({ data: { code } })

      // The previous auth query may contain the signed-out state.
      // Mark it stale so the next navigation fetches the new session.
      await queryClient.invalidateQueries({ queryKey: authStateQueryKey })

      if (redirectPath) {
        void navigate({ to: redirectPath })
        return
      }

      const { account } = await queryClient.fetchQuery(authStateQueryOptions())
      void navigate({ to: account ? '/profile' : '/onboarding' })
    } catch {
      setError('Invalid or expired verification code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page auth-page">
      <section className="auth-shell">
        <aside className="auth-aside">
          <span className="eyebrow eyebrow-light">WELCOME TO HAUZ</span>
          <div className="auth-aside-copy">
            <h1>
              Your next chapter
              <span> starts here.</span>
            </h1>
            <p>
              Sign in with your email and we will take care of the rest.
              Returning to HAUZ? Your profile is already waiting for you.
            </p>
          </div>
          <div className="auth-aside-footer">
            <span className="mini-mark">H</span>
            <span>Property journeys, made personal.</span>
          </div>
        </aside>

        <div className="auth-form-panel">
          <div className="mobile-brand">
            <span className="brand-mark">H</span>
            <span>HAUZ</span>
          </div>

          {step === 'otp' ? (
            <>
              <div className="form-heading">
                <span className="step-label">STEP 02 / 02</span>
                <h2>Check your inbox.</h2>
                <p>
                  We sent a 6-digit verification code to{' '}
                  <strong>{email}</strong>.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleOtpSubmit}>
                <div className="field">
                  <label htmlFor="code">Verification code</label>
                  <input
                    className="text-input otp-input"
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="000000"
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, ''))
                    }
                    required
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>

                {error ? (
                  <p className="form-message form-message-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  className="button button-primary button-full"
                  type="submit"
                  disabled={isSubmitting || code.length !== 6}
                >
                  {isSubmitting ? 'Verifying…' : 'Verify and continue'}
                  {!isSubmitting ? <span aria-hidden="true">→</span> : null}
                </button>
              </form>

              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setError(null)
                }}
                disabled={isSubmitting}
              >
                ← Use a different email
              </button>
            </>
          ) : (
            <>
              <div className="form-heading">
                <span className="step-label">STEP 01 / 02</span>
                <h2>Welcome back.</h2>
                <p>
                  Enter your email and we’ll send a secure one-time code.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleEmailSubmit}>
                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <input
                    className="text-input"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>

                {error ? (
                  <p className="form-message form-message-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  className="button button-primary button-full"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending code…' : 'Continue with email'}
                  {!isSubmitting ? <span aria-hidden="true">→</span> : null}
                </button>
              </form>

              <p className="form-footnote">
                By continuing, you’ll receive a one-time sign-in code by email.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
