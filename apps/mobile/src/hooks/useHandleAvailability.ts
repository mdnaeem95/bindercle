import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * Debounce a value by `delay` ms.
 */
function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

type HandleAvailability =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'taken' }
  | { status: 'invalid'; reason: string };

/**
 * Check if a handle is available. Returns 'idle' for invalid or too-short
 * inputs, 'checking' while the request is in flight, 'available' / 'taken'
 * once the server has responded.
 *
 * Excludes the current user's existing handle so editing-without-changing
 * never reports "taken".
 */
export function useHandleAvailability(handle: string): HandleAvailability {
  const userId = useAuthStore((s) => s.user?.id);
  const debounced = useDebouncedValue(handle.trim().toLowerCase(), 350);

  // Validate format first — bail without a network call if it's malformed.
  const isFormatValid = /^[a-z0-9_]{3,20}$/.test(debounced);
  const tooShort = debounced.length > 0 && debounced.length < 3;

  const query = useQuery({
    queryKey: ['handle-availability', debounced, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', debounced)
        .maybeSingle();
      if (error) throw error;
      // Available if no row, or if the only matching row is the current user.
      if (!data) return 'available' as const;
      if (data.id === userId) return 'available' as const;
      return 'taken' as const;
    },
    enabled: isFormatValid,
    staleTime: 10 * 1000,
  });

  if (debounced.length === 0) return { status: 'idle' };
  if (tooShort) return { status: 'idle' };
  if (!isFormatValid) {
    return { status: 'invalid', reason: 'Lowercase letters, numbers, and underscores only' };
  }
  if (query.isFetching) return { status: 'checking' };
  if (query.data === 'available') return { status: 'available' };
  if (query.data === 'taken') return { status: 'taken' };
  return { status: 'idle' };
}
