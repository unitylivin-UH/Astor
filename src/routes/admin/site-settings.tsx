import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/site-settings')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/settings', search: { tab: 'site-settings' } })
  },
})
