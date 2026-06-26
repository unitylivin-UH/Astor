import { Plus, Trash2 } from 'lucide-react'
import { adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'

export type ProductSpec = { key: string; value: string }

export function parseProductSpecs(value: unknown): ProductSpec[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is { key?: unknown; value?: unknown } => item !== null && typeof item === 'object')
    .map((item) => ({ key: String(item.key ?? ''), value: String(item.value ?? '') }))
    .filter((item) => item.key.trim() || item.value.trim())
}

export function ProductSpecsEditor({
  value,
  onChange,
}: {
  value: ProductSpec[]
  onChange: (specs: ProductSpec[]) => void
}) {
  function updateAt(index: number, field: 'key' | 'value', next: string) {
    onChange(value.map((spec, i) => (i === index ? { ...spec, [field]: next } : spec)))
  }

  function addRow() {
    onChange([...value, { key: '', value: '' }])
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <label className={adminLabel}>Specifications</label>
      <p className="text-xs text-[var(--admin-muted)]">Add technical specs shown on the product page (e.g. RAM, Storage, Wattage).</p>
      <div className="space-y-2">
        {value.map((spec, index) => (
          <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className={adminInput}
              placeholder="Label (e.g. RAM)"
              value={spec.key}
              onChange={(e) => updateAt(index, 'key', e.target.value)}
            />
            <input
              className={adminInput}
              placeholder="Value (e.g. 16 GB)"
              value={spec.value}
              onChange={(e) => updateAt(index, 'value', e.target.value)}
            />
            <button
              type="button"
              className={adminBtnSecondary}
              onClick={() => removeAt(index)}
              aria-label="Remove spec"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className={adminBtnSecondary} onClick={addRow}>
        <Plus className="h-4 w-4" />
        Add specification
      </button>
    </div>
  )
}
