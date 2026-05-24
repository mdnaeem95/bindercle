import { ACCENT_COLORS } from '@foilio/ui';
import { z } from 'zod';

/**
 * Binder field validators — mirror the DB CHECK constraints in
 * supabase migrations.
 */

export const BINDER_LAYOUTS = ['four_pocket', 'nine_pocket', 'sixteen_pocket'] as const;
export type BinderLayout = (typeof BINDER_LAYOUTS)[number];

export const BINDER_LAYOUT_LABELS: Record<BinderLayout, string> = {
  four_pocket: '4-pocket',
  nine_pocket: '9-pocket',
  sixteen_pocket: '16-pocket',
};

/** Pocket columns per layout — also the slot count's square root. */
export const BINDER_LAYOUT_COLUMNS: Record<BinderLayout, number> = {
  four_pocket: 2,
  nine_pocket: 3,
  sixteen_pocket: 4,
};

export const binderFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Required')
    .max(100, 'At most 100 characters')
    .transform((v) => v.trim()),
  description: z.string().max(1000, 'At most 1000 characters').optional().or(z.literal('')),
  is_public: z.boolean(),
  tags: z.array(z.string()).max(10, 'At most 10 tags'),
  accent_color: z.enum(ACCENT_COLORS).optional(),
  layout_type: z.enum(BINDER_LAYOUTS),
});

export type BinderFormValues = z.infer<typeof binderFormSchema>;

/**
 * Slugify a free-form tag label.
 * Lowercase, replace whitespace with hyphens, strip everything else,
 * collapse repeated hyphens, trim leading/trailing hyphens.
 */
export function slugifyTag(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
