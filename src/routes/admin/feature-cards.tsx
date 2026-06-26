import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/feature-cards')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/homepage', search: { tab: 'feature-cards' } })
  },
})
