import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/nav-links')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/content', search: { tab: 'nav-links' } })
  },
})
