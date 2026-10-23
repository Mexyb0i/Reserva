import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onNavigate={closeSidebar} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-3 sm:p-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
