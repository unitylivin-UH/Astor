import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/hero-slides')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/homepage', search: { tab: 'hero-slides' } })
  },
})
