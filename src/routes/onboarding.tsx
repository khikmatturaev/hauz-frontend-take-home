import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createPersonalAccount } from '#/lib/server/personal-account'
import { authStateQueryKey, authStateQueryOptions, type AuthState } from '#/lib/client/auth-state'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ context }) => {
    const { user, account } = await context.queryClient.ensureQueryData(
      authStateQueryOptions(),
    )

    if (!user) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: '/onboarding' },
      })
    }

    if (account) {
      throw redirect({ to: '/profile' })
    }
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'property_owner' | 'realtor'>(
    'property_owner',
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const currentAuthState = queryClient.getQueryData<AuthState>(authStateQueryKey)

      if (currentAuthState?.account) {
        await navigate({ to: '/profile' })
        return
      }

      const account = await createPersonalAccount({
        data: { firstName, lastName, role },
      })

      const currentUser = queryClient.getQueryData<AuthState>(authStateQueryKey)?.user ?? null

      queryClient.setQueryData(authStateQueryKey, {
        user: currentUser,
        account,
      })

      await navigate({ to: '/profile' })
    } catch {
      setError('Unable to create your personal account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page onboarding-page">
      <section className="onboarding-shell">
        <div className="onboarding-intro">
          <div>
            <span className="eyebrow">FIRST, A LITTLE ABOUT YOU</span>
            <h1>Let’s make HAUZ feel like yours.</h1>
            <p>
              A few details are all we need. You can update your name and
              contact details later from your profile.
            </p>
          </div>

          <div className="onboarding-progress" aria-label="Onboarding progress">
            <span className="progress-step progress-step-active">01</span>
            <span className="progress-line" />
            <span className="progress-step">02</span>
            <span className="progress-caption">Personal account</span>
          </div>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <span className="section-label">YOUR NAME</span>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="firstName">First name</label>
                <input
                  className="text-input"
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Hikmat"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="field">
                <label htmlFor="lastName">Last name</label>
                <input
                  className="text-input"
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="To’rayev"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <span className="section-label">I AM A</span>
            <fieldset className="role-grid" disabled={isSubmitting}>
              <legend className="sr-only">Choose your role</legend>

              <label className={`role-card ${role === 'property_owner' ? 'role-card-active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="property_owner"
                  checked={role === 'property_owner'}
                  onChange={() => setRole('property_owner')}
                />
                <span className="role-icon">⌂</span>
                <span className="role-copy">
                  <strong>Property Owner</strong>
                  <small>I own property and want to manage it.</small>
                </span>
                <span className="role-check" aria-hidden="true">✓</span>
              </label>

              <label className={`role-card ${role === 'realtor' ? 'role-card-active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="realtor"
                  checked={role === 'realtor'}
                  onChange={() => setRole('realtor')}
                />
                <span className="role-icon">↗</span>
                <span className="role-copy">
                  <strong>Realtor</strong>
                  <small>I help people find or sell property.</small>
                </span>
                <span className="role-check" aria-hidden="true">✓</span>
              </label>
            </fieldset>
          </div>

          {error ? (
            <p className="form-message form-message-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="form-actions">
            <span className="form-hint">You can edit your profile later.</span>
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create my account'}
              {!isSubmitting ? <span aria-hidden="true">→</span> : null}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
