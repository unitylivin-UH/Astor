import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/users')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/settings', search: { tab: 'users' } })
  },
})
