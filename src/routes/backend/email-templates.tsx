import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/email-templates')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/communications', search: { tab: 'email-templates' } })
  },
})
