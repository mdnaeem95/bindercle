import type { TcgApiCard } from '@/lib/pokemonTcg';
import { supabase } from '@/lib/supabase';
import type { Json } from '@foilio/api-client';

/**
 * Upsert a TCG card from the public API into our mirror table so a
 * `cards.tcg_card_id` FK can point at it.
 *
 * The insert RLS policy is `with check (true)` for authenticated users,
 * so this works from the client. Conflicts on `id` are ignored — the
 * first version of the card stays canonical (only service_role can refresh).
 */
export async function mirrorTcgCard(card: TcgApiCard): Promise<void> {
  const releaseYear = card.set.releaseDate
    ? Number.parseInt(card.set.releaseDate.split(/[-/]/)[0] ?? '', 10) || null
    : null;

  const { error } = await supabase.from('pokemon_tcg_cards').upsert(
    {
      id: card.id,
      name: card.name,
      set_id: card.set.id,
      set_name: card.set.name,
      number: card.number,
      rarity: card.rarity ?? null,
      image_small: card.images?.small ?? null,
      image_large: card.images?.large ?? null,
      illustrator: card.artist ?? null,
      release_year: releaseYear,
      raw_json: card.raw as Json,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );

  if (error) throw error;
}
