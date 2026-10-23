import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import FacilitiesPage from './pages/FacilitiesPage'
import SchedulePage from './pages/SchedulePage'
import ConfirmBookingPage from './pages/ConfirmBookingPage'
import FeedbackPage from './pages/FeedbackPage'
import MessagePage from './pages/MessagePage'
import ReservedSchedulePage from './pages/ReservedSchedulePage'
import ReservationHistoryPage from './pages/ReservationHistoryPage'
import MyFriendsPage from './pages/MyFriendsPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import OwnerLayout from './layouts/OwnerLayout'
import OwnerDashboardPage from './pages/OwnerDashboardPage'
import OwnerFacilitiesPage from './pages/OwnerFacilitiesPage'
import OwnerReservationsPage from './pages/OwnerReservationsPage'
import OwnerAvailabilityPage from './pages/OwnerAvailabilityPage'
import OwnerEarningsPage from './pages/OwnerEarningsPage'
import OwnerCalendarPage from './pages/OwnerCalendarPage'
import OwnerCustomersPage from './pages/OwnerCustomersPage'
import OwnerInquiriesPage from './pages/OwnerInquiriesPage'
import OwnerRegisterPage from './pages/OwnerRegisterPage'
import OwnerApplicationPage from './pages/OwnerApplicationPage'
import OwnerApprovalRoute from './routes/OwnerApprovalRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import BookingRoute from './routes/BookingRoute'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminApplicationsPage from './pages/AdminApplicationsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminFacilitiesPage from './pages/AdminFacilitiesPage'
import AdminReportsPage from './pages/AdminReportsPage'
import AdminAnnouncementsPage from './pages/AdminAnnouncementsPage'
import AdminPaymentsPage from './pages/AdminPaymentsPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminRevenuePage from './pages/AdminRevenuePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<PublicLayout />}>
        <Route path="/sports-facilities" element={<FacilitiesPage />} />
      </Route>
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="/auth/signup" replace />} />
        <Route path=":view" element={<AuthPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="facilities" element={<AdminFacilitiesPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="revenue" element={<AdminRevenuePage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/owner/register" element={<OwnerRegisterPage />} />
        <Route path="/owner/application" element={<OwnerApplicationPage />} />
        <Route path="/owner" element={<OwnerLayout />}>
          <Route element={<OwnerApprovalRoute />}>
            <Route index element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboardPage />} />
            <Route path="facilities" element={<OwnerFacilitiesPage />} />
            <Route path="requests" element={<OwnerReservationsPage />} />
            <Route path="reservations" element={<OwnerReservationsPage />} />
            <Route path="calendar" element={<OwnerCalendarPage />} />
            <Route path="earnings" element={<OwnerEarningsPage />} />
            <Route path="customers" element={<OwnerCustomersPage />} />
            <Route path="inquiries" element={<OwnerInquiriesPage />} />
            <Route path="availability" element={<OwnerAvailabilityPage />} />
          </Route>
        </Route>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/message-facility" element={<MessagePage />} />
          <Route path="/reserved-schedule" element={<ReservedSchedulePage />} />
          <Route path="/reservation-history" element={<ReservationHistoryPage />} />
          <Route path="/my-friends" element={<MyFriendsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>
      <Route element={<BookingRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/choose-schedule" element={<SchedulePage />} />
          <Route path="/confirm-booking" element={<ConfirmBookingPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
