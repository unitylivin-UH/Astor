import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/feature-cards')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/homepage', search: { tab: 'feature-cards' } })
  },
})
