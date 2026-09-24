import {
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { getCurrentUser } from '#/lib/server/auth'
import {
  getPersonalAccount,
  updatePersonalAccount,
} from '#/lib/server/personal-account'

export const Route = createFileRoute('/profile')({
  beforeLoad: async () => {
    // The profile is available only to authenticated users.
    // Authentication is checked on the server before the page renders.
    const user = await getCurrentUser()

    if (!user) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: '/profile',
        },
      })
    }

    const account = await getPersonalAccount()

    // An authenticated user without a Personal Account must
    // complete onboarding before accessing the profile.
    if (!account) {
      throw redirect({
        to: '/onboarding',
      })
    }

    return {
      account,
    }
  },

  component: ProfilePage,
})

function ProfilePage() {
  const router = useRouter()
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
    // Restore the last server-saved values when editing is cancelled.
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

    // Prevent duplicate save requests.
    if (isSaving) {
      return
    }

    setError(null)
    setSuccess(false)
    setIsSaving(true)

    try {
      await updatePersonalAccount({
        data: {
          firstName,
          lastName,

          // Optional fields are explicitly converted to null when
          // cleared, so the backend removes their stored values.
          contactEmail: contactEmail.trim() || null,
          bio: bio.trim() || null,
        },
      });

      // Refresh the route data from the server so `account` becomes
      // the new source of truth without a browser page refresh.
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
    <main>
      <div>
        <div>
          <h1>Profile</h1>
          <p>Manage your personal account information.</p>
        </div>

        {!isEditing ? (
          <div>
            <div>
              <strong>First name</strong>
              <p>{account.firstName}</p>
            </div>

            <div>
              <strong>Last name</strong>
              <p>{account.lastName}</p>
            </div>

            <div>
              <strong>Role</strong>
              <p>
                {account.role === 'property_owner'
                  ? 'Property Owner'
                  : 'Realtor'}
              </p>
            </div>

            <div>
              <strong>Contact email</strong>
              <p>{account.contactEmail || 'Not provided'}</p>
            </div>

            <div>
              <strong>Bio</strong>
              <p>{account.bio || 'Not provided'}</p>
            </div>

            {success ? (
              <p role="status">Profile updated successfully.</p>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setError(null)
                setSuccess(false)
                setIsEditing(true)
              }}
            >
              Edit profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="profile-first-name">First name</label>
              <input
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

            <div>
              <label htmlFor="profile-last-name">Last name</label>
              <input
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

            <div>
              <label htmlFor="profile-role">Role</label>
              <input
                id="profile-role"
                type="text"
                value={
                  account.role === 'property_owner'
                    ? 'Property Owner'
                    : 'Realtor'
                }
                disabled
                readOnly
              />
            </div>

            <div>
              <label htmlFor="profile-contact-email">Contact email</label>
              <input
                id="profile-contact-email"
                name="contactEmail"
                type="email"
                autoComplete="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                disabled={isSaving}
              />
            </div>

            <div>
              <label htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio"
                name="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                disabled={isSaving}
                rows={5}
              />
            </div>

            {error ? <p role="alert">{error}</p> : null}

            <div>
              <button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}