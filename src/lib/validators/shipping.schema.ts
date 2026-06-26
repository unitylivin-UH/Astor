import { z } from 'zod'

export const shippingAddressSchema = z.object({
  line1: z.string().trim().min(1, 'Street address is required'),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().optional(),
  postal_code: z.string().trim().min(1, 'Postal code is required'),
  country: z.string().trim().min(2, 'Country is required'),
})

export type ShippingAddressValues = z.infer<typeof shippingAddressSchema>
