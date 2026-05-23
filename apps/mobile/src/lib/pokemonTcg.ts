import { normalizeRarity } from './enrichment';

/**
 * TCGdex client — wraps https://api.tcgdex.net/v2.
 *
 * Why TCGdex over pokemontcg.io: multilingual (English, French, German,
 * Spanish, Italian, Portuguese, **Japanese**, Korean, Chinese), faster
 * cadence on new set additions, free and open-source.
 *
 * The internal `TcgApiCard` shape is intentionally generic — if we ever
 * swap providers again, only this module changes.
 *
 * Image URLs: TCGdex returns an image *stem* like
 * `https://assets.tcgdex.net/en/swsh/swsh4/4`. To display, suffix with
 * `/low.webp` (thumbnail) or `/high.webp` (detail). We do that here so
 * consumers get usable URLs in `images.small` / `images.large`.
 */

const BASE_URL = 'https://api.tcgdex.net/v2';
const LANG = process.env.EXPO_PUBLIC_TCG_LANGUAGE ?? 'en';

interface TcgdexCardBrief {
  id: string;
  localId: string;
  name: string;
  image?: string | null;
}

interface TcgdexCardFull {
  id: string;
  localId: string;
  name: string;
  image?: string | null;
  illustrator?: string;
  rarity?: string;
  category?: string;
  set: {
    id: string;
    name: string;
    releaseDate?: string;
  };
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
  set: TcgApiSet;
  images?: TcgApiCardImages;
  raw: Record<string, unknown>;
}

function imageVariants(stem: string | null | undefined): TcgApiCardImages | undefined {
  if (!stem) return undefined;
  return {
    small: `${stem}/low.webp`,
    large: `${stem}/high.webp`,
  };
}

/**
 * Derive a set code from a TCGdex card ID. Card IDs are formatted as
 * `{setId}-{localId}` so we can parse the set ID until we fetch full details.
 */
function setCodeFromId(cardId: string): string {
  const dash = cardId.lastIndexOf('-');
  return dash > 0 ? cardId.slice(0, dash) : cardId;
}

function briefToCard(brief: TcgdexCardBrief): TcgApiCard {
  return {
    id: brief.id,
    name: brief.name,
    number: brief.localId,
    set: {
      id: setCodeFromId(brief.id),
      name: setCodeFromId(brief.id),
    },
    images: imageVariants(brief.image),
    raw: brief as unknown as Record<string, unknown>,
  };
}

function fullToCard(full: TcgdexCardFull): TcgApiCard {
  return {
    id: full.id,
    name: full.name,
    number: full.localId,
    rarity: normalizeRarity(full.rarity) ?? undefined,
    artist: full.illustrator,
    set: {
      id: full.set.id,
      name: full.set.name,
      releaseDate: full.set.releaseDate,
    },
    images: imageVariants(full.image),
    raw: full as unknown as Record<string, unknown>,
  };
}

/**
 * Search Pokemon TCG cards by name (substring, case-insensitive).
 *
 * TCGdex's `like:` filter does substring matching — typing "char" matches
 * Charizard, Charmander, Charmeleon. Results are paginated; we take the
 * first page (default 12 items).
 *
 * Returns brief card data — name, number, image — so consumers can render
 * an autocomplete dropdown without N+1 detail fetches. Use `getTcgCardById`
 * for the full details when the user actually picks one.
 */
export async function searchTcgCards(query: string, pageSize = 12): Promise<TcgApiCard[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const url = new URL(`${BASE_URL}/${LANG}/cards`);
  url.searchParams.set('name', `like:${trimmed}`);
  url.searchParams.set('pagination:itemsPerPage', String(pageSize));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TCGdex search failed: ${response.status}`);
  }
  const data = (await response.json()) as TcgdexCardBrief[];
  return data.map(briefToCard);
}

/**
 * Fetch a single card by its TCGdex ID (e.g. "swsh4-4").
 * Returns null if the card doesn't exist in the configured language.
 */
export async function getTcgCardById(id: string): Promise<TcgApiCard | null> {
  const response = await fetch(`${BASE_URL}/${LANG}/cards/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`TCGdex fetch failed: ${response.status}`);
  }
  const data = (await response.json()) as TcgdexCardFull;
  return fullToCard(data);
}
