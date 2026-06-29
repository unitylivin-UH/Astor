import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboard } from '@/admin/AdminDashboard'

export const Route = createFileRoute('/backend/')({
  component: AdminDashboard,
})
