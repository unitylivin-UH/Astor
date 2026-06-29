import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/orders')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/commerce', search: { tab: 'orders' } })
  },
})
