import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/data-transfer')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/settings', search: { tab: 'data-transfer' } })
  },
})
