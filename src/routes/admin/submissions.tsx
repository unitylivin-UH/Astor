import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/submissions')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/communications', search: { tab: 'submissions' } })
  },
})
