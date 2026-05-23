import { z } from 'zod';

/**
 * Card field validators — mirror the DB CHECK constraints in
 * supabase/migrations/20260522121023_initial_schema.sql.
 */

export const CARD_CONDITIONS = [
  'mint',
  'near-mint',
  'excellent',
  'good',
  'fair',
  'played',
] as const;
export type CardCondition = (typeof CARD_CONDITIONS)[number];

export const CARD_CONDITION_LABELS: Record<CardCondition, string> = {
  mint: 'Mint',
  'near-mint': 'Near Mint',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  played: 'Played',
};

export const cardFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Required')
    .max(100, 'At most 100 characters')
    .transform((v) => v.trim()),
  caption: z.string().max(140, 'At most 140 characters').optional().or(z.literal('')),
  set_code: z.string().max(100, 'At most 100 characters').optional().or(z.literal('')),
  set_number: z.string().max(30, 'At most 30 characters').optional().or(z.literal('')),
  rarity: z.string().max(50).optional().or(z.literal('')),
  condition: z.enum(CARD_CONDITIONS).optional(),
  notes: z.string().max(1000, 'At most 1000 characters').optional().or(z.literal('')),
});

export type CardFormValues = z.infer<typeof cardFormSchema>;
