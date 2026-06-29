import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/lifestyle-cards')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/homepage', search: { tab: 'lifestyle-cards' } })
  },
})
