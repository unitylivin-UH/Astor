import { useEffect, useRef } from 'react'
import { useCookieConsent } from '@/contexts/CookieConsentContext'
import { useCms } from '@/contexts/CmsContext'

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

export function GoogleTagManager() {
  const { consent } = useCookieConsent()
  const { snapshot } = useCms()
  const loadedRef = useRef(false)
  const containerId = snapshot.siteSettings.gtm_container_id?.trim()

  useEffect(() => {
    if (!containerId || !consent?.analytics || loadedRef.current) return
    loadedRef.current = true
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`
    document.head.appendChild(script)
  }, [consent?.analytics, containerId])

  if (!containerId || !consent?.analytics) return null

  return (
    <noscript>
      <iframe
        title="Google Tag Manager"
        src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}
