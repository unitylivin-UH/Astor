import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/checkout')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/commerce', search: { tab: 'checkout' } })
  },
})
