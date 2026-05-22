import { z } from 'zod';

/**
 * Profile field validators — mirror the DB CHECK constraints in
 * supabase/migrations/20260522121023_initial_schema.sql.
 *
 * Keeping these in sync ensures client-side validation matches server
 * behavior, so users see errors before submission.
 */

export const handleSchema = z
  .string()
  .min(3, 'At least 3 characters')
  .max(20, 'At most 20 characters')
  .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, and underscores only');

export const displayNameSchema = z
  .string()
  .max(50, 'At most 50 characters')
  .optional()
  .or(z.literal(''));

export const bioSchema = z.string().max(280, 'At most 280 characters').optional().or(z.literal(''));

export const linkSchema = z.string().url('Must be a valid URL').optional().or(z.literal(''));

export const profileFormSchema = z.object({
  handle: handleSchema,
  display_name: displayNameSchema,
  bio: bioSchema,
  link: linkSchema,
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
