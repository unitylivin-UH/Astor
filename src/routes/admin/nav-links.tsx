import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/nav-links')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/content', search: { tab: 'nav-links' } })
  },
})
