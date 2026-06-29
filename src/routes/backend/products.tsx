import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/products')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/catalog', search: { tab: 'products' } })
  },
})
