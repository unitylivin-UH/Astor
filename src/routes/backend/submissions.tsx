import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/submissions')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/communications', search: { tab: 'submissions' } })
  },
})
