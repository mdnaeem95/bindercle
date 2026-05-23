-- =====================================================================
-- Foilio — allow client-side inserts into pokemon_tcg_cards
--
-- The mirror starts empty and grows organically: when a user picks a
-- Pokemon TCG card via the in-app picker (sourced from pokemontcg.io),
-- the app upserts that single row into our mirror so we can FK to it
-- from cards.tcg_card_id and serve future lookups locally.
--
-- The data is public, sourced from pokemontcg.io. Authenticated users
-- can insert new rows but cannot update or delete existing ones — only
-- the service_role can mutate the mirror after creation. This prevents
-- one user from "poisoning" another user's view of a card.
-- =====================================================================

create policy "authenticated users can mirror tcg cards"
  on public.pokemon_tcg_cards for insert
  to authenticated
  with check (true);
