import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/email-templates')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/communications', search: { tab: 'email-templates' } })
  },
})
