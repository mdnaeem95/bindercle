import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide TanStack Query client.
 *
 * Tuned for mobile: aggressive caching, optimistic updates, and network-aware
 * refetch behavior. RN doesn't fire window focus events, so we lean on
 * `staleTime` and explicit invalidations after mutations.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 30s — covers tab-switching, screen reopens
      staleTime: 30 * 1000,
      // Keep cache for 5 min after no observers — survives transient navigation
      gcTime: 5 * 60 * 1000,
      // Retry failed requests once with backoff; mobile networks are flaky
      retry: 1,
      // Don't refetch on mount unless data is stale
      refetchOnMount: true,
      // Refocus events don't fire on RN; explicit invalidation only
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
