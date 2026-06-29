import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { AdminLayout } from '@/admin/AdminLayout'

export const Route = createFileRoute('/backend')({
  component: AdminRouteWrapper,
})

function AdminRouteWrapper() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (pathname === '/backend/login') return <Outlet />
  return <AdminLayout />
}
