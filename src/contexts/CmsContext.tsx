import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CmsSnapshot } from '@/data/static-cms'
import { staticCmsSnapshot } from '@/data/static-cms'
import { loadCmsSnapshot, loadSiteSettingsMap } from '@/lib/cms/loadCmsSnapshot'
import { tryGetSupabase } from '@/integrations/supabase/client'

type CmsContextValue = {
  snapshot: CmsSnapshot
  mode: 'static' | 'live'
  cmsEmpty: boolean
  loading: boolean
  refetchCms: () => Promise<void>
}

const CmsContext = createContext<CmsContextValue | null>(null)

export function CmsProvider({ children, skipFetch = false }: { children: ReactNode; skipFetch?: boolean }) {
  const [snapshot, setSnapshot] = useState<CmsSnapshot>(staticCmsSnapshot)
  const [mode, setMode] = useState<'static' | 'live'>('static')
  const [cmsEmpty, setCmsEmpty] = useState(false)
  const [loading, setLoading] = useState(!skipFetch)

  const refetchCms = useCallback(async () => {
    const supabase = tryGetSupabase()
    if (skipFetch) {
      if (!supabase) return
      try {
        const siteSettings = await loadSiteSettingsMap(supabase)
        setSnapshot((prev) => ({
          ...prev,
          siteName: siteSettings.site_name ?? prev.siteName,
          logoText: siteSettings.logo_text ?? prev.logoText,
          siteSettings: { ...prev.siteSettings, ...siteSettings },
        }))
        setMode('live')
      } catch {
        /* keep existing snapshot */
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    const result = await loadCmsSnapshot(supabase)
    setSnapshot(result.snapshot)
    setMode(result.mode)
    setCmsEmpty(result.cmsEmpty)
    setLoading(false)
  }, [skipFetch])

  useEffect(() => {
    if (skipFetch) {
      setLoading(true)
      void refetchCms()
      return
    }
    void refetchCms()
  }, [refetchCms, skipFetch])

  const value = useMemo(
    () => ({ snapshot, mode, cmsEmpty, loading, refetchCms }),
    [snapshot, mode, cmsEmpty, loading, refetchCms],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) throw new Error('useCms must be used within CmsProvider')
  return ctx
}
