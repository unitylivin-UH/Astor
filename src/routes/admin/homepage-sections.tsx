import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/homepage-sections')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/homepage', search: { tab: 'homepage-sections' } })
  },
})
