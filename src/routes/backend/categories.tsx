import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/categories')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/catalog', search: { tab: 'categories' } })
  },
})
