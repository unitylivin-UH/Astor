import { Link } from '@tanstack/react-router'
import { ChevronDown, Menu, Search, ShoppingBag, User } from 'lucide-react'
import { useState } from 'react'
import { useCms } from '@/contexts/CmsContext'
import { CmsLink } from '@/components/layout/CmsLink'
import { MobileMenuDrawer } from '@/components/layout/MobileMenuDrawer'
import { SiteLogo } from '@/components/layout/SiteLogo'
import { getChildCategories, getTopLevelCategories, getVisibleHeaderNavLinks } from '@/lib/cms/loadCmsSnapshot'
import { useHasStorefrontBundles } from '@/lib/storefront/storefrontQueries'
import { useCartStore } from '@/lib/stores/cart-store'
import { cn } from '@/lib/utils'

const navLinkClass =
  'inline-flex h-6 shrink-0 items-center gap-1 text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-white/90 transition hover:text-white'

export function SiteHeader() {
  const { snapshot } = useCms()
  const { data: hasBundles = false } = useHasStorefrontBundles()
  const headerLinks = getVisibleHeaderNavLinks(snapshot, hasBundles)
  const topCategories = getTopLevelCategories(snapshot)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const openCart = useCartStore((s) => s.openCart)

  return (
    <>
      <header className="site-header pointer-events-auto absolute inset-x-0 top-0 z-30 px-6 py-5 text-cream-text md:px-14">
        <div className="flex items-center justify-between gap-4">
          <SiteLogo variant="dark" className="text-white" />

          <nav className="hidden items-center gap-6 lg:flex">
            <Link to="/" className={navLinkClass}>
              Home
            </Link>
            {topCategories.map((cat) => {
              const children = getChildCategories(snapshot, cat.id)
              return (
                <div
                  key={cat.id}
                  className="relative flex items-center"
                  onMouseEnter={() => setOpenDropdown(cat.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <CmsLink href={`/collection/${cat.slug}`} className={navLinkClass}>
                    {cat.name}
                    {children.length > 0 ? (
                      <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                    ) : null}
                  </CmsLink>
                  {children.length > 0 && openDropdown === cat.id && (
                    <div className="absolute left-0 top-full z-30 min-w-[200px] pt-2">
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-white shadow-lg">
                        <p className="border-b border-[#e8e0d4] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-text-brown">
                          {cat.name}
                        </p>
                        {children.map((child, i) => (
                          <CmsLink
                            key={child.id}
                            href={`/collection/${child.slug}`}
                            className={cn(
                              'block px-4 py-2.5 text-sm text-text-brown transition hover:bg-[#f8f7f3]',
                              i < children.length - 1 && 'border-b border-[#f0ebe3]',
                            )}
                          >
                            {child.name}
                          </CmsLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {headerLinks.map((link) => (
              <CmsLink key={link.id} href={link.href} className={navLinkClass}>
                {link.label}
              </CmsLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-white">
            <Link to="/search" aria-label="Search" className="rounded-full p-2 transition hover:bg-white/10">
              <Search className="h-4 w-4" />
            </Link>
            <Link to="/account" aria-label="Account" className="hidden rounded-full p-2 transition hover:bg-white/10 sm:inline-flex">
              <User className="h-4 w-4" />
            </Link>
            <button
              type="button"
              aria-label="Cart"
              onClick={openCart}
              className="relative rounded-full p-2 transition hover:bg-white/10"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-text-brown">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="rounded-full p-2 transition hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenuDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
