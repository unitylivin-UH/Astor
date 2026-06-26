import type { ReactNode } from 'react'

export function AdminTabToolbar({ actions }: { actions?: ReactNode }) {
  if (!actions) return null
  return <div className="admin-toolbar">{actions}</div>
}
