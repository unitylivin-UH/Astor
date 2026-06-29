import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/integrations')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/commerce', search: { tab: 'integrations' } })
  },
})
