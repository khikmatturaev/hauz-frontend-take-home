import { queryOptions } from '@tanstack/react-query'
import { getCurrentUser } from '#/lib/server/auth'
import { getPersonalAccount } from '#/lib/server/personal-account'

export interface AuthState {
  user: Awaited<ReturnType<typeof getCurrentUser>>
  account: Awaited<ReturnType<typeof getPersonalAccount>>
}

export const authStateQueryKey = ['auth-state'] as const

export const authStateQueryOptions = () =>
  queryOptions<AuthState>({
    queryKey: authStateQueryKey,
    queryFn: async (): Promise<AuthState> => {
      const user = await getCurrentUser()

      if (!user) {
        return {
          user: null,
          account: null,
        }
      }

      const account = await getPersonalAccount()

      return {
        user,
        account,
      }
    },
    staleTime: 60_000,
  })