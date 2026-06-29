import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/checkout')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/commerce', search: { tab: 'checkout' } })
  },
})
