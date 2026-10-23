import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authService } from '../services/authService'

function BookingRoute() {
  const location = useLocation()

  if (!authService.isAuthenticated()) {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}

export default BookingRoute
