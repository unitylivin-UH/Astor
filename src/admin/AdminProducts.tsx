import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'
import { fetchAdminEditContext, listAdminProducts } from '@/admin/lib/adminRpc'
import { useAdminCatalogSync } from '@/admin/hooks/useAdminCatalogSync'
import { useFormatPrice, useCurrency } from '@/lib/currency'
import { SLUG_REGEX, slugify } from '@/lib/utils'
import { AdminSheet } from '@/admin/components/AdminSheet'
import { AdminBulkToolbar } from '@/admin/components/AdminBulkToolbar'
import { EntityDetailSheet } from '@/admin/components/EntityDetailSheet'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { AdminErrorBanner, AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTabToolbar } from '@/admin/components/AdminTabToolbar'
import { ImageUploadField } from '@/admin/components/ImageUploadField'
import { GalleryUploadField } from '@/admin/components/GalleryUploadField'
import { ProductSpecsEditor, parseProductSpecs, type ProductSpec } from '@/admin/components/ProductSpecsEditor'
import { ProductVariantsEditor, parseVariantRows, type VariantFormRow } from '@/admin/components/ProductVariantsEditor'
import { ProductFormSteps } from '@/admin/components/ProductFormSteps'
import { RichTextEditor } from '@/admin/components/RichTextEditor'
import { sanitizeMarketingHtml } from '@/lib/sanitizeHtml'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { useBulkSelection } from '@/admin/hooks/useBulkSelection'
import { BrandedSelect } from '@/components/ui/BrandedSelect'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'
import { AdminClickableTableRow, AdminTableStopCell } from '@/admin/components/AdminClickableTableRow'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'
import { duplicateCopyLabel, duplicateCopySku, duplicateCopySlug } from '@/admin/lib/duplicateRecord'

type ProductRow = Database['public']['Tables']['products']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type CollectionRow = Database['public']['Tables']['collections']['Row']

type ProductForm = {
  name: string
  slug: string
  overview: string
  description: string
  price: string
  compare_at_price: string
  sku: string
  weight_kg: string
  specs: ProductSpec[]
  variants: VariantFormRow[]
  delivery_info: string
  use_default_delivery: boolean
  image_url: string
  gallery_urls: string[]
  category_id: string
  collection_id: string
  badge: string
  is_featured: boolean
  is_new: boolean
  is_summer: boolean
  inventory_count: string
  published: boolean
  sort_order: string
}

const emptyForm = (): ProductForm => ({
  name: '',
  slug: '',
  overview: '',
  description: '',
  price: '',
  compare_at_price: '',
  sku: '',
  weight_kg: '',
  specs: [],
  variants: [],
  delivery_info: '',
  use_default_delivery: true,
  image_url: '',
  gallery_urls: [],
  category_id: '',
  collection_id: '',
  badge: '',
  is_featured: false,
  is_new: false,
  is_summer: false,
  inventory_count: '0',
  published: true,
  sort_order: '0',
})

export function AdminProducts() {
  const syncCatalog = useAdminCatalogSync()
  const formatPrice = useFormatPrice()
  const currency = useCurrency()
  const [rows, setRows] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [collections, setCollections] = useState<CollectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm())
  const [formStep, setFormStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<ProductRow | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  const pagination = useAdminTablePagination(total)
  const pageRows = rows
  const bulk = useBulkSelection(pageRows.map((r) => r.id))

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
      const [productsResult, editContext] = await Promise.all([
        listAdminProducts({
          limit: pagination.pageSize,
          offset: pagination.start,
          search: search.trim() || undefined,
        }),
        fetchAdminEditContext(),
      ])
      setRows(productsResult.items)
      setTotal(productsResult.total)
      setCategories(editContext.categories)
      setCollections(editContext.collections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [pagination.pageSize, pagination.start, search])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function galleryFromRow(row: ProductRow): string[] {
    const urls = Array.isArray(row.gallery_urls) ? (row.gallery_urls as string[]) : []
    return urls.filter((url) => typeof url === 'string' && url.trim().length > 0)
  }

  async function loadVariants(productId: string): Promise<VariantFormRow[]> {
    const { data, error: fetchError } = await tryGetSupabase()
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order')
      .order('name')
    if (fetchError) throw new Error(fetchError.message)
    return parseVariantRows(data ?? [])
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setFormStep(0)
    setModalOpen(true)
  }

  async function openEdit(row: ProductRow) {
    setEditing(row)
    let variants: VariantFormRow[] = []
    try {
      variants = await loadVariants(row.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load variants')
    }
    setForm({
      name: row.name,
      slug: row.slug,
      overview: row.overview ?? '',
      description: row.description ?? '',
      price: String(row.price),
      compare_at_price: row.compare_at_price != null ? String(row.compare_at_price) : '',
      sku: row.sku ?? '',
      weight_kg: row.weight_kg != null ? String(row.weight_kg) : '',
      specs: parseProductSpecs(row.specs),
      variants,
      delivery_info: row.delivery_info ?? '',
      use_default_delivery: row.use_default_delivery ?? true,
      image_url: row.image_url ?? '',
      gallery_urls: galleryFromRow(row),
      category_id: row.category_id ?? '',
      collection_id: row.collection_id ?? '',
      badge: row.badge ?? '',
      is_featured: row.is_featured,
      is_new: row.is_new,
      is_summer: row.is_summer,
      inventory_count: String(row.inventory_count),
      published: row.published,
      sort_order: String(row.sort_order),
    })
    setFormStep(0)
    setModalOpen(true)
  }

  async function openDuplicate(row: ProductRow) {
    setEditing(null)
    let variants: VariantFormRow[] = []
    try {
      variants = await loadVariants(row.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load variants')
    }
    setForm({
      name: duplicateCopyLabel(row.name),
      slug: duplicateCopySlug(row.slug),
      overview: row.overview ?? '',
      description: row.description ?? '',
      price: String(row.price),
      compare_at_price: row.compare_at_price != null ? String(row.compare_at_price) : '',
      sku: row.sku ? duplicateCopySku(row.sku) : '',
      weight_kg: row.weight_kg != null ? String(row.weight_kg) : '',
      specs: parseProductSpecs(row.specs),
      variants: variants.map(({ id: _id, sku, ...variant }) => ({
        ...variant,
        sku: sku ? duplicateCopySku(sku) : '',
      })),
      delivery_info: row.delivery_info ?? '',
      use_default_delivery: row.use_default_delivery ?? true,
      image_url: row.image_url ?? '',
      gallery_urls: galleryFromRow(row),
      category_id: row.category_id ?? '',
      collection_id: row.collection_id ?? '',
      badge: row.badge ?? '',
      is_featured: row.is_featured,
      is_new: row.is_new,
      is_summer: row.is_summer,
      inventory_count: String(row.inventory_count),
      published: row.published,
      sort_order: String(row.sort_order),
    })
    setFormStep(0)
    setModalOpen(true)
  }

  function validate(): string | null {
    if (!form.name.trim()) return 'Name is required.'
    if (!form.slug.trim() || !SLUG_REGEX.test(form.slug)) return 'Valid slug is required.'
    const price = Number(form.price)
    if (Number.isNaN(price) || price < 0) return 'Valid price is required.'
    for (const variant of form.variants) {
      if (!variant.name.trim()) return 'Each variant needs a display name.'
    }
    return null
  }

  async function syncVariants(productId: string) {
    const supabase = tryGetSupabase()
    const keptIds = form.variants.map((v) => v.id).filter(Boolean) as string[]

    let deleteQuery = supabase.from('product_variants').delete().eq('product_id', productId)
    if (keptIds.length > 0) {
      deleteQuery = deleteQuery.not('id', 'in', `(${keptIds.join(',')})`)
    }
    const { error: deleteError } = await deleteQuery
    if (deleteError) throw new Error(deleteError.message)

    for (const variant of form.variants) {
      const optionValues =
        variant.option_label.trim() && variant.option_value.trim()
          ? { [variant.option_label.trim()]: variant.option_value.trim() }
          : {}

      const payload = {
        product_id: productId,
        name: variant.name.trim(),
        sku: variant.sku.trim() || null,
        price: variant.price.trim() ? Number(variant.price) : null,
        compare_at_price: variant.compare_at_price.trim() ? Number(variant.compare_at_price) : null,
        inventory_count: Number(variant.inventory_count) || 0,
        option_values: optionValues,
        image_url: variant.image_url.trim() || null,
        sort_order: Number(variant.sort_order) || 0,
        is_active: variant.is_active,
        updated_at: new Date().toISOString(),
      }

      if (variant.id) {
        const { error: updateError } = await supabase.from('product_variants').update(payload).eq('id', variant.id)
        if (updateError) throw new Error(updateError.message)
      } else {
        const { error: insertError } = await supabase.from('product_variants').insert(payload)
        if (insertError) throw new Error(insertError.message)
      }
    }
  }

  async function save() {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError(null)
    const supabase = tryGetSupabase()
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      overview: sanitizeMarketingHtml(form.overview) || null,
      description: sanitizeMarketingHtml(form.description) || null,
      price: Number(form.price),
      compare_at_price: form.compare_at_price.trim() ? Number(form.compare_at_price) : null,
      sku: form.sku.trim() || null,
      weight_kg: form.weight_kg.trim() ? Number(form.weight_kg) : null,
      specs: form.specs.filter((s) => s.key.trim() && s.value.trim()),
      delivery_info: sanitizeMarketingHtml(form.delivery_info) || null,
      use_default_delivery: form.use_default_delivery,
      image_url: form.image_url.trim() || null,
      gallery_urls: form.gallery_urls.map((url) => url.trim()).filter(Boolean),
      category_id: form.category_id || null,
      collection_id: form.collection_id || null,
      badge: form.badge.trim() || null,
      is_featured: form.is_featured,
      is_new: form.is_new,
      is_summer: form.is_summer,
      inventory_count: Number(form.inventory_count) || 0,
      published: form.published,
      sort_order: Number(form.sort_order) || 0,
      updated_at: new Date().toISOString(),
    }

    try {
      let productId = editing?.id
      if (editing) {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', editing.id)
        if (updateError) throw new Error(updateError.message)
      } else {
        const { data, error: insertError } = await supabase.from('products').insert(payload).select('id').single()
        if (insertError) throw new Error(insertError.message)
        productId = data.id
      }

      if (!productId) throw new Error('Product ID missing after save')
      await syncVariants(productId)

      toast.success(editing ? 'Product updated' : 'Product created')
      setModalOpen(false)
      await refresh()
      await syncCatalog()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  async function remove(row: ProductRow) {
    if (!window.confirm(`Delete "${row.name}"?`)) return
    const supabase = tryGetSupabase()
    const { error: deleteError } = await supabase.from('products').delete().eq('id', row.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    toast.success('Product deleted')
    await refresh()
    await syncCatalog()
  }

  async function bulkDelete() {
    if (bulk.selectedIds.length === 0) return
    if (!window.confirm(`Delete ${bulk.selectedIds.length} product(s)?`)) return
    setBulkBusy(true)
    setError(null)
    const { error: deleteError } = await tryGetSupabase().from('products').delete().in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    toast.success(`${bulk.selectedIds.length} product(s) deleted`)
    bulk.clear()
    await refresh()
    await syncCatalog()
  }

  async function bulkPublish(published: boolean) {
    if (bulk.selectedIds.length === 0) return
    setBulkBusy(true)
    setError(null)
    const { error: updateError } = await tryGetSupabase()
      .from('products')
      .update({ published, updated_at: new Date().toISOString() })
      .in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    toast.success(published ? 'Products published' : 'Products unpublished')
    bulk.clear()
    await refresh()
    await syncCatalog()
  }

  const formSteps = useMemo(
    () => [
      {
        id: 'basics',
        label: 'Basics',
        content: (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className={adminLabel}>Name</label>
              <input
                className={adminInput}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <label className={adminLabel}>Slug</label>
              <input className={adminInput} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <label className={adminLabel}>Badge</label>
              <input className={adminInput} value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className={adminLabel}>Category</label>
              <BrandedSelect
                allowEmpty
                emptyLabel="None"
                value={form.category_id}
                onValueChange={(category_id) => setForm((f) => ({ ...f, category_id }))}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div className="space-y-2">
              <label className={adminLabel}>Collection</label>
              <BrandedSelect
                allowEmpty
                emptyLabel="None"
                value={form.collection_id}
                onValueChange={(collection_id) => setForm((f) => ({ ...f, collection_id }))}
                options={collections.map((c) => ({ value: c.id, label: c.title }))}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'pricing',
        label: 'Pricing',
        content: (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={adminLabel}>Price ({currency.code})</label>
              <input className={adminInput} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className={adminLabel}>Compare-at price ({currency.code})</label>
              <input className={adminInput} type="number" min="0" step="0.01" placeholder="Original price for sales" value={form.compare_at_price} onChange={(e) => setForm((f) => ({ ...f, compare_at_price: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className={adminLabel}>SKU</label>
              <input className={adminInput} placeholder="e.g. AST-PSU-850" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className={adminLabel}>Weight (kg)</label>
              <input className={adminInput} type="number" min="0" step="0.001" placeholder="For shipping" value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className={adminLabel}>Base inventory</label>
              <input className={adminInput} type="number" min="0" value={form.inventory_count} onChange={(e) => setForm((f) => ({ ...f, inventory_count: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <ProductVariantsEditor value={form.variants} onChange={(variants) => setForm((f) => ({ ...f, variants }))} />
            </div>
          </div>
        ),
      },
      {
        id: 'content',
        label: 'Content',
        content: (
          <div className="space-y-4">
            <RichTextEditor
              label="Overview"
              value={form.overview}
              onChange={(overview) => setForm((f) => ({ ...f, overview }))}
              placeholder="Short summary for the Overview tab on the product page…"
              minHeight={140}
            />
            <RichTextEditor
              label="Full description"
              value={form.description}
              onChange={(description) => setForm((f) => ({ ...f, description }))}
              placeholder="Detailed product information…"
              minHeight={180}
            />
            <ProductSpecsEditor value={form.specs} onChange={(specs) => setForm((f) => ({ ...f, specs }))} />
          </div>
        ),
      },
      {
        id: 'media',
        label: 'Media',
        content: (
          <div className="space-y-4">
            <ImageUploadField label="Primary image" value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} folder="products" />
            <GalleryUploadField value={form.gallery_urls} onChange={(gallery_urls) => setForm((f) => ({ ...f, gallery_urls }))} folder="products" />
          </div>
        ),
      },
      {
        id: 'settings',
        label: 'Settings',
        content: (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className={adminLabel}>Sort order</label>
              <input className={adminInput} type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.use_default_delivery} onChange={(e) => setForm((f) => ({ ...f, use_default_delivery: e.target.checked }))} />
              Use site default delivery information
            </label>
            {!form.use_default_delivery ? (
              <RichTextEditor
                label="Delivery information"
                value={form.delivery_info}
                onChange={(delivery_info) => setForm((f) => ({ ...f, delivery_info }))}
                placeholder="Shipping times, regions, and handling for this product…"
                minHeight={140}
              />
            ) : (
              <p className="text-xs text-[var(--admin-muted)]">
                Configure the site-wide default under Settings → Site settings → Default delivery information.
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              {(['is_featured', 'is_new', 'is_summer', 'published'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} />
                  {key.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>
        ),
      },
    ],
    [form, categories, collections, currency.code],
  )

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
              Add product
            </button>
          </>
        }
      />

      <AdminErrorBanner message={error} />

      <div className="admin-search-row">
        <input
          className={adminInput}
          placeholder="Search by name or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') pagination.setPage(1)
          }}
        />
        <button type="button" className={adminBtnSecondary} onClick={() => pagination.setPage(1)}>
          Search
        </button>
      </div>

      <AdminBulkToolbar
        selectedCount={bulk.selectedIds.length}
        onClear={bulk.clear}
        onDelete={() => void bulkDelete()}
        onPublish={() => void bulkPublish(true)}
        onUnpublish={() => void bulkPublish(false)}
        busy={bulkBusy}
      />

      <div className="admin-table-frame">
        <div className="admin-table-wrap">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={bulk.allSelected} onChange={bulk.toggleAll} aria-label="Select all on page" />
                </th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Price ({currency.code})</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className={adminTableActionsHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <AdminClickableTableRow key={row.id} onOpen={() => setDetail(row)}>
                  <AdminTableStopCell className="w-10 px-4 py-3">
                    <input type="checkbox" checked={bulk.selected.has(row.id)} onChange={() => bulk.toggle(row.id)} aria-label={`Select ${row.name}`} />
                  </AdminTableStopCell>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.image_url ? (
                        <img src={row.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : null}
                      <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-[var(--admin-muted)]">{row.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{row.sku ?? '—'}</td>
                  <td className="px-4 py-3">{formatPrice(Number(row.price))}</td>
                  <td className="px-4 py-3">{row.inventory_count}</td>
                  <td className="px-4 py-3">{row.published ? 'Published' : 'Draft'}</td>
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
          <AdminTablePagination {...pagination} totalItems={total} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </div>
      </div>

      <AdminSheet
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit product' : 'New product'}
        size="xl"
      >
        <ProductFormSteps
          steps={formSteps}
          stepIndex={formStep}
          onStepChange={setFormStep}
          onSave={() => void save()}
          saving={saving}
          saveLabel={editing ? 'Save changes' : 'Create product'}
        />
      </AdminSheet>

      <EntityDetailSheet
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail?.slug}
        fields={detail ? [
          { label: 'Price', value: formatPrice(Number(detail.price)) },
          { label: 'Compare-at', value: detail.compare_at_price != null ? formatPrice(Number(detail.compare_at_price)) : '—' },
          { label: 'SKU', value: detail.sku ?? '—' },
          { label: 'Weight', value: detail.weight_kg != null ? `${detail.weight_kg} kg` : '—' },
          { label: 'Overview', value: detail.overview },
          { label: 'Description', value: detail.description },
          { label: 'Inventory', value: detail.inventory_count },
          { label: 'Published', value: detail.published ? 'Yes' : 'No' },
          { label: 'Badge', value: detail.badge },
        ] : []}
      />
    </div>
  )
}
