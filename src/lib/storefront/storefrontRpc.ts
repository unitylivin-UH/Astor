import type { Database } from '@/integrations/supabase/database.types'
import type { Product, ProductBundle } from '@/data/static-cms'
import { mapProductRow, mapProductRows, mapReviewSummary, mapVariantRow } from '@/lib/cms/mapProduct'
import { mapBundleDetail, mapBundleListRow } from '@/lib/bundles/mapBundle'
import { isSupabaseConfigured, tryGetSupabase } from '@/integrations/supabase/client'
import type { StorefrontListParams } from '@/lib/storefront/staticProductFallback'

type RpcOk<T> = { ok: true } & T
type RpcErr = { ok: false; error?: string }

export type StorefrontProductPage = {
  items: Product[]
  total: number
}

export type StorefrontBundlePage = {
  items: ProductBundle[]
  total: number
}

function getClient() {
  const supabase = tryGetSupabase()
  if (!supabase || !isSupabaseConfigured()) return null
  return supabase
}

function parseProductPage(data: unknown): StorefrontProductPage {
  const result = data as RpcOk<{ items: Database['public']['Tables']['products']['Row'][]; total: number }> | RpcErr
  if (!result?.ok) throw new Error(result?.error ?? 'Failed to load products')
  return {
    items: mapProductRows(result.items ?? []),
    total: Number(result.total ?? 0),
  }
}

export async function fetchStorefrontProducts(
  params: StorefrontListParams,
  limit: number,
  offset: number,
): Promise<StorefrontProductPage> {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('rpc_list_storefront_products', {
    p_filter: params.filter,
    p_slug: params.slug ?? null,
    p_limit: limit,
    p_offset: offset,
    p_min_price: params.minPrice ?? null,
    p_max_price: params.maxPrice ?? null,
    p_in_stock_only: params.inStockOnly ?? false,
    p_sort: params.sort ?? 'default',
  })
  if (error) throw new Error(error.message)
  return parseProductPage(data)
}

export async function fetchStorefrontSearch(
  query: string,
  limit: number,
  offset: number,
): Promise<StorefrontProductPage> {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('rpc_search_storefront_products', {
    p_query: query,
    p_limit: limit,
    p_offset: offset,
  })
  if (error) throw new Error(error.message)
  return parseProductPage(data)
}

export async function fetchStorefrontProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('rpc_get_storefront_product', { p_slug: slug })
  if (error) throw new Error(error.message)

  const result = data as RpcOk<{
    product: Database['public']['Tables']['products']['Row']
    variants?: Database['public']['Tables']['product_variants']['Row'][]
    reviews?: unknown
    delivery_text?: string | null
  }> | RpcErr
  if (!result?.ok || !result.product) return null

  const product = mapProductRow(result.product)
  product.variants = (result.variants ?? []).map(mapVariantRow)
  product.reviews = mapReviewSummary(result.reviews)
  product.deliveryText = result.delivery_text ?? null
  return product
}

export async function fetchHomepageProducts(section: 'new' | 'summer'): Promise<Product[]> {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('rpc_get_homepage_products', { p_section: section })
  if (error) throw new Error(error.message)
  return mapProductRows(data ?? [])
}

export type CustomerOrderSummary = {
  id: string
  order_number: string
  status: string
  fulfillment_status?: string
  total: number
  currency: string
  created_at: string
}

export type CustomerOrderDetail = CustomerOrderSummary & {
  email: string
  subtotal: number
  fulfillment_status: string
  tracking_number: string | null
  carrier: string | null
  shipped_at: string | null
  shipping_address: Database['public']['Tables']['orders']['Row']['shipping_address']
  order_items: Database['public']['Tables']['order_items']['Row'][]
}

export async function fetchCustomerOrders(): Promise<CustomerOrderSummary[]> {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, fulfillment_status, total, currency, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    ...row,
    total: Number(row.total),
  }))
}

export async function fetchCustomerOrderDetail(orderId: string): Promise<CustomerOrderDetail | null> {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, status, total, currency, created_at, email, subtotal, shipping_address, fulfillment_status, tracking_number, carrier, shipped_at')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError) throw new Error(orderError.message)
  if (!order) return null

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (itemsError) throw new Error(itemsError.message)

  return {
    ...order,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    order_items: items ?? [],
  }
}

export async function toggleWishlist(productId: string): Promise<{ inWishlist: boolean }> {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('rpc_toggle_wishlist', { p_product_id: productId })
  if (error) throw new Error(error.message)
  const result = data as RpcOk<{ in_wishlist: boolean }> | RpcErr
  if (!result?.ok) throw new Error(result.error ?? 'Wishlist update failed')
  return { inWishlist: Boolean(result.in_wishlist) }
}

export async function fetchWishlistProductIds(): Promise<string[]> {
  const supabase = getClient()
  if (!supabase) return []

  const { data, error } = await supabase.rpc('rpc_list_wishlist_product_ids')
  if (error) throw new Error(error.message)
  const result = data as RpcOk<{ product_ids: string[] }> | RpcErr
  if (!result?.ok) return []
  return (result.product_ids ?? []).map(String)
}

export async function fetchWishlistProducts(): Promise<Product[]> {
  const supabase = getClient()
  if (!supabase) return []

  const ids = await fetchWishlistProductIds()
  if (ids.length === 0) return []

  const { data, error } = await supabase.from('products').select('*').in('id', ids).eq('published', true)
  if (error) throw new Error(error.message)

  const byId = new Map(mapProductRows(data ?? []).map((product) => [product.id, product]))
  return ids.map((id) => byId.get(id)).filter((product): product is Product => Boolean(product))
}

export async function submitProductReview(input: {
  productId: string
  rating: number
  title?: string
  body: string
}): Promise<void> {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('rpc_submit_product_review', {
    p_product_id: input.productId,
    p_rating: input.rating,
    p_title: input.title ?? null,
    p_body: input.body,
  })
  if (error) throw new Error(error.message)
  const result = data as RpcOk<Record<string, never>> | RpcErr
  if (!result?.ok) throw new Error(result.error ?? 'Failed to submit review')
}

export async function fetchStorefrontBundles(limit: number, offset: number): Promise<StorefrontBundlePage> {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('rpc_list_storefront_bundles', {
    p_limit: limit,
    p_offset: offset,
  })
  if (error) throw new Error(error.message)

  const result = data as RpcOk<{ items: Database['public']['Tables']['product_bundles']['Row'][]; total: number }> | RpcErr
  if (!result?.ok) throw new Error(result.error ?? 'Failed to load bundles')
  return {
    items: (result.items ?? []).map(mapBundleListRow),
    total: Number(result.total ?? 0),
  }
}

export async function fetchStorefrontBundleBySlug(slug: string): Promise<ProductBundle | null> {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.rpc('rpc_get_storefront_bundle', { p_slug: slug })
  if (error) throw new Error(error.message)

  const result = data as RpcOk<{
    bundle: Database['public']['Tables']['product_bundles']['Row']
    items: Array<{
      id: string
      bundle_id: string
      product_id: string
      variant_id: string | null
      quantity: number
      sort_order: number
      label: string | null
      product: {
        id: string
        name: string
        slug: string
        image_url: string | null
        price: number
        inventory_count: number
      }
      variants?: Database['public']['Tables']['product_variants']['Row'][]
    }>
    available_quantity: number
  }> | RpcErr

  if (!result?.ok || !result.bundle) return null
  return mapBundleDetail(result.bundle, result.items ?? [], Number(result.available_quantity ?? 0))
}

export async function canReviewProduct(productId: string): Promise<{ canReview: boolean; reason?: string }> {
  const supabase = getClient()
  if (!supabase) return { canReview: false, reason: 'offline' }

  const { data, error } = await supabase.rpc('rpc_can_review_product', { p_product_id: productId })
  if (error) throw new Error(error.message)
  const result = data as RpcOk<{ can_review: boolean; reason?: string }> | RpcErr
  if (!result?.ok) return { canReview: false }
  return { canReview: Boolean(result.can_review), reason: result.reason }
}
