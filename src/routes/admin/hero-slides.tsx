import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/hero-slides')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/homepage', search: { tab: 'hero-slides' } })
  },
})
