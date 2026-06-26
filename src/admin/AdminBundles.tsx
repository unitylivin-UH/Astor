import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'
import { useAdminCatalogSync } from '@/admin/hooks/useAdminCatalogSync'
import { SLUG_REGEX, slugify } from '@/lib/utils'
import { AdminSheet } from '@/admin/components/AdminSheet'
import { AdminBulkToolbar } from '@/admin/components/AdminBulkToolbar'
import { EntityDetailSheet } from '@/admin/components/EntityDetailSheet'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { AdminErrorBanner, AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTabToolbar } from '@/admin/components/AdminTabToolbar'
import { ImageUploadField } from '@/admin/components/ImageUploadField'
import { RichTextEditor } from '@/admin/components/RichTextEditor'
import { sanitizeMarketingHtml } from '@/lib/sanitizeHtml'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { useBulkSelection } from '@/admin/hooks/useBulkSelection'
import { BrandedSelect } from '@/components/ui/BrandedSelect'
import { SearchableBrandedSelect } from '@/components/ui/SearchableBrandedSelect'
import { useFormatPrice } from '@/lib/currency'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'
import { AdminClickableTableRow, AdminTableStopCell } from '@/admin/components/AdminClickableTableRow'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'
import { duplicateCopyLabel, duplicateCopySku, duplicateCopySlug } from '@/admin/lib/duplicateRecord'

type BundleRow = Database['public']['Tables']['product_bundles']['Row']
type BundleItemRow = Database['public']['Tables']['product_bundle_items']['Row']
type ProductRow = Pick<Database['public']['Tables']['products']['Row'], 'id' | 'name' | 'slug' | 'published'>
type VariantRow = Pick<Database['public']['Tables']['product_variants']['Row'], 'id' | 'product_id' | 'name' | 'is_active'>

type BundleItemForm = {
  key: string
  product_id: string
  variant_id: string
  quantity: string
  sort_order: string
  label: string
}

type BundleForm = {
  name: string
  slug: string
  overview: string
  description: string
  price: string
  compare_at_price: string
  sku: string
  image_url: string
  badge: string
  published: boolean
  sort_order: string
  items: BundleItemForm[]
}

const emptyItem = (sortOrder = 0): BundleItemForm => ({
  key: crypto.randomUUID(),
  product_id: '',
  variant_id: '',
  quantity: '1',
  sort_order: String(sortOrder),
  label: '',
})

const emptyForm = (): BundleForm => ({
  name: '',
  slug: '',
  overview: '',
  description: '',
  price: '',
  compare_at_price: '',
  sku: '',
  image_url: '',
  badge: '',
  published: false,
  sort_order: '0',
  items: [emptyItem()],
})

export function AdminBundles() {
  const syncCatalog = useAdminCatalogSync()
  const formatPrice = useFormatPrice()
  const [rows, setRows] = useState<BundleRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, VariantRow[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BundleRow | null>(null)
  const [form, setForm] = useState<BundleForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<BundleRow | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  const pagination = useAdminTablePagination(rows.length)
  const pageRows = rows.slice(pagination.start, pagination.end)
  const bulk = useBulkSelection(pageRows.map((r) => r.id))

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: `${p.name}${p.published ? '' : ' (draft)'}` })),
    [products],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = tryGetSupabase()
    if (!supabase) {
      setError('Supabase is not configured')
      setLoading(false)
      return
    }

    try {
      const [bundlesRes, productsRes, variantsRes] = await Promise.all([
        supabase.from('product_bundles').select('*').order('sort_order'),
        supabase.from('products').select('id, name, slug, published').order('name'),
        supabase.from('product_variants').select('id, product_id, name, is_active').eq('is_active', true).order('sort_order'),
      ])

      if (bundlesRes.error) throw new Error(bundlesRes.error.message)
      if (productsRes.error) throw new Error(productsRes.error.message)
      if (variantsRes.error) throw new Error(variantsRes.error.message)

      setRows(bundlesRes.data ?? [])
      setProducts(productsRes.data ?? [])

      const grouped: Record<string, VariantRow[]> = {}
      for (const variant of variantsRes.data ?? []) {
        grouped[variant.product_id] = [...(grouped[variant.product_id] ?? []), variant]
      }
      setVariantsByProduct(grouped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bundles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function loadBundleItems(bundleId: string): Promise<BundleItemForm[]> {
    const { data, error: fetchError } = await tryGetSupabase()
      .from('product_bundle_items')
      .select('*')
      .eq('bundle_id', bundleId)
      .order('sort_order')

    if (fetchError) throw new Error(fetchError.message)
    return (data ?? []).map((item: BundleItemRow, index) => ({
      key: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id ?? '',
      quantity: String(item.quantity),
      sort_order: String(item.sort_order ?? index),
      label: item.label ?? '',
    }))
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  async function openEdit(row: BundleRow) {
    setEditing(row)
    try {
      const items = await loadBundleItems(row.id)
      setForm({
        name: row.name,
        slug: row.slug,
        overview: row.overview ?? '',
        description: row.description ?? '',
        price: String(row.price),
        compare_at_price: row.compare_at_price != null ? String(row.compare_at_price) : '',
        sku: row.sku ?? '',
        image_url: row.image_url ?? '',
        badge: row.badge ?? '',
        published: row.published,
        sort_order: String(row.sort_order),
        items: items.length > 0 ? items : [emptyItem()],
      })
      setModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bundle items')
    }
  }

  async function openDuplicate(row: BundleRow) {
    setEditing(null)
    try {
      const items = await loadBundleItems(row.id)
      setForm({
        name: duplicateCopyLabel(row.name),
        slug: duplicateCopySlug(row.slug),
        overview: row.overview ?? '',
        description: row.description ?? '',
        price: String(row.price),
        compare_at_price: row.compare_at_price != null ? String(row.compare_at_price) : '',
        sku: row.sku ? duplicateCopySku(row.sku) : '',
        image_url: row.image_url ?? '',
        badge: row.badge ?? '',
        published: row.published,
        sort_order: String(row.sort_order),
        items:
          items.length > 0
            ? items.map(({ key: _key, ...item }) => ({ ...item, key: crypto.randomUUID() }))
            : [emptyItem()],
      })
      setModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bundle items')
    }
  }

  async function save() {
    if (!form.name.trim()) return setError('Name is required.')
    if (!SLUG_REGEX.test(form.slug)) return setError('Valid slug is required.')
    if (!form.price.trim() || Number.isNaN(Number(form.price))) return setError('Valid price is required.')
    if (form.items.length === 0) return setError('Add at least one bundle item.')
    if (form.items.some((item) => !item.product_id)) return setError('Each bundle item needs a product.')

    setSaving(true)
    setError(null)

    const supabase = tryGetSupabase()
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      overview: form.overview.trim() || null,
      description: sanitizeMarketingHtml(form.description) || null,
      price: Number(form.price),
      compare_at_price: form.compare_at_price.trim() ? Number(form.compare_at_price) : null,
      sku: form.sku.trim() || null,
      image_url: form.image_url.trim() || null,
      badge: form.badge.trim() || null,
      published: form.published,
      sort_order: Number(form.sort_order) || 0,
      updated_at: new Date().toISOString(),
    }

    const bundleResult = editing
      ? await supabase.from('product_bundles').update(payload).eq('id', editing.id).select('id').single()
      : await supabase.from('product_bundles').insert(payload).select('id').single()

    if (bundleResult.error || !bundleResult.data) {
      setSaving(false)
      return setError(bundleResult.error?.message ?? 'Failed to save bundle')
    }

    const bundleId = bundleResult.data.id
    const { error: deleteError } = await supabase.from('product_bundle_items').delete().eq('bundle_id', bundleId)
    if (deleteError) {
      setSaving(false)
      return setError(deleteError.message)
    }

    const itemPayload = form.items.map((item, index) => ({
      bundle_id: bundleId,
      product_id: item.product_id,
      variant_id: item.variant_id.trim() || null,
      quantity: Math.max(1, Number(item.quantity) || 1),
      sort_order: Number(item.sort_order) || index,
      label: item.label.trim() || null,
    }))

    const { error: itemsError } = await supabase.from('product_bundle_items').insert(itemPayload)
    setSaving(false)
    if (itemsError) return setError(itemsError.message)

    toast.success(editing ? 'Bundle updated' : 'Bundle created')
    setModalOpen(false)
    await refresh()
    await syncCatalog()
  }

  async function remove(row: BundleRow) {
    if (!window.confirm(`Delete "${row.name}"?`)) return
    const { error: deleteError } = await tryGetSupabase().from('product_bundles').delete().eq('id', row.id)
    if (deleteError) return setError(deleteError.message)
    toast.success('Bundle deleted')
    await refresh()
    await syncCatalog()
  }

  async function bulkDelete() {
    if (bulk.selectedIds.length === 0) return
    if (!window.confirm(`Delete ${bulk.selectedIds.length} bundle(s)?`)) return
    setBulkBusy(true)
    const { error: deleteError } = await tryGetSupabase().from('product_bundles').delete().in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (deleteError) return setError(deleteError.message)
    toast.success(`${bulk.selectedIds.length} bundle(s) deleted`)
    bulk.clear()
    await refresh()
    await syncCatalog()
  }

  async function bulkSetPublished(published: boolean) {
    if (bulk.selectedIds.length === 0) return
    setBulkBusy(true)
    const { error: updateError } = await tryGetSupabase()
      .from('product_bundles')
      .update({ published, updated_at: new Date().toISOString() })
      .in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (updateError) return setError(updateError.message)
    toast.success(published ? 'Bundles published' : 'Bundles unpublished')
    bulk.clear()
    await refresh()
    await syncCatalog()
  }

  function updateItem(key: string, patch: Partial<BundleItemForm>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }))
  }

  if (loading) return <AdminLoadingState />

  return (
    <div>
      <AdminTabToolbar
        actions={
          <>
            <button type="button" className={adminBtnSecondary} onClick={() => void refresh()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button type="button" className={adminBtnPrimary} onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add bundle
            </button>
          </>
        }
      />
      <AdminErrorBanner message={error} />
      <AdminBulkToolbar
        selectedCount={bulk.selectedIds.length}
        onClear={bulk.clear}
        onDelete={() => void bulkDelete()}
        onPublish={() => void bulkSetPublished(true)}
        onUnpublish={() => void bulkSetPublished(false)}
        busy={bulkBusy}
      />
      <div className="admin-table-frame">
        <div className="admin-table-wrap">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--admin-surface)] text-[var(--admin-muted)]">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={bulk.allSelected} onChange={bulk.toggleAll} aria-label="Select all on page" />
                </th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Published</th>
                <th className={adminTableActionsHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <AdminClickableTableRow key={row.id} onOpen={() => setDetail(row)}>
                  <AdminTableStopCell className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={bulk.selected.has(row.id)}
                      onChange={() => bulk.toggle(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </AdminTableStopCell>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{formatPrice(Number(row.price))}</td>
                  <td className="px-4 py-3">{row.published ? 'Yes' : 'No'}</td>
                  <AdminTableStopCell className={adminTableActionsCellClass}>
                    <AdminRowActions
                      label={`Actions for ${row.name}`}
                      actions={crudRowActions({
                        onView: () => setDetail(row),
                        onEdit: () => void openEdit(row),
                        onDuplicate: () => void openDuplicate(row),
                        onDelete: () => void remove(row),
                      })}
                    />
                  </AdminTableStopCell>
                </AdminClickableTableRow>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--admin-border)] p-4">
          <AdminTablePagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </div>
      </div>

      <AdminSheet
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit bundle' : 'Create bundle'}
        onSave={() => void save()}
        saving={saving}
        size="xl"
      >
        <div className="space-y-4">
          <div>
            <label className={adminLabel}>Name</label>
            <input
              className={adminInput}
              value={form.name}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  name: e.target.value,
                  slug: current.slug || slugify(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <label className={adminLabel}>Slug</label>
            <input className={adminInput} value={form.slug} onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={adminLabel}>Price</label>
              <input className={adminInput} value={form.price} onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))} />
            </div>
            <div>
              <label className={adminLabel}>Compare at price</label>
              <input
                className={adminInput}
                value={form.compare_at_price}
                onChange={(e) => setForm((c) => ({ ...c, compare_at_price: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className={adminLabel}>Overview</label>
            <input className={adminInput} value={form.overview} onChange={(e) => setForm((c) => ({ ...c, overview: e.target.value }))} />
          </div>
          <div>
            <label className={adminLabel}>Description</label>
            <RichTextEditor value={form.description} onChange={(description) => setForm((c) => ({ ...c, description }))} />
          </div>
          <ImageUploadField label="Bundle image" value={form.image_url} onChange={(image_url) => setForm((c) => ({ ...c, image_url }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={adminLabel}>SKU</label>
              <input className={adminInput} value={form.sku} onChange={(e) => setForm((c) => ({ ...c, sku: e.target.value }))} />
            </div>
            <div>
              <label className={adminLabel}>Badge</label>
              <input className={adminInput} value={form.badge} onChange={(e) => setForm((c) => ({ ...c, badge: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={adminLabel}>Sort order</label>
              <input
                className={adminInput}
                value={form.sort_order}
                onChange={(e) => setForm((c) => ({ ...c, sort_order: e.target.value }))}
              />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm((c) => ({ ...c, published: e.target.checked }))} />
              Published
            </label>
          </div>

          <div className="rounded-lg border border-[var(--admin-border)] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Bundle items</h3>
              <button
                type="button"
                className={adminBtnSecondary}
                onClick={() => setForm((c) => ({ ...c, items: [...c.items, emptyItem(c.items.length)] }))}
              >
                <Plus className="h-4 w-4" />
                Add item
              </button>
            </div>
            <div className="space-y-4">
              {form.items.map((item, index) => {
                const variants = item.product_id ? variantsByProduct[item.product_id] ?? [] : []
                return (
                  <div key={item.key} className="rounded-md border border-[var(--admin-border)] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-[var(--admin-muted)]">Item {index + 1}</p>
                      {form.items.length > 1 ? (
                        <button
                          type="button"
                          className="text-[var(--admin-danger)]"
                          aria-label="Remove item"
                          onClick={() => setForm((c) => ({ ...c, items: c.items.filter((row) => row.key !== item.key) }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={adminLabel}>Product</label>
                        <SearchableBrandedSelect
                          value={item.product_id}
                          onValueChange={(product_id) => updateItem(item.key, { product_id, variant_id: '' })}
                          options={productOptions}
                          placeholder="Select product"
                          searchPlaceholder="Search products…"
                          allowEmpty
                          emptyLabel="Select product"
                        />
                      </div>
                      <div>
                        <label className={adminLabel}>Fixed variant (optional)</label>
                        <BrandedSelect
                          value={item.variant_id}
                          onValueChange={(variant_id) => updateItem(item.key, { variant_id })}
                          options={variants.map((variant) => ({ value: variant.id, label: variant.name }))}
                          placeholder="Customer chooses"
                          allowEmpty
                          emptyLabel="Customer chooses"
                          disabled={!item.product_id}
                        />
                      </div>
                      <div>
                        <label className={adminLabel}>Label</label>
                        <input
                          className={adminInput}
                          value={item.label}
                          onChange={(e) => updateItem(item.key, { label: e.target.value })}
                          placeholder="e.g. Processor"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={adminLabel}>Qty</label>
                          <input
                            className={adminInput}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className={adminLabel}>Sort</label>
                          <input
                            className={adminInput}
                            value={item.sort_order}
                            onChange={(e) => updateItem(item.key, { sort_order: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </AdminSheet>

      <EntityDetailSheet
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title={detail?.name ?? 'Bundle'}
        fields={
          detail
            ? [
                { label: 'Slug', value: detail.slug },
                { label: 'Price', value: formatPrice(Number(detail.price)) },
                { label: 'Published', value: detail.published ? 'Yes' : 'No' },
                { label: 'Overview', value: detail.overview ?? '—' },
              ]
            : []
        }
      />
    </div>
  )
}
