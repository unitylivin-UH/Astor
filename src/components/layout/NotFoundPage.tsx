import { Link } from '@tanstack/react-router'
import { StorefrontLayout } from '@/components/layout/StorefrontLayout'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <StorefrontLayout>
      <SectionContainer className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">404</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">Page not found</h1>
        <p className="mt-3 max-w-md text-muted">The page you are looking for does not exist or may have moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/search">Search products</Link>
          </Button>
        </div>
      </SectionContainer>
    </StorefrontLayout>
  )
}
