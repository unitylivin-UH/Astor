import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/data-transfer')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/settings', search: { tab: 'data-transfer' } })
  },
})
