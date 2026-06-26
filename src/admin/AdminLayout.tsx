import { Navigate, Outlet } from '@tanstack/react-router'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { isSupabaseConfigured } from '@/integrations/supabase/client'
import { AdminShell } from '@/admin/AdminShell'
import { AdminLoadingState } from '@/admin/components/AdminPageHeading'
import '@/admin/admin-theme.css'

export function AdminLayout() {
  const { loading, session, isAdmin } = useAdminAuth()

  if (!isSupabaseConfigured()) {
    return (
      <div className="admin-root flex min-h-screen items-center justify-center p-6">
        <div className="admin-card max-w-lg p-6 text-center">
          <h1 className="text-lg font-semibold">Supabase not configured</h1>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file, then restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-root">
        <AdminLoadingState />
      </div>
    )
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" />
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
}
