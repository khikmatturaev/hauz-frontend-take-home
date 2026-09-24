import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext, useNavigate } from '@tanstack/react-router';
import appCss from '../styles.css?url';
import { getCurrentUser, logout } from '#/lib/server/auth';
import { getPersonalAccount } from '#/lib/server/personal-account';

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'HAUZ' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),

  // Load the current user on the server before the application
  // renders. This keeps the header correct after a hard refresh.
  beforeLoad: async () => {
    // Load authentication state on the server first so the header
    // has the correct signed-in/signed-out state on the first paint.
    const user = await getCurrentUser()

    if (!user) {
      return {
        user: null,
        account: null,
      }
    }

    // The display name comes from Personal Account because onboarding
    // stores the user's first name there, not in the Appwrite User name.
    const account = await getPersonalAccount()

    return {
      user,
      account,
    }
  },

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* The header is rendered above every route's page content. */}
        <Header />
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function Header() {
  const navigate = useNavigate();
  const { user, account } = Route.useRouteContext();

  const handleLogout = async () => {
    try {
      // Logout is handled on the server so the Appwrite session
      // secret never becomes accessible to browser JavaScript.
      await logout()
    } finally {
      // Reload the document so the root route runs beforeLoad again
      // and the header immediately receives the signed-out state.
      window.location.assign('/')
    }
  }

  return (
    <header>
      <nav>
        <a href="/">HAUZ</a>

        {user ? (
          <div>
            <span>{account?.firstName || user.email}</span>

            <button type="button" onClick={() => void handleLogout()}>
              Log out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              // Keep the original destination when the user came from a
              // protected or non-home page. The home page itself does not
              // need an explicit redirect because sign-in should decide
              // whether the user needs onboarding or should go to profile.
              const currentPath =
                window.location.pathname + window.location.search

              if (currentPath === '/') {
                // The home page does not need a redirect destination.
                // An empty redirect tells sign-in to choose between
                // onboarding and profile based on the Personal Account.
                void navigate({
                  to: '/sign-in',
                  search: {
                    redirect: undefined,
                  },
                })
                return
              }

              void navigate({
                to: '/sign-in',
                search: {
                  redirect: currentPath,
                },
              })
            }}
          >
            Sign in
          </button>
        )}
      </nav>
    </header>
  )
}