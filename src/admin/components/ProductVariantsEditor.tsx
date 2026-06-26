import { Plus, Trash2 } from 'lucide-react'
import { ImageUploadField } from '@/admin/components/ImageUploadField'
import { adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'

export type VariantFormRow = {
  id?: string
  name: string
  sku: string
  price: string
  compare_at_price: string
  inventory_count: string
  option_label: string
  option_value: string
  image_url: string
  sort_order: string
  is_active: boolean
}

export const emptyVariantRow = (): VariantFormRow => ({
  name: '',
  sku: '',
  price: '',
  compare_at_price: '',
  inventory_count: '0',
  option_label: '',
  option_value: '',
  image_url: '',
  sort_order: '0',
  is_active: true,
})

export function parseVariantRows(
  rows: Array<{
    id: string
    name: string
    sku: string | null
    price: number | null
    compare_at_price: number | null
    inventory_count: number
    option_values: unknown
    image_url: string | null
    sort_order: number
    is_active: boolean
  }>,
): VariantFormRow[] {
  return rows.map((row) => {
    const options =
      row.option_values && typeof row.option_values === 'object' && !Array.isArray(row.option_values)
        ? (row.option_values as Record<string, string>)
        : {}
    const [optionLabel, optionValue] = Object.entries(options)[0] ?? ['', '']

    return {
      id: row.id,
      name: row.name,
      sku: row.sku ?? '',
      price: row.price != null ? String(row.price) : '',
      compare_at_price: row.compare_at_price != null ? String(row.compare_at_price) : '',
      inventory_count: String(row.inventory_count),
      option_label: optionLabel,
      option_value: optionValue,
      image_url: row.image_url ?? '',
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    }
  })
}

export function ProductVariantsEditor({
  value,
  onChange,
}: {
  value: VariantFormRow[]
  onChange: (rows: VariantFormRow[]) => void
}) {
  function updateAt(index: number, patch: Partial<VariantFormRow>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={adminLabel}>Variants</label>
        <p className="text-xs text-[var(--admin-muted)]">
          Optional size, color, or configuration options. When variants exist, customers must pick one on the product page.
        </p>
      </div>

      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--admin-border)] p-4 text-sm text-[var(--admin-muted)]">
          No variants — this product uses the base price and stock above.
        </p>
      ) : null}

      <div className="space-y-4">
        {value.map((row, index) => (
          <div key={row.id ?? `new-${index}`} className="space-y-3 rounded-lg border border-[var(--admin-border)] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Variant {index + 1}</p>
              <button
                type="button"
                className={adminBtnSecondary}
                aria-label="Remove variant"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className={adminLabel}>Display name</label>
                <input
                  className={adminInput}
                  placeholder="e.g. 16GB / Black"
                  value={row.name}
                  onChange={(e) => updateAt(index, { name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={adminLabel}>SKU</label>
                <input className={adminInput} value={row.sku} onChange={(e) => updateAt(index, { sku: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className={adminLabel}>Price override</label>
                <input
                  className={adminInput}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave blank for base price"
                  value={row.price}
                  onChange={(e) => updateAt(index, { price: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={adminLabel}>Compare-at override</label>
                <input
                  className={adminInput}
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.compare_at_price}
                  onChange={(e) => updateAt(index, { compare_at_price: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={adminLabel}>Stock</label>
                <input
                  className={adminInput}
                  type="number"
                  min="0"
                  value={row.inventory_count}
                  onChange={(e) => updateAt(index, { inventory_count: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={adminLabel}>Option label</label>
                <input
                  className={adminInput}
                  placeholder="e.g. Color"
                  value={row.option_label}
                  onChange={(e) => updateAt(index, { option_label: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={adminLabel}>Option value</label>
                <input
                  className={adminInput}
                  placeholder="e.g. Black"
                  value={row.option_value}
                  onChange={(e) => updateAt(index, { option_value: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={adminLabel}>Sort order</label>
                <input
                  className={adminInput}
                  type="number"
                  value={row.sort_order}
                  onChange={(e) => updateAt(index, { sort_order: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={row.is_active}
                  onChange={(e) => updateAt(index, { is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <ImageUploadField
              label="Variant image (optional)"
              value={row.image_url}
              onChange={(url) => updateAt(index, { image_url: url })}
              folder="products"
            />
          </div>
        ))}
      </div>

      <button type="button" className={adminBtnSecondary} onClick={() => onChange([...value, emptyVariantRow()])}>
        <Plus className="h-4 w-4" />
        Add variant
      </button>
    </div>
  )
}
