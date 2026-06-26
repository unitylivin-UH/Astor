import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminSelectTrigger } from '@/admin/adminClassNames'
import { cn } from '@/lib/utils'

export const BRANDED_SELECT_EMPTY = '__branded_select_empty__'

export type BrandedSelectOption = {
  value: string
  label: string
}

type BrandedSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: BrandedSelectOption[]
  placeholder?: string
  disabled?: boolean
  variant?: 'admin' | 'storefront'
  className?: string
  triggerClassName?: string
  allowEmpty?: boolean
  emptyLabel?: string
  'aria-label'?: string
}

function toSelectValue(value: string, allowEmpty?: boolean) {
  if (!value && allowEmpty) return BRANDED_SELECT_EMPTY
  return value
}

function fromSelectValue(value: string) {
  if (value === BRANDED_SELECT_EMPTY) return ''
  return value
}

export function BrandedSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  disabled,
  variant = 'admin',
  className,
  triggerClassName,
  allowEmpty,
  emptyLabel = 'None',
  'aria-label': ariaLabel,
}: BrandedSelectProps) {
  const isAdmin = variant === 'admin'
  const allOptions = allowEmpty ? [{ value: BRANDED_SELECT_EMPTY, label: emptyLabel }, ...options] : options
  const selectValue = toSelectValue(value, allowEmpty)

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => onValueChange(fromSelectValue(next))}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          isAdmin ? 'admin-branded-select-trigger' : 'storefront-branded-select-trigger',
          isAdmin ? adminSelectTrigger : undefined,
          className,
          triggerClassName,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={isAdmin ? 'admin-branded-select-content' : 'storefront-branded-select-content'}>
        {allOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={isAdmin ? 'admin-branded-select-item' : 'storefront-branded-select-item'}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
