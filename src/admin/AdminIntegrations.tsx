import { useCallback, useEffect, useState } from 'react'
import { CreditCard, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import { useCms } from '@/contexts/CmsContext'
import { BrandedSelect } from '@/components/ui/BrandedSelect'
import { adminBtnPrimary, adminInput, adminLabel } from '@/admin/adminClassNames'

export function AdminIntegrations() {
  const { refetchCms } = useCms()
  const [publishableKey, setPublishableKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [mode, setMode] = useState<'test' | 'live'>('test')
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const sb = tryGetSupabase()
    if (!sb) return
    const { data } = await sb.from('site_settings').select('key, value').in('key', [
      'stripe_publishable_key',
      'stripe_mode',
      'stripe_enabled',
    ])
    for (const row of data ?? []) {
      if (row.key === 'stripe_publishable_key') setPublishableKey(row.value)
      if (row.key === 'stripe_mode') setMode(row.value === 'live' ? 'live' : 'test')
      if (row.key === 'stripe_enabled') setEnabled(row.value === 'true')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function savePublicSettings() {
    const sb = tryGetSupabase()
    if (!sb) return
    setSaving(true)
    await sb.from('site_settings').upsert([
      { key: 'stripe_publishable_key', value: publishableKey.trim() },
      { key: 'stripe_mode', value: mode },
      { key: 'stripe_enabled', value: enabled ? 'true' : 'false' },
    ])
    setSaving(false)
    toast.success('Stripe settings saved')
    await refetchCms()
  }

  async function saveSecretKey() {
    if (!secretKey.trim() && !webhookSecret.trim()) {
      toast.error('Enter a secret key or webhook secret')
      return
    }
    const sb = tryGetSupabase()
    if (!sb) return
    setSaving(true)
    const { data: session } = await sb.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stripe-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        ...(secretKey.trim() ? { secret_key: secretKey.trim() } : {}),
        ...(webhookSecret.trim() ? { webhook_secret: webhookSecret.trim() } : {}),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error((err as { error?: string }).error ?? 'Failed to save secrets')
      return
    }
    setSecretKey('')
    setWebhookSecret('')
    toast.success('Secrets stored securely on server')
  }

  if (loading) return <p className="p-6 text-sm text-[var(--admin-muted)]">Loading…</p>

  return (
    <div className="space-y-6">

      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--admin-radius)] bg-[var(--admin-primary-muted)] text-[var(--admin-primary)]">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Stripe</h2>
            <p className="text-sm text-[var(--admin-muted)]">Checkout Sessions — recommended for go-live</p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enable Stripe checkout
        </label>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <label className={adminLabel}>Mode</label>
            <BrandedSelect
              value={mode}
              onValueChange={(value) => setMode(value as 'test' | 'live')}
              options={[
                { value: 'test', label: 'Test' },
                { value: 'live', label: 'Live' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className={adminLabel}>Publishable key (pk_test_… / pk_live_…)</label>
            <input className={adminInput} value={publishableKey} onChange={(e) => setPublishableKey(e.target.value)} placeholder="pk_test_..." />
          </div>
        </div>

        <button type="button" className={adminBtnPrimary} disabled={saving} onClick={() => void savePublicSettings()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save public settings
        </button>

        <hr className="border-[var(--admin-border)]" />

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <label className={adminLabel}>Secret key (sk_test_… / sk_live_…)</label>
            <input
              type="password"
              className={adminInput}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Stored server-side — never exposed to storefront"
            />
            <p className="text-xs text-[var(--admin-muted)]">Sent to edge function and saved in private_settings. Not readable from the browser after save.</p>
          </div>

          <div className="space-y-2">
            <label className={adminLabel}>Webhook signing secret (whsec_…)</label>
            <input
              type="password"
              className={adminInput}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="From Stripe Dashboard → Webhooks"
            />
            <p className="text-xs text-[var(--admin-muted)]">
              Endpoint URL: <code className="rounded bg-[var(--admin-primary-muted)] px-1">{import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook</code>
            </p>
          </div>
        </div>

        <button type="button" className={adminBtnPrimary} disabled={saving} onClick={() => void saveSecretKey()}>
          Save server secrets
        </button>
      </div>
    </div>
  )
}
