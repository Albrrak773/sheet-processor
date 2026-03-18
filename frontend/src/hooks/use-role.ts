import { useUser } from "@clerk/tanstack-react-start"

/**
 * Get the user's role from Clerk publicMetadata.
 * Returns undefined if not signed in or no role set.
 */
export function useUserRole(): string | undefined {
  const { user } = useUser()

  if (!user) {
    return undefined
  }

  const publicMetadata = user.publicMetadata as Record<string, unknown>
  const role = publicMetadata.role

  if (typeof role === "string") {
    return role
  }

  return undefined
}

/**
 * Check if the current user has admin role.
 * Returns false if not signed in or not admin.
 */
export function useIsAdmin(): boolean {
  const role = useUserRole()
  return role === "admin"
}
