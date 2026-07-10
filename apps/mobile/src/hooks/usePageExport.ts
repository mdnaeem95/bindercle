import { trackEvent } from '@/lib/observability';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { Share } from 'react-native';

interface ExportPageInput {
  page_id: string;
  /** Where the export was triggered from, for the page_exported event. */
  surface?: string;
}

type ExportResponse = { url?: string; page_name?: string | null };

/**
 * Path B page export (w27 Item 2). Calls the `page-export` edge function, which
 * server-composes a watermarked PNG and returns its public CDN URL, then hands
 * that URL to the OS share sheet via RN's built-in Share (no native module →
 * OTA-safe). Works for signed-in owners AND anonymous browsers on public pages
 * (the function reads under the caller's RLS), so every share carries the
 * wordmark + @handle back out — the distribution loop.
 */
export function useExportPage() {
  return useMutation<void, Error, ExportPageInput>({
    mutationFn: async ({ page_id, surface }) => {
      const { data, error } = await supabase.functions.invoke('page-export', {
        body: { page_id },
      });
      if (error) throw error;
      const url = (data as ExportResponse)?.url;
      if (!url) throw new Error('Export did not return an image');

      // iOS attaches `url`; Android shares it as link text via `message`. Both
      // carry the watermarked export to the share target.
      const result = await Share.share({ message: url, url });

      trackEvent('page_exported', {
        page_id,
        surface: surface ?? null,
        shared: result.action === Share.sharedAction,
        activity_type: 'activityType' in result ? (result.activityType ?? null) : null,
      });
    },
  });
}
