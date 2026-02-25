// src/features/auth/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../../shared/store/authStore'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to login but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
