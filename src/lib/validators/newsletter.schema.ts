import { z } from 'zod'

export const newsletterSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
})

export type NewsletterFormValues = z.infer<typeof newsletterSchema>
