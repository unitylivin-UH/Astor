import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/media')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/content', search: { tab: 'media' } })
  },
})
