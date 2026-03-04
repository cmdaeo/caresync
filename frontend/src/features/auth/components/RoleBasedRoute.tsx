// src/features/auth/components/RoleBasedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../../shared/store/authStore'

interface RoleBasedRouteProps {
  allowedRoles: string[]
  children: React.ReactNode
}

/** Returns the default dashboard path for a given role */
export function dashboardPathForRole(role?: string): string {
  switch (role) {
    case 'caregiver':
      return '/app/caregiver'
    case 'healthcare_provider':
      return '/app/caregiver'
    default:
      return '/app/patient'
  }
}

/**
 * RBAC guard — sits *inside* ProtectedRoute (auth is already verified).
 * If the user's role is not in `allowedRoles`, they are redirected
 * to their own role-appropriate dashboard instead of seeing a 403.
 */
export const RoleBasedRoute = ({ allowedRoles, children }: RoleBasedRouteProps) => {
  const user = useAuthStore((state) => state.user)
  const role = user?.role ?? 'patient'

  if (!allowedRoles.includes(role)) {
    return <Navigate to={dashboardPathForRole(role)} replace />
  }

  return <>{children}</>
}
