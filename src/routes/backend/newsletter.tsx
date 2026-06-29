import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/newsletter')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/communications', search: { tab: 'newsletter' } })
  },
})
