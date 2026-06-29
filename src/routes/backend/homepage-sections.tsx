import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/homepage-sections')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/homepage', search: { tab: 'homepage-sections' } })
  },
})
