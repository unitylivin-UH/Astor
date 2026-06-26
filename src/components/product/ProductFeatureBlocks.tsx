import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ProductSectionBlock = {
  label: string
  content: ReactNode
  headerAddon?: ReactNode
}

const sectionTitleClass = 'font-display text-2xl font-extrabold leading-tight text-text-brown md:text-3xl'

function ProductSectionRow({
  label,
  headerAddon,
  children,
}: {
  label: string
  headerAddon?: ReactNode
  children: ReactNode
}) {
  return (
    <article className="border-t border-dotted border-border/35 py-8 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className={sectionTitleClass}>{label}</h2>
          {headerAddon}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </article>
  )
}

export function ProductFeatureBlocks({
  sections,
  className,
}: {
  sections: ProductSectionBlock[]
  className?: string
}) {
  if (sections.length === 0) return null

  return (
    <div className={className}>
      {sections.map((section) => (
        <ProductSectionRow
          key={section.label}
          label={section.label}
          headerAddon={section.headerAddon}
        >
          {section.content}
        </ProductSectionRow>
      ))}
    </div>
  )
}

export const productSectionProseClass =
  'text-[15px] leading-7 text-text-brown md:text-base md:leading-8 [&_p]:m-0'

export function ProductSpecsList({
  specs,
  className,
}: {
  specs: { key: string; value: string }[]
  className?: string
}) {
  return (
    <dl className={cn('space-y-2', className)}>
      {specs.map((spec) => (
        <div key={spec.key} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <dt className="text-[15px] font-semibold leading-6 text-text-brown md:text-base md:leading-7">
            {spec.key}
          </dt>
          <dd className="text-[15px] leading-6 text-text-brown md:text-base md:leading-7">{spec.value}</dd>
        </div>
      ))}
    </dl>
  )
}
