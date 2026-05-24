import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useMutation } from '@tanstack/react-query';

export type ReportTargetType = 'binder' | 'card' | 'comment' | 'user';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'impersonation' | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Something else' },
];

interface ReportInput {
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description?: string;
}

/**
 * Submit a moderation report. Inserts a row into `reports`; review happens
 * outside the app (service-role only reads the table).
 */
export function useReportContent() {
  const reporterId = useAuthStore((s) => s.user?.id);
  return useMutation<void, Error, ReportInput>({
    mutationFn: async (input) => {
      if (!reporterId) throw new Error('Not authenticated');
      const { error } = await supabase.from('reports').insert({
        reporter_id: reporterId,
        target_type: input.target_type,
        target_id: input.target_id,
        reason: input.reason,
        description: input.description?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      trackEvent('content_reported', {
        target_type: input.target_type,
        reason: input.reason,
      });
    },
  });
}
