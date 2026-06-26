import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useStorefrontAuth } from '@/contexts/StorefrontAuthContext'
import { useCustomerOrderDetail } from '@/lib/storefront/storefrontQueries'
import { OrderDetailContent } from '@/components/account/OrderDetailContent'
import { PageHero } from '@/components/layout/PageHero'
import { StorefrontLayout } from '@/components/layout/StorefrontLayout'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/account/orders/$orderId')({
  component: OrderDetailPage,
})

function OrderDetailPage() {
  const { orderId } = Route.useParams()
  const { user, loading: authLoading } = useStorefrontAuth()
  const { data: order, isLoading, error } = useCustomerOrderDetail(orderId, Boolean(user))

  if (authLoading || isLoading) {
    return (
      <StorefrontLayout>
        <SectionContainer className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </SectionContainer>
      </StorefrontLayout>
    )
  }

  if (!user) {
    return (
      <StorefrontLayout>
        <PageHero title="Order details" subtitle="Sign in to view this order" backLabel="Back to Account" backTo="/account" />
        <SectionContainer className="py-10 text-center">
          <Button asChild>
            <Link to="/account">Sign in</Link>
          </Button>
        </SectionContainer>
      </StorefrontLayout>
    )
  }

  if (error || !order) throw notFound()

  return (
    <StorefrontLayout>
      <PageHero
        title={order.order_number}
        subtitle={`Placed ${new Date(order.created_at).toLocaleString()}`}
        backLabel="Back to Account"
        backTo="/account"
      />

      <SectionContainer className="py-10">
        <OrderDetailContent order={order} />
      </SectionContainer>
    </StorefrontLayout>
  )
}
