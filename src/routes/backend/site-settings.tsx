import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/site-settings')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/settings', search: { tab: 'site-settings' } })
  },
})
