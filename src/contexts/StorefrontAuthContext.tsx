import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { tryGetSupabase } from '@/integrations/supabase/client'

type StorefrontAuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const StorefrontAuthContext = createContext<StorefrontAuthContextValue | null>(null)

export function StorefrontAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = tryGetSupabase()
    if (!sb) {
      setLoading(false)
      return
    }

    void sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: sub } = sb.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = tryGetSupabase()
    if (!sb) return { error: 'Account sign-in requires Supabase configuration' }
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
    return error ? { error: error.message } : {}
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const sb = tryGetSupabase()
    if (!sb) return { error: 'Account sign-up requires Supabase configuration' }
    const { error } = await sb.auth.signUp({ email: email.trim(), password })
    return error ? { error: error.message } : {}
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const sb = tryGetSupabase()
    if (!sb) return { error: 'Password reset requires Supabase configuration' }
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    return error ? { error: error.message } : {}
  }, [])

  const signOut = useCallback(async () => {
    const sb = tryGetSupabase()
    if (sb) await sb.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({ user, session, loading, signIn, signUp, resetPassword, signOut }),
    [user, session, loading, signIn, signUp, resetPassword, signOut],
  )

  return <StorefrontAuthContext.Provider value={value}>{children}</StorefrontAuthContext.Provider>
}

export function useStorefrontAuth() {
  const ctx = useContext(StorefrontAuthContext)
  if (!ctx) throw new Error('useStorefrontAuth must be used within StorefrontAuthProvider')
  return ctx
}
