import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/products')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/catalog', search: { tab: 'products' } })
  },
})
