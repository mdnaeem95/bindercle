import { normalizeRarity } from './enrichment';
import { supabase } from './supabase';

/**
 * TCG Price Lookup client (via Supabase Edge Function proxy).
 *
 * Calls are routed through `supabase.functions.invoke('tcg-search', ...)`.
 * The upstream X-API-Key never touches the client bundle — it's a Supabase
 * Edge Function secret set with `supabase secrets set TCG_API_KEY=...`.
 *
 * Provider chosen over TCGdex for:
 * - Pre-categorized variants (1st Edition vs Unlimited as separate records)
 * - Pokemon English (30k+) and Pokemon Japan (20k+) as distinct games
 * - Built-in pricing data (TCGPlayer + eBay) for future valuation features
 *
 * Tradeoffs vs TCGdex:
 * - No illustrator field in response
 * - No card-level release date (set-level only, not exposed via search)
 * - Variants-as-separate-records produces more results per name search
 *   (the UI shows variant info so users can disambiguate)
 */

export type TcgGame = 'pokemon' | 'pokemon-jp';

interface TcgPriceLookupCard {
  id: string;
  tcgplayer_id?: string;
  name: string;
  number: string;
  rarity?: string | null;
  variant?: string | null;
  image_url?: string | null;
  set?: { slug?: string; name?: string };
  game?: { slug?: string; name?: string };
  prices?: Record<string, unknown>;
  updated_at?: string;
}

interface TcgSearchResponse {
  data?: TcgPriceLookupCard[];
  // The API may return a bare array on older versions; we accept either shape.
  limit?: number;
  offset?: number;
  total?: number;
}

interface TcgApiSet {
  id: string;
  name: string;
  releaseDate?: string;
}

interface TcgApiCardImages {
  small?: string;
  large?: string;
}

export interface TcgApiCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  artist?: string;
  /** Variant from TCG Price Lookup (e.g. "1st Edition Holofoil"). Shown in picker to disambiguate. */
  variant?: string;
  set: TcgApiSet;
  images?: TcgApiCardImages;
  raw: Record<string, unknown>;
}

export interface TcgSearchResult {
  cards: TcgApiCard[];
  /** Total matching results upstream (for pagination math). */
  total: number;
  /** Current offset. */
  offset: number;
  /** Page size used. */
  limit: number;
}

function mapCard(raw: TcgPriceLookupCard): TcgApiCard {
  const imageUrl = raw.image_url ?? undefined;
  const setSlug = raw.set?.slug ?? '';
  const setName = raw.set?.name ?? setSlug;

  return {
    id: raw.id,
    name: raw.name,
    number: raw.number,
    rarity: normalizeRarity(raw.rarity) ?? undefined,
    variant: raw.variant ?? undefined,
    artist: undefined,
    set: {
      id: setSlug,
      name: setName,
    },
    images: imageUrl ? { small: imageUrl, large: imageUrl } : undefined,
    raw: raw as unknown as Record<string, unknown>,
  };
}

/**
 * Search TCG cards.
 *
 * `offset` + `limit` enable pagination in the suggestions UI (load-more).
 * `game` defaults to 'pokemon' (English); pass 'pokemon-jp' to search
 * Japanese sets instead.
 */
export async function searchTcgCards(
  query: string,
  opts: { limit?: number; offset?: number; game?: TcgGame } = {},
): Promise<TcgSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { cards: [], total: 0, offset: 0, limit: opts.limit ?? 24 };
  }

  const { data, error } = await supabase.functions.invoke<TcgSearchResponse | TcgPriceLookupCard[]>(
    'tcg-search',
    {
      body: {
        q: trimmed,
        game: opts.game ?? 'pokemon',
        limit: opts.limit ?? 24,
        offset: opts.offset ?? 0,
      },
    },
  );

  if (error) throw error;
  if (!data) {
    return { cards: [], total: 0, offset: opts.offset ?? 0, limit: opts.limit ?? 24 };
  }

  const isWrapped = !Array.isArray(data) && Array.isArray(data.data);
  const rawCards: TcgPriceLookupCard[] = isWrapped
    ? ((data as TcgSearchResponse).data ?? [])
    : (data as TcgPriceLookupCard[]);

  const total = isWrapped
    ? ((data as TcgSearchResponse).total ?? rawCards.length)
    : rawCards.length;
  const limit = isWrapped
    ? ((data as TcgSearchResponse).limit ?? opts.limit ?? 24)
    : (opts.limit ?? 24);
  const offset = isWrapped
    ? ((data as TcgSearchResponse).offset ?? opts.offset ?? 0)
    : (opts.offset ?? 0);

  return {
    cards: rawCards.map(mapCard),
    total,
    offset,
    limit,
  };
}

/**
 * Fetch a single card by its TCG Price Lookup ID.
 */
export async function getTcgCardById(id: string): Promise<TcgApiCard | null> {
  const { data, error } = await supabase.functions.invoke<TcgPriceLookupCard>('tcg-search', {
    body: { id },
  });

  if (error) {
    // Treat 404s from the upstream proxy as "not found" rather than a hard throw.
    const message = error.message?.toLowerCase() ?? '';
    if (message.includes('404') || message.includes('not found')) return null;
    throw error;
  }
  if (!data) return null;
  return mapCard(data);
}
