import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, tryGetSupabase } from '@/integrations/supabase/client'
import { fetchAdminSession } from '@/admin/lib/adminRpc'

type AdminRole = 'owner' | 'admin' | 'editor' | 'viewer'

type AdminAuthContextValue = {
  session: Session | null
  loading: boolean
  isAdmin: boolean
  role: AdminRole | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [role, setRole] = useState<AdminRole | null>(null)

  const refreshAdminStatus = useCallback(async (currentSession: Session | null) => {
    if (!currentSession || !isSupabaseConfigured()) {
      setIsAdmin(false)
      setRole(null)
      return
    }

    if (!tryGetSupabase()) {
      setIsAdmin(false)
      setRole(null)
      return
    }

    try {
      const result = await fetchAdminSession()
      if (result.role && ['owner', 'admin', 'editor', 'viewer'].includes(result.role)) {
        setIsAdmin(result.isAdmin)
        setRole(result.role as AdminRole)
      } else {
        setIsAdmin(false)
        setRole(null)
      }
    } catch {
      setIsAdmin(false)
      setRole(null)
    }
  }, [])

  useEffect(() => {
    const supabase = tryGetSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      void refreshAdminStatus(data.session).finally(() => setLoading(false))
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void refreshAdminStatus(nextSession)
    })

    return () => sub.subscription.unsubscribe()
  }, [refreshAdminStatus])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = tryGetSupabase()
    if (!supabase) return { error: 'Supabase is not configured' }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    const { data: sessionData } = await supabase.auth.getSession()
    await refreshAdminStatus(sessionData.session)
    return { error: null }
  }, [refreshAdminStatus])

  const signOut = useCallback(async () => {
    const supabase = tryGetSupabase()
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
    setRole(null)
  }, [])

  const value = useMemo(
    () => ({ session, loading, isAdmin, role, signIn, signOut }),
    [session, loading, isAdmin, role, signIn, signOut],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
