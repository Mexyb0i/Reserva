import { Navigate, Outlet } from 'react-router-dom'
import AsyncState from '../components/ui/AsyncState'
import useAsyncResource from '../hooks/useAsyncResource'
import { ownerService } from '../services/ownerService'

function OwnerApprovalRoute() {
  const { data, isLoading, error, reload } = useAsyncResource(ownerService.getApplicationStatus)

  if (isLoading || error) {
    return <AsyncState loading={isLoading} error={error} onRetry={reload} />
  }

  if (!data) return <Navigate to="/owner/register" replace />
  if (data.status !== 'Approved') return <Navigate to="/owner/application" replace />

  return <Outlet />
}

export default OwnerApprovalRoute
