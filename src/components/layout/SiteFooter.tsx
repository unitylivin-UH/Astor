import { CmsLink } from '@/components/layout/CmsLink'
import { SiteLogo } from '@/components/layout/SiteLogo'
import { SocialLinks } from '@/components/layout/SocialLinks'
import { useCookieConsent } from '@/contexts/CookieConsentContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useCms } from '@/contexts/CmsContext'
import { getNavByLocation } from '@/lib/cms/loadCmsSnapshot'
import { newsletterSchema, type NewsletterFormValues } from '@/lib/validators/newsletter.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function NewsletterForm({ className }: { className?: string }) {
  const { snapshot } = useCms()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: NewsletterFormValues) {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe-newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email: values.email, source: 'homepage_footer' }),
    })

    const body = await res.json().catch(() => ({}))
    if (!res.ok || !body.ok) {
      toast.error((body as { error?: string }).error ?? 'Subscription failed')
      return
    }
    toast.success('Thanks for subscribing!')
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('w-full space-y-2', className)}>
      <p className="text-sm font-semibold text-[#f7efe5]">
        {snapshot.siteSettings.newsletter_heading ?? 'Stay in step with new drops'}
      </p>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <Input
          {...register('email')}
          type="email"
          placeholder="Enter your email address"
          className="h-9 w-full rounded-md border-white/16 bg-white/8 text-[#f7efe5] placeholder:text-white/40 sm:w-56"
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-9 shrink-0 rounded-md bg-[#f7efe5] px-5 text-[#1e140c] hover:bg-white"
        >
          Subscribe
        </Button>
      </div>
      {errors.email && <p className="text-xs text-red-300">{errors.email.message}</p>}
    </form>
  )
}

export function SiteFooter() {
  const { snapshot } = useCms()
  const { openPreferences } = useCookieConsent()
  const categories = getNavByLocation(snapshot, 'footer_categories')
  const legal = getNavByLocation(snapshot, 'footer_legal')
  const help = getNavByLocation(snapshot, 'footer_help')

  return (
    <footer className="relative overflow-hidden bg-footer-dark px-6 py-14 text-[#f7efe5] md:px-14">
      <div className="relative z-10 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-14">
        <div className="space-y-5 md:col-span-2 lg:col-span-1">
          <SiteLogo variant="dark" className="text-[#f7efe5]" imageClassName="h-10 max-w-[200px]" />
          <p className="max-w-sm text-sm text-white/70">
            {snapshot.siteSettings.footer_tagline ?? 'Premium electronics for work, play, and everything in between.'}
          </p>
          <SocialLinks links={snapshot.socialLinks} />
          <div className="flex flex-col gap-2 text-xs text-white/40">
            <p>© {new Date().getFullYear()} {snapshot.siteName}. All rights reserved.</p>
            <button
              type="button"
              onClick={openPreferences}
              className="text-left text-white/60 underline-offset-2 transition hover:text-white hover:underline"
            >
              Cookie settings
            </button>
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/50">Categories</p>
          <ul className="space-y-2 text-sm">
            {categories.map((link) => (
              <li key={link.id}>
                <CmsLink href={link.href} className="text-white/80 transition hover:text-white">
                  {link.label}
                </CmsLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/50">Legal</p>
          <ul className="space-y-2 text-sm">
            {legal.map((link) => (
              <li key={link.id}>
                <CmsLink href={link.href} className="text-white/80 transition hover:text-white">
                  {link.label}
                </CmsLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/50">Help</p>
          <ul className="space-y-2 text-sm">
            {help.map((link) => (
              <li key={link.id}>
                <CmsLink href={link.href} className="text-white/80 transition hover:text-white">
                  {link.label}
                </CmsLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative z-10 mt-10 border-t border-white/10 pt-8">
        <NewsletterForm />
      </div>

      <p className="pointer-events-none absolute -bottom-10 -right-8 select-none font-display text-[220px] font-extrabold leading-none text-white/[0.08]">
        {snapshot.logoText.slice(0, 1)}
      </p>

      <div className="relative z-10 mt-10 border-t border-white/10 pt-8">
        <img
          src="/images/we-accept.png"
          alt="Accepted payment methods including Visa, Mastercard, American Express, UnionPay, Discover, Google Pay, Apple Pay, and Samsung Pay"
          className="h-8 w-auto max-w-[min(100%,420px)] object-contain object-left opacity-90 sm:h-9"
          loading="lazy"
        />
      </div>
    </footer>
  )
}
