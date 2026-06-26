/** Shared responsive product grid — 4 columns on large screens. */
export const productGridClasses =
  'grid w-full min-w-0 grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-9'

export const HOMEPAGE_PRODUCT_LIMIT = 8
export const HOMEPAGE_MOBILE_PRODUCT_LIMIT = 4

/** Homepage sections — cap visible cards on small screens; "Show more" links to full collection. */
export const homepageProductGridClasses = [
  productGridClasses,
  // nth-child(n+5) = HOMEPAGE_MOBILE_PRODUCT_LIMIT + 1
  'max-sm:[&>.product-card:nth-child(n+5)]:hidden',
].join(' ')
