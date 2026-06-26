import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/lifestyle-cards')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/homepage', search: { tab: 'lifestyle-cards' } })
  },
})
