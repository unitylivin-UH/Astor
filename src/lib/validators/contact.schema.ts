import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Valid email required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

export type ContactFormValues = z.infer<typeof contactSchema>
