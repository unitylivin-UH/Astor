import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/integrations')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/commerce', search: { tab: 'integrations' } })
  },
})
