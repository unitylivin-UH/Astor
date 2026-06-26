import { useCallback, useMemo, useState } from 'react'

export function useBulkSelection(rowIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.has(id))
  const someSelected = selected.size > 0

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (rowIds.every((id) => prev.has(id))) return new Set()
      return new Set(rowIds)
    })
  }, [rowIds])

  const clear = useCallback(() => setSelected(new Set()), [])

  const selectedIds = useMemo(() => [...selected], [selected])

  return { selected, selectedIds, allSelected, someSelected, toggle, toggleAll, clear }
}
