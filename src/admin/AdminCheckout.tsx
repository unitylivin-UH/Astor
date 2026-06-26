import { useCallback, useEffect, useState } from 'react'
import { FileText, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import { useCms } from '@/contexts/CmsContext'
import { adminBtnPrimary, adminInput, adminLabel } from '@/admin/adminClassNames'

type CheckoutMode = 'quote' | 'stripe'

export function AdminCheckout() {
  const { refetchCms } = useCms()
  const [mode, setMode] = useState<CheckoutMode>('quote')
  const [quoteEmail, setQuoteEmail] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const sb = tryGetSupabase()
    if (!sb) return
    const { data } = await sb.from('site_settings').select('key, value').in('key', ['checkout_mode', 'quote_notification_email', 'contact_notification_email'])
    for (const row of data ?? []) {
      if (row.key === 'checkout_mode') setMode(row.value === 'stripe' ? 'stripe' : 'quote')
      if (row.key === 'quote_notification_email') setQuoteEmail(row.value)
      if (row.key === 'contact_notification_email') setContactEmail(row.value)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function save() {
    if (mode === 'quote' && !quoteEmail.trim()) {
      toast.error('Quote notification email is required when quote mode is enabled')
      return
    }
    const sb = tryGetSupabase()
    if (!sb) return
    setSaving(true)
    await sb.from('site_settings').upsert([
      { key: 'checkout_mode', value: mode },
      { key: 'quote_notification_email', value: quoteEmail.trim() },
      { key: 'contact_notification_email', value: contactEmail.trim() },
    ])
    setSaving(false)
    toast.success('Checkout settings saved')
    await refetchCms()
  }

  if (loading) return <p className="p-6 text-sm text-[var(--admin-muted)]">Loading…</p>

  return (
    <div className="space-y-6">

      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--admin-radius)] bg-[var(--admin-primary-muted)] text-[var(--admin-primary)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Checkout mode</h2>
            <p className="text-sm text-[var(--admin-muted)]">Controls the primary action on the checkout page</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--admin-border)] p-4 has-[:checked]:border-[var(--admin-primary)]">
            <input
              type="radio"
              name="checkout_mode"
              checked={mode === 'quote'}
              onChange={() => setMode('quote')}
              className="mt-1"
            />
            <div>
              <p className="font-medium">Request a quote</p>
              <p className="text-sm text-[var(--admin-muted)]">
                Customers submit their cart for a quote. The cart is emailed to your team for follow-up — no payment at checkout.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--admin-border)] p-4 has-[:checked]:border-[var(--admin-primary)]">
            <input
              type="radio"
              name="checkout_mode"
              checked={mode === 'stripe'}
              onChange={() => setMode('stripe')}
              className="mt-1"
            />
            <div>
              <p className="font-medium">Pay with Stripe</p>
              <p className="text-sm text-[var(--admin-muted)]">
                Redirect customers to Stripe Checkout. Configure keys under Integrations.
              </p>
            </div>
          </label>
        </div>

        {mode === 'quote' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <label className={adminLabel}>Quote notification email</label>
              <input
                type="email"
                className={adminInput}
                value={quoteEmail}
                onChange={(e) => setQuoteEmail(e.target.value)}
                placeholder="sales@yourcompany.com"
              />
              <p className="text-xs text-[var(--admin-muted)]">
                Cart details are sent to this address when a customer requests a quote. Set <code className="rounded bg-[var(--admin-primary-muted)] px-1">RESEND_API_KEY</code> on your Supabase project to enable email delivery.
              </p>
            </div>

            <div className="space-y-2">
              <label className={adminLabel}>Contact form notification email</label>
              <input
                type="email"
                className={adminInput}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="hello@yourcompany.com"
              />
              <p className="text-xs text-[var(--admin-muted)]">
                Contact page submissions are sent to this address. Configure the contact form template under Email templates.
              </p>
            </div>
          </div>
        )}

        {mode === 'stripe' && (
          <div className="space-y-2">
            <label className={adminLabel}>Contact form notification email</label>
            <input
              type="email"
              className={adminInput}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="hello@yourcompany.com"
            />
            <p className="text-xs text-[var(--admin-muted)]">
              Contact page submissions are sent to this address. Configure the contact form template under Email templates.
            </p>
          </div>
        )}

        <button type="button" className={adminBtnPrimary} disabled={saving} onClick={() => void save()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save checkout settings
        </button>
      </div>
    </div>
  )
}
