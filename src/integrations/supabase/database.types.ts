export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & {
          name: string
          slug: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Row']>
      }
      collections: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          cover_image_url: string | null
          type: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['collections']['Row']> & {
          title: string
          slug: string
        }
        Update: Partial<Database['public']['Tables']['collections']['Row']>
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: string
          discount_value: number
          min_subtotal: number
          max_uses: number | null
          used_count: number
          starts_at: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['coupons']['Row']> & {
          code: string
          discount_type: string
          discount_value: number
        }
        Update: Partial<Database['public']['Tables']['coupons']['Row']>
      }
      shipping_zones: {
        Row: {
          id: string
          name: string
          countries: Json
          flat_rate: number
          free_shipping_threshold: number | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['shipping_zones']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['shipping_zones']['Row']>
      }
      storefront_carts: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          email: string | null
          items: Json
          coupon_code: string | null
          last_activity_at: string
          abandoned_email_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['storefront_carts']['Row']>
        Update: Partial<Database['public']['Tables']['storefront_carts']['Row']>
      }
      stock_alert_subscriptions: {
        Row: {
          id: string
          email: string
          product_id: string
          variant_id: string | null
          notified_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['stock_alert_subscriptions']['Row']> & {
          email: string
          product_id: string
        }
        Update: Partial<Database['public']['Tables']['stock_alert_subscriptions']['Row']>
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          compare_at_price: number | null
          sku: string | null
          weight_kg: number | null
          specs: unknown
          image_url: string | null
          gallery_urls: unknown
          category_id: string | null
          collection_id: string | null
          badge: string | null
          is_featured: boolean
          is_new: boolean
          is_summer: boolean
          inventory_count: number
          published: boolean
          overview: string | null
          delivery_info: string | null
          use_default_delivery: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['products']['Row']> & {
          name: string
          slug: string
          price: number
        }
        Update: Partial<Database['public']['Tables']['products']['Row']>
      }
      product_bundles: {
        Row: {
          id: string
          name: string
          slug: string
          overview: string | null
          description: string | null
          price: number
          compare_at_price: number | null
          sku: string | null
          image_url: string | null
          gallery_urls: Json
          badge: string | null
          published: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['product_bundles']['Row']> & {
          name: string
          slug: string
          price: number
        }
        Update: Partial<Database['public']['Tables']['product_bundles']['Row']>
      }
      product_bundle_items: {
        Row: {
          id: string
          bundle_id: string
          product_id: string
          variant_id: string | null
          quantity: number
          sort_order: number
          label: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['product_bundle_items']['Row']> & {
          bundle_id: string
          product_id: string
        }
        Update: Partial<Database['public']['Tables']['product_bundle_items']['Row']>
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string | null
          price: number | null
          compare_at_price: number | null
          inventory_count: number
          option_values: Json
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['product_variants']['Row']> & {
          product_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['product_variants']['Row']>
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          order_id: string | null
          rating: number
          title: string | null
          body: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['product_reviews']['Row']> & {
          product_id: string
          user_id: string
          rating: number
          body: string
        }
        Update: Partial<Database['public']['Tables']['product_reviews']['Row']>
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: { user_id: string; product_id: string }
        Update: Partial<Database['public']['Tables']['wishlists']['Row']>
      }
      hero_slides: {
        Row: {
          id: string
          headline_lines: Json
          cta_label: string | null
          cta_url: string | null
          image_url: string | null
          image_url_tablet: string | null
          image_url_mobile: string | null
          background_color: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['hero_slides']['Row']>
        Update: Partial<Database['public']['Tables']['hero_slides']['Row']>
      }
      feature_cards: {
        Row: {
          id: string
          title: string
          cta_label: string | null
          cta_url: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['feature_cards']['Row']> & { title: string }
        Update: Partial<Database['public']['Tables']['feature_cards']['Row']>
      }
      lifestyle_cards: {
        Row: {
          id: string
          title: string
          cta_label: string | null
          cta_url: string | null
          image_url: string | null
          layout: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['lifestyle_cards']['Row']> & { title: string }
        Update: Partial<Database['public']['Tables']['lifestyle_cards']['Row']>
      }
      homepage_sections: {
        Row: {
          id: string
          section_key: string
          title: string | null
          subtitle: string | null
          image_url: string | null
          cta_label: string | null
          cta_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['homepage_sections']['Row']> & { section_key: string }
        Update: Partial<Database['public']['Tables']['homepage_sections']['Row']>
      }
      nav_links: {
        Row: {
          id: string
          label: string
          href: string
          location: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['nav_links']['Row']> & { label: string; href: string; location: string }
        Update: Partial<Database['public']['Tables']['nav_links']['Row']>
      }
      social_links: {
        Row: {
          id: string
          label: string
          href: string
          icon: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['social_links']['Row']> & { label: string; href: string }
        Update: Partial<Database['public']['Tables']['social_links']['Row']>
      }
      site_settings: {
        Row: { key: string; value: string; updated_at: string }
        Insert: { key: string; value?: string }
        Update: Partial<Database['public']['Tables']['site_settings']['Row']>
      }
      newsletter_subscribers: {
        Row: { id: string; email: string; source: string | null; created_at: string }
        Insert: { email: string; source?: string }
        Update: Partial<Database['public']['Tables']['newsletter_subscribers']['Row']>
      }
      cms_media: {
        Row: {
          id: string
          public_url: string
          folder: string | null
          kind: string | null
          file_name: string | null
          created_at: string
        }
        Insert: { public_url: string; folder?: string; kind?: string; file_name?: string }
        Update: Partial<Database['public']['Tables']['cms_media']['Row']>
      }
      admin_users: {
        Row: {
          id: string
          auth_user_id: string | null
          email: string
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: { email: string; role?: string }
        Update: Partial<Database['public']['Tables']['admin_users']['Row']>
      }
      form_submissions: {
        Row: {
          id: string
          form_type: string
          payload: Json
          status: string
          created_at: string
          admin_viewed_at: string | null
        }
        Insert: { form_type?: string; payload?: Json; status?: string }
        Update: Partial<Database['public']['Tables']['form_submissions']['Row']>
      }
      marketing_pages: {
        Row: {
          id: string
          title: string
          slug: string
          body_html: string | null
          meta_description: string | null
          published: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['marketing_pages']['Row']> & { title: string; slug: string }
        Update: Partial<Database['public']['Tables']['marketing_pages']['Row']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          email: string
          status: string
          fulfillment_status: string
          tracking_number: string | null
          carrier: string | null
          shipped_at: string | null
          currency: string
          subtotal: number
          shipping_total: number
          tax_total: number
          discount_total: number
          coupon_code: string | null
          total: number
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          shipping_address: Json | null
          metadata: Json | null
          user_id: string | null
          admin_viewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['orders']['Row']> & { order_number: string; email: string }
        Update: Partial<Database['public']['Tables']['orders']['Row']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_slug: string | null
          image_url: string | null
          unit_price: number
          quantity: number
          line_total: number
          variant_id: string | null
          variant_name: string | null
          bundle_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['order_items']['Row']> & { order_id: string; product_name: string; unit_price: number; line_total: number }
        Update: Partial<Database['public']['Tables']['order_items']['Row']>
      }
      email_templates: {
        Row: {
          id: string
          template_key: string
          name: string
          description: string
          subject: string
          body_html: string
          enabled: boolean
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['email_templates']['Row']> & {
          template_key: string
          name: string
          subject: string
          body_html: string
        }
        Update: Partial<Database['public']['Tables']['email_templates']['Row']>
      }
      private_settings: {
        Row: { key: string; value: string; updated_at: string }
        Insert: { key: string; value: string }
        Update: Partial<Database['public']['Tables']['private_settings']['Row']>
      }
    }
    Functions: {
      rpc_subscribe_newsletter: {
        Args: { p_email: string; p_source?: string }
        Returns: Json
      }
      rpc_submit_contact_form: {
        Args: { p_name: string; p_email: string; p_message: string }
        Returns: Json
      }
      rpc_get_homepage_products: {
        Args: { p_section?: string }
        Returns: Database['public']['Tables']['products']['Row'][]
      }
      rpc_get_collection_products: {
        Args: { p_collection_slug: string }
        Returns: Database['public']['Tables']['products']['Row'][]
      }
      rpc_get_cart_totals: {
        Args: { p_items: Json; p_currency?: string; p_shipping_country?: string | null; p_coupon_code?: string | null }
        Returns: Json
      }
      rpc_get_admin_session: {
        Args: Record<string, never>
        Returns: Json
      }
      rpc_get_admin_edit_context: {
        Args: Record<string, never>
        Returns: Json
      }
      rpc_list_cms_media: {
        Args: { p_limit?: number; p_offset?: number; p_kind?: string | null; p_search?: string | null }
        Returns: Json
      }
      rpc_register_cms_media: {
        Args: { p_public_url: string; p_folder?: string; p_kind?: string; p_file_name?: string | null }
        Returns: Json
      }
      rpc_get_admin_dashboard: {
        Args: Record<string, never>
        Returns: Json
      }
      rpc_list_admin_products: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string | null }
        Returns: Json
      }
      rpc_list_admin_orders: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string | null }
        Returns: Json
      }
      rpc_admin_fulfill_order_inventory: {
        Args: { p_order_id: string }
        Returns: Json
      }
      rpc_check_rate_limit: {
        Args: { p_action: string; p_identifier: string; p_max_requests?: number; p_window_seconds?: number }
        Returns: Json
      }
      rpc_list_storefront_products: {
        Args: {
          p_filter?: string
          p_slug?: string | null
          p_limit?: number
          p_offset?: number
          p_min_price?: number | null
          p_max_price?: number | null
          p_in_stock_only?: boolean
          p_sort?: string
        }
        Returns: Json
      }
      rpc_search_storefront_products: {
        Args: { p_query: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      rpc_get_storefront_product: {
        Args: { p_slug: string }
        Returns: Json
      }
      rpc_submit_product_review: {
        Args: { p_product_id: string; p_rating: number; p_title?: string; p_body?: string }
        Returns: Json
      }
      rpc_can_review_product: {
        Args: { p_product_id: string }
        Returns: Json
      }
      rpc_toggle_wishlist: {
        Args: { p_product_id: string }
        Returns: Json
      }
      rpc_list_wishlist_product_ids: {
        Args: Record<string, never>
        Returns: Json
      }
      rpc_list_storefront_bundles: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      rpc_get_storefront_bundle: {
        Args: { p_slug: string }
        Returns: Json
      }
      bundle_available_quantity: {
        Args: { p_bundle_id: string; p_selections?: Json }
        Returns: number
      }
      rpc_sync_storefront_cart: {
        Args: { p_session_id: string; p_items: Json; p_email?: string | null; p_coupon_code?: string | null }
        Returns: Json
      }
      rpc_subscribe_stock_alert: {
        Args: { p_email: string; p_product_id: string; p_variant_id?: string | null }
        Returns: Json
      }
      rpc_list_admin_customers: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string | null }
        Returns: Json
      }
      rpc_list_low_stock_products: {
        Args: { p_threshold?: number | null }
        Returns: Json
      }
      rpc_product_autocomplete: {
        Args: { p_query: string; p_limit?: number }
        Returns: Json
      }
    }
  }
}
