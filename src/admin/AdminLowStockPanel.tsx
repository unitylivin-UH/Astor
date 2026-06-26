import { useEffect, useState } from 'react'
import { tryGetSupabase } from '@/integrations/supabase/client'
import { AdminPageHeading } from '@/admin/components/AdminPageHeading'

type LowStockItem = {
  id: string
  name: string
  slug: string
  kind: string
  stock: number
  variant_name: string | null
}

export function AdminLowStockPanel() {
  const [items, setItems] = useState<LowStockItem[]>([])
  const [threshold, setThreshold] = useState(5)

  useEffect(() => {
    void tryGetSupabase().rpc('rpc_list_low_stock_products').then(({ data }) => {
      if (data && (data as { ok: boolean }).ok) {
        const result = data as { items: LowStockItem[]; threshold: number }
        setItems(result.items ?? [])
        setThreshold(result.threshold ?? 5)
      }
    })
  }, [])

  if (items.length === 0) return null

  return (
    <section className="mt-8 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">Low stock (≤ {threshold})</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.slice(0, 8).map((item) => (
          <li key={`${item.id}-${item.variant_name ?? 'base'}`} className="flex justify-between gap-2">
            <span className="truncate">{item.name}</span>
            <span className="shrink-0 font-semibold text-amber-700">{item.stock} left</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
