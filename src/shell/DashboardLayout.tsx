import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { ToastContainer } from '@/shared/components/Toast'

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-14 md:pb-0">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
      <ToastContainer />
    </div>
  )
}
