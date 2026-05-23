/**
 * Minimal wrapper around the pokemontcg.io REST API.
 *
 * v1 calls the API directly from the client. No API key required for
 * low-volume read traffic (rate-limited to 1k req/day per IP).
 *
 * If we hit rate limits at scale, add `EXPO_PUBLIC_POKEMON_TCG_API_KEY`
 * to `.env.local` and pass it as the `X-Api-Key` header — bumps the
 * limit to 30k/day.
 */

const BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.EXPO_PUBLIC_POKEMON_TCG_API_KEY;

interface TcgApiSet {
  id: string;
  name: string;
  releaseDate?: string;
}

interface TcgApiCardImages {
  small?: string;
  large?: string;
}

/**
 * Subset of the pokemontcg.io card shape we care about.
 * The raw object is preserved as `raw` so the mirror table keeps the full record.
 */
export interface TcgApiCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  artist?: string;
  set: TcgApiSet;
  images?: TcgApiCardImages;
  /** Raw API response — stored in pokemon_tcg_cards.raw_json. */
  raw: Record<string, unknown>;
}

interface TcgApiCardResponse {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  artist?: string;
  set: TcgApiSet;
  images?: TcgApiCardImages;
  [key: string]: unknown;
}

function authHeaders(): Record<string, string> {
  if (API_KEY) return { 'X-Api-Key': API_KEY };
  return {};
}

function toTcgApiCard(raw: TcgApiCardResponse): TcgApiCard {
  return {
    id: raw.id,
    name: raw.name,
    number: raw.number,
    rarity: raw.rarity,
    artist: raw.artist,
    set: raw.set,
    images: raw.images,
    raw,
  };
}

/**
 * Search Pokemon TCG cards by name (substring, wildcarded).
 * The query is sent to the API's Lucene-style search; the wildcard suffix
 * means typing "Char" matches "Charizard", "Charmander", "Charmeleon", etc.
 *
 * Returns up to `pageSize` results (default 12).
 */
export async function searchTcgCards(query: string, pageSize = 12): Promise<TcgApiCard[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const safeQuery = trimmed.replace(/"/g, '');
  const url = new URL(`${BASE_URL}/cards`);
  url.searchParams.set('q', `name:"${safeQuery}*"`);
  url.searchParams.set('orderBy', 'name,set.releaseDate');
  url.searchParams.set('pageSize', String(pageSize));

  const response = await fetch(url.toString(), { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`Pokemon TCG search failed: ${response.status}`);
  }
  const json = (await response.json()) as { data?: TcgApiCardResponse[] };
  return (json.data ?? []).map(toTcgApiCard);
}

/**
 * Fetch a single card by its TCG ID (e.g. "base1-4").
 */
export async function getTcgCardById(id: string): Promise<TcgApiCard | null> {
  const response = await fetch(`${BASE_URL}/cards/${encodeURIComponent(id)}`, {
    headers: authHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Pokemon TCG fetch failed: ${response.status}`);
  }
  const json = (await response.json()) as { data?: TcgApiCardResponse };
  return json.data ? toTcgApiCard(json.data) : null;
}
