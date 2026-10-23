import { Navigate, Outlet } from 'react-router-dom'

function ProtectedRoute() {
  const isAuthenticated = true

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
