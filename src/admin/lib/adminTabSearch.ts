import { z } from 'zod'

export function createTabSearchSchema<T extends readonly [string, ...string[]]>(tabs: T, defaultTab: T[number]) {
  return z.object({
    tab: z.enum(tabs).catch(defaultTab),
  })
}
