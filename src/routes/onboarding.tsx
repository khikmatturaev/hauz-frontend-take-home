import { useState } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { createPersonalAccount, getPersonalAccount } from '#/lib/server/personal-account';
import { getCurrentUser } from '#/lib/server/auth';

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    // Check authentication on the server before rendering
    // the protected onboarding page.
    const user = await getCurrentUser()

    if (!user) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: '/onboarding',
        },
      })
    }

    // If the Personal Account already exists, onboarding
    // should not be shown again.
    const account = await getPersonalAccount()

    if (account) {
      throw redirect({
        to: '/profile',
      })
    }
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'property_owner' | 'realtor'>(
    'property_owner',
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Prevent duplicate submissions while the account is being created.
    if (isSubmitting) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      // Check first so an existing account is never recreated
      // when the onboarding page is opened again.
      const existingAccount = await getPersonalAccount()

      if (existingAccount) {
        await navigate({ to: '/profile' })
        return
      }

      await createPersonalAccount({
        data: {
          firstName,
          lastName,
          role,
        },
      })

      await navigate({ to: '/profile' })
    } catch {
      setError('Unable to create your personal account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main>
      <div>
        <h1>Create your personal account</h1>
        <p>Tell us a little about yourself to continue.</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <fieldset disabled={isSubmitting}>
            <legend>Role</legend>

            <label>
              <input
                type="radio"
                name="role"
                value="property_owner"
                checked={role === 'property_owner'}
                onChange={() => setRole('property_owner')}
              />
              Property Owner
            </label>

            <label>
              <input
                type="radio"
                name="role"
                value="realtor"
                checked={role === 'realtor'}
                onChange={() => setRole('realtor')}
              />
              Realtor
            </label>
          </fieldset>

          {error ? <p role="alert">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  )
}