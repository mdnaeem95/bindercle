import { BINDER_LAYOUTS } from '@/lib/validators/binder';
import { z } from 'zod';

/**
 * Binder page form validator. Mirrors the CHECK constraints in
 * supabase/migrations/20260523062520_binder_pages.sql.
 *
 * Name is optional — pages default to "Page N" when no custom name is set.
 * Callers should `.trim()` and convert empty strings to null before saving.
 */
export const pageFormSchema = z.object({
  name: z.string().max(60, 'At most 60 characters').optional().or(z.literal('')),
  layout_type: z.enum(BINDER_LAYOUTS),
});

export type PageFormValues = z.infer<typeof pageFormSchema>;
