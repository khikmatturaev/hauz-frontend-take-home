import type { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useNavigate,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { logout } from '#/lib/server/auth'
import { authStateQueryOptions } from '#/lib/client/auth-state'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'HAUZ — Find your place' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),

  // Load the current user on the server before the application
  // renders. This keeps the header correct after a hard refresh.
  beforeLoad: async ({ context }) => {
    // Auth state is shared through the request-scoped TanStack Query cache.
    // This avoids repeating Appwrite requests on every client-side navigation.
    return context.queryClient.ensureQueryData(authStateQueryOptions())
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
        <Header />
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function Header() {
  const navigate = useNavigate()
  const { user, account } = Route.useRouteContext()

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
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <a className="brand" href="/" aria-label="HAUZ home">
          <span className="brand-mark">H</span>
          <span>HAUZ</span>
        </a>

        <div className="header-actions">
          {user ? (
            <>
              <div className="user-chip">
                <span className="user-avatar">
                  {(account?.firstName || user.email).charAt(0).toUpperCase()}
                </span>
                <span className="user-name">{account?.firstName || user.email}</span>
              </div>
              <button className="button button-ghost" type="button" onClick={() => void handleLogout()}>
                Log out
              </button>
            </>
          ) : (
            <button
              className="button button-dark"
              type="button"
              onClick={() => {
                const currentPath =
                  window.location.pathname + window.location.search

                if (currentPath === '/') {
                  void navigate({
                    to: '/sign-in',
                    search: { redirect: undefined },
                  })
                  return
                }

                void navigate({
                  to: '/sign-in',
                  search: { redirect: currentPath },
                })
              }}
            >
              Sign in
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
