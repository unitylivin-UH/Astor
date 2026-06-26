import { createPortal } from 'react-dom'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { adminInput, adminSelectTrigger } from '@/admin/adminClassNames'
import { cn } from '@/lib/utils'
import { BRANDED_SELECT_EMPTY, type BrandedSelectOption } from '@/components/ui/BrandedSelect'

type SearchableBrandedSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: BrandedSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  variant?: 'admin' | 'storefront'
  className?: string
  triggerClassName?: string
  allowEmpty?: boolean
  emptyLabel?: string
  'aria-label'?: string
}

export function SearchableBrandedSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  disabled,
  variant = 'admin',
  className,
  triggerClassName,
  allowEmpty,
  emptyLabel = 'None',
  'aria-label': ariaLabel,
}: SearchableBrandedSelectProps) {
  const isAdmin = variant === 'admin'
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  const allOptions = useMemo(
    () => (allowEmpty ? [{ value: '', label: emptyLabel }, ...options] : options),
    [allowEmpty, emptyLabel, options],
  )

  const selectedLabel = allOptions.find((option) => option.value === value)?.label

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return allOptions
    return allOptions.filter((option) => option.label.toLowerCase().includes(normalized))
  }, [allOptions, query])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 70,
    })
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }

    updatePosition()
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus())

    function handleReposition() {
      updatePosition()
    }

    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function selectOption(nextValue: string) {
    onValueChange(nextValue)
    setOpen(false)
  }

  const panel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={rootRef}
            className={cn(
              isAdmin ? 'admin-branded-select-content admin-searchable-select-content' : 'storefront-branded-select-content',
            )}
            style={panelStyle}
            role="presentation"
          >
            <div className="admin-searchable-select-search">
              <input
                ref={searchRef}
                type="search"
                className={cn(adminInput, 'h-9 text-sm')}
                value={query}
                placeholder={searchPlaceholder}
                aria-controls={listboxId}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && filteredOptions[0]) {
                    event.preventDefault()
                    selectOption(filteredOptions[0].value)
                  }
                }}
              />
            </div>
            <ul id={listboxId} role="listbox" aria-label={ariaLabel ?? placeholder} className="admin-searchable-select-list">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[var(--admin-muted)]">No matches found.</li>
              ) : (
                filteredOptions.map((option) => {
                  const selected = option.value === value
                  return (
                    <li key={option.value || BRANDED_SELECT_EMPTY} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={cn(
                          'admin-branded-select-item w-full text-left',
                          selected && 'bg-[color-mix(in_srgb,var(--admin-primary-muted)_70%,white)] font-semibold text-[var(--admin-primary)]',
                        )}
                        onClick={() => selectOption(option.value)}
                      >
                        {selected ? (
                          <span className="branded-select-item-indicator">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : null}
                        {option.label}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        className={cn(
          isAdmin ? 'admin-branded-select-trigger' : 'storefront-branded-select-trigger',
          isAdmin ? adminSelectTrigger : undefined,
          className,
          triggerClassName,
        )}
        onClick={() => {
          if (disabled) return
          setOpen((current) => !current)
        }}
      >
        <span className={cn('min-w-0 flex-1 truncate text-left', !selectedLabel && 'text-[var(--admin-muted)]')}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-60 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {panel}
    </>
  )
}
