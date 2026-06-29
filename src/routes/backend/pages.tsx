import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/pages')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/content', search: { tab: 'pages' } })
  },
})
