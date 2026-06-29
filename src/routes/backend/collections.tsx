import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/collections')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/catalog', search: { tab: 'collections' } })
  },
})
