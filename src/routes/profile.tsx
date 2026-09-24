import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { updatePersonalAccount } from '#/lib/server/personal-account'
import { authStateQueryKey, authStateQueryOptions } from '#/lib/client/auth-state'

export const Route = createFileRoute('/profile')({
  beforeLoad: async ({ context }) => {
    const { user, account } = await context.queryClient.ensureQueryData(
      authStateQueryOptions(),
    )

    if (!user) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: '/profile' },
      })
    }

    if (!account) {
      throw redirect({ to: '/onboarding' })
    }

    return { account }
  },

  component: ProfilePage,
})

function ProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { account } = Route.useRouteContext()

  const [firstName, setFirstName] = useState(account.firstName)
  const [lastName, setLastName] = useState(account.lastName)
  const [contactEmail, setContactEmail] = useState(
    account.contactEmail ?? '',
  )
  const [bio, setBio] = useState(account.bio ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Keep the form synchronized with the server-loaded account if
  // the route is refreshed or the route data changes.
  useEffect(() => {
    setFirstName(account.firstName)
    setLastName(account.lastName)
    setContactEmail(account.contactEmail ?? '')
    setBio(account.bio ?? '')
  }, [account])

  const handleCancel = () => {
    setFirstName(account.firstName)
    setLastName(account.lastName)
    setContactEmail(account.contactEmail ?? '')
    setBio(account.bio ?? '')
    setError(null)
    setSuccess(false)
    setIsEditing(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSaving) {
      return
    }

    setError(null)
    setSuccess(false)
    setIsSaving(true)

    try {
      const updatedAccount = await updatePersonalAccount({
        data: {
          firstName,
          lastName,
          contactEmail: contactEmail.trim() || null,
          bio: bio.trim() || null,
        },
      })

      // Update the shared auth cache with the confirmed server result.
      // The next route read can reuse it without another Appwrite request.
      queryClient.setQueryData(authStateQueryKey, (current) =>
        current
          ? {
            ...current,
            account: updatedAccount,
          }
          : current,
      )

      // Refresh route context without triggering another network request.
      await router.invalidate()

      setSuccess(true)
      setIsEditing(false)
    } catch {
      setError('Unable to update your profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="page profile-page">
      <section className="profile-shell">
        <div className="profile-hero">
          <div>
            <span className="eyebrow">PERSONAL ACCOUNT</span>
            <h1>Your profile.</h1>
            <p>Keep the details that represent you on HAUZ up to date.</p>
          </div>

          <div className="profile-avatar-large" aria-hidden="true">
            {account.firstName.charAt(0).toUpperCase()}
            {account.lastName.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-card-top">
            <div>
              <span className="section-label">ACCOUNT DETAILS</span>
              <h2>{account.firstName} {account.lastName}</h2>
            </div>
            <span className="role-badge">
              {account.role === 'property_owner' ? 'Property Owner' : 'Realtor'}
            </span>
          </div>

          {!isEditing ? (
            <>
              <div className="profile-details">
                <div className="detail-item">
                  <span>First name</span>
                  <strong>{account.firstName}</strong>
                </div>
                <div className="detail-item">
                  <span>Last name</span>
                  <strong>{account.lastName}</strong>
                </div>
                <div className="detail-item">
                  <span>Contact email</span>
                  <strong>{account.contactEmail || 'Not provided'}</strong>
                </div>
                <div className="detail-item detail-item-wide">
                  <span>Bio</span>
                  <strong>{account.bio || 'Not provided'}</strong>
                </div>
              </div>

              {success ? (
                <p className="form-message form-message-success" role="status">
                  Profile updated successfully.
                </p>
              ) : null}

              <div className="profile-card-actions">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => {
                    setError(null)
                    setSuccess(false)
                    setIsEditing(true)
                  }}
                >
                  Edit profile
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            </>
          ) : (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="profile-first-name">First name</label>
                  <input
                    className="text-input"
                    id="profile-first-name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="field">
                  <label htmlFor="profile-last-name">Last name</label>
                  <input
                    className="text-input"
                    id="profile-last-name"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="profile-role">Role</label>
                <div className="readonly-field">
                  <span>{account.role === 'property_owner' ? 'Property Owner' : 'Realtor'}</span>
                  <small>Role is fixed after account creation.</small>
                </div>
              </div>

              <div className="field">
                <label htmlFor="profile-contact-email">Contact email</label>
                <input
                  className="text-input"
                  id="profile-contact-email"
                  name="contactEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="field">
                <label htmlFor="profile-bio">Bio</label>
                <textarea
                  className="text-input textarea"
                  id="profile-bio"
                  name="bio"
                  placeholder="Tell us a little about yourself…"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  disabled={isSaving}
                  rows={5}
                />
              </div>

              {error ? (
                <p className="form-message form-message-error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="form-actions form-actions-end">
                <button
                  className="button button-ghost"
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button className="button button-primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                  {!isSaving ? <span aria-hidden="true">→</span> : null}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="profile-security-note">
          <span className="security-icon">✦</span>
          <div>
            <strong>Your account is private by default.</strong>
            <span>Authentication and profile changes are handled securely on the server.</span>
          </div>
        </div>
      </section>
    </main>
  )
}
