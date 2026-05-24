#!/usr/bin/env tsx
/**
 * Foilio seed script.
 *
 * Spins up a handful of fake personas with binders, pages, real Pokemon TCG
 * cards (pulled via the tcg-search Edge Function), and cross-engagement
 * (follows / likes / saves / comments) so the social surfaces have signal.
 *
 * Behaviour: wipes ALL seed personas (`*@foilio.test`) first, then recreates
 * them fresh. Re-running gives you a clean reproducible state. The cascade
 * also removes their binders / cards / activity / notifications targeting
 * other users.
 *
 * Required env (read from apps/mobile/.env.local):
 *   - EXPO_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  (NEVER commit this; .env.local is gitignored)
 *
 * Usage:  pnpm seed
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --------------------------------------------------------------------
// Env loading
// --------------------------------------------------------------------

const envPath = resolve(__dirname, '..', 'apps/mobile/.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) {
      const [, key, value] = match;
      if (key && !process.env[key]) process.env[key] = value;
    }
  }
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) die('Missing EXPO_PUBLIC_SUPABASE_URL in env');
if (!SERVICE_KEY) {
  die(
    'Missing SUPABASE_SERVICE_ROLE_KEY. Grab it from the Supabase dashboard\n' +
      '(Project Settings → API → service_role) and add it to apps/mobile/.env.local.',
  );
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --------------------------------------------------------------------
// Seed data
// --------------------------------------------------------------------

const SEED_PASSWORD = 'seed-foilio-2026-dev-only';
const SEED_EMAIL_SUFFIX = '@foilio.test';

type AccentColor =
  | 'pink'
  | 'mint'
  | 'cherry'
  | 'lemon'
  | 'lavender'
  | 'sky'
  | 'peach'
  | 'sage'
  | 'rose'
  | 'coral'
  | 'aqua'
  | 'butter';

type Layout = 'four_pocket' | 'nine_pocket' | 'sixteen_pocket';

type PageSpec = {
  name: string;
  /** TCG search query. Top results become the cards. */
  query: string;
  /** How many cards to pull. */
  limit: number;
  /** Optional flavor captions, keyed by card index. */
  captions?: Record<number, string>;
};

type PersonaBinder = {
  title: string;
  description: string;
  accent: AccentColor;
  layout: Layout;
  tags: string[];
  pages: PageSpec[];
};

type Persona = {
  email: string;
  handle: string;
  display_name: string;
  bio: string;
  accent: AccentColor;
  binders: PersonaBinder[];
};

const PERSONAS: Persona[] = [
  {
    email: `seed-pichuparty${SEED_EMAIL_SUFFIX}`,
    handle: 'pichuparty',
    display_name: 'Sera',
    bio: 'Pichu pile architect. Mostly cute, occasionally chaos.',
    accent: 'rose',
    binders: [
      {
        title: 'All the Pichus',
        description: 'Every Pichu I could find. The base, the holos, the weirdos.',
        accent: 'rose',
        layout: 'nine_pocket',
        tags: ['pichu', 'cute', 'mono-pokemon'],
        pages: [
          {
            name: 'Pichu pile',
            query: 'pichu',
            limit: 6,
            captions: { 0: 'first one I ever pulled', 2: 'tiny chaotic energy' },
          },
        ],
      },
      {
        title: 'Cute energy hoard',
        description: 'A binder of cards that made me go awwww. No criteria beyond that.',
        accent: 'pink',
        layout: 'nine_pocket',
        tags: ['cute', 'vibes'],
        pages: [
          { name: 'Snom hoard', query: 'snom', limit: 4, captions: { 0: 'tiny worm' } },
          { name: 'Wooloo wall', query: 'wooloo', limit: 3 },
        ],
      },
    ],
  },
  {
    email: `seed-holohunter${SEED_EMAIL_SUFFIX}`,
    handle: 'holohunter',
    display_name: 'Jamie',
    bio: 'Rainbow rares only. The shimmer is the point.',
    accent: 'pink',
    binders: [
      {
        title: 'Charizard rainbow shelf',
        description: 'Charizards across the years. The shimmer is the point.',
        accent: 'pink',
        layout: 'four_pocket',
        tags: ['charizard', 'rainbow-rare', 'shiny-things'],
        pages: [
          {
            name: 'Hero shelf',
            query: 'charizard',
            limit: 6,
            captions: { 0: 'the centerpiece' },
          },
        ],
      },
      {
        title: 'Moonbreon adjacent',
        description: 'Umbreon, Espeon, anything moon-coded.',
        accent: 'lavender',
        layout: 'nine_pocket',
        tags: ['umbreon', 'rainbow', 'alt-art'],
        pages: [
          { name: 'Umbreon altar', query: 'umbreon', limit: 5, captions: { 0: 'moonbreon' } },
          { name: 'Espeon shelf', query: 'espeon', limit: 4 },
        ],
      },
    ],
  },
  {
    email: `seed-setarchivist${SEED_EMAIL_SUFFIX}`,
    handle: 'setarchivist',
    display_name: 'Marco',
    bio: 'Going for every Charizard ever printed. Currently 60% in.',
    accent: 'butter',
    binders: [
      {
        title: 'Charizard archive',
        description: 'Every Charizard I own — base, ex, V, VMAX, VSTAR.',
        accent: 'butter',
        layout: 'sixteen_pocket',
        tags: ['charizard', 'master-set', 'completionist'],
        pages: [
          {
            name: 'Page 1',
            query: 'charizard',
            limit: 9,
            captions: { 0: 'the first one' },
          },
          {
            name: 'Page 2',
            query: 'charmander',
            limit: 6,
          },
        ],
      },
    ],
  },
  {
    email: `seed-misprintmuse${SEED_EMAIL_SUFFIX}`,
    handle: 'misprintmuse',
    display_name: 'Liu',
    bio: 'Off-center, miscut, blank backs. The printer didn’t mean to make these.',
    accent: 'sage',
    binders: [
      {
        title: 'Off-center oddballs',
        description: 'Cards I love because they’re imperfect. Captions tell the story.',
        accent: 'sage',
        layout: 'nine_pocket',
        tags: ['errors', 'misprints', 'weird'],
        pages: [
          {
            name: 'Base set quirks',
            query: 'blastoise',
            limit: 4,
            captions: {
              0: 'pulled it sideways',
              1: 'ink smear on the holo',
              2: 'almost a blank back',
              3: 'off-center but loved',
            },
          },
          {
            name: 'Promo weirdness',
            query: 'mewtwo',
            limit: 3,
            captions: { 0: 'double-print artifact' },
          },
        ],
      },
    ],
  },
  {
    email: `seed-midnightpulls${SEED_EMAIL_SUFFIX}`,
    handle: 'midnightpulls',
    display_name: 'Yui',
    bio: 'Crack packs at midnight. Document everything.',
    accent: 'lavender',
    binders: [
      {
        title: 'Launch night cracks',
        description: 'Cards from packs I cracked the night the set dropped.',
        accent: 'lavender',
        layout: 'nine_pocket',
        tags: ['midnight', 'launch-day'],
        pages: [
          {
            name: 'Recent pulls',
            query: 'pikachu',
            limit: 6,
            captions: { 0: 'first pull, midnight', 1: 'the art on this one' },
          },
          {
            name: 'Dragons',
            query: 'rayquaza',
            limit: 4,
          },
        ],
      },
    ],
  },
];

const COMMENTS_BY_THEME = {
  cute: [
    'okay the layout alone made me smile',
    'this is making me reconsider my entire collection',
    'cute energy detected',
    'screenshotted three of these for inspo',
  ],
  rainbow: [
    'the shimmer is unreal',
    'i would put this on a wall, no joke',
    'rainbow rares are the only correct answer',
    'incredible eye for the iridescents',
  ],
  master: [
    'obsidian flames was such a strong set',
    'master sets are a whole different commitment, respect',
    'page 1 is so satisfying',
  ],
  errors: [
    'the blank back one is wild',
    'misprints are the realest collectibles',
    'i need a binder like this',
  ],
  generic: [
    'okay this binder is everything',
    'saved purely for the vibes',
    'love this',
    'great collection',
  ],
};

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------

function die(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0] as T);
  }
  return out;
}

async function wipeSeedUsers() {
  const { data: list, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const seedUsers = (list?.users ?? []).filter((u) => u.email?.endsWith(SEED_EMAIL_SUFFIX));
  if (seedUsers.length === 0) return 0;
  for (const u of seedUsers) {
    await admin.auth.admin.deleteUser(u.id);
  }
  return seedUsers.length;
}

// --------------------------------------------------------------------
// TCG lookups via pokemontcg.io (public, no auth)
//
// Used for seed only — the app proper still goes through the
// tcg-search edge function. pokemontcg.io's IDs (e.g. "base1-4") match
// the schema of `pokemon_tcg_cards.id`, so mirrored rows behave just
// like ones the user picks via TCG suggestions in-app.
// --------------------------------------------------------------------

type TcgIoCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  artist?: string;
  set: { id: string; name: string; releaseDate?: string };
  images?: { small?: string; large?: string };
};

async function searchTcg(query: string, limit: number): Promise<TcgIoCard[]> {
  const q = `name:"${query}"`;
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=${limit}&orderBy=-set.releaseDate`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ! "${query}" failed: HTTP ${res.status}`);
      return [];
    }
    const json = (await res.json()) as { data?: TcgIoCard[] };
    return (json.data ?? []).slice(0, limit);
  } catch (e) {
    console.warn(`  ! "${query}" network error: ${(e as Error).message}`);
    return [];
  }
}

async function mirrorTcg(card: TcgIoCard) {
  const releaseYear = card.set.releaseDate
    ? Number.parseInt(card.set.releaseDate.split('/')[0] ?? '', 10) || null
    : null;
  const { error } = await admin.from('pokemon_tcg_cards').upsert(
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
      raw_json: card as unknown as Record<string, unknown>,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

// --------------------------------------------------------------------
// Profile / binder / page / card builders
// --------------------------------------------------------------------

async function createUser(persona: Persona): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email: persona.email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { seed: true, handle: persona.handle },
  });
  if (error || !data?.user) throw error ?? new Error(`createUser failed: ${persona.email}`);
  return data.user.id;
}

async function ensureProfile(userId: string, persona: Persona) {
  const { error } = await admin
    .from('profiles')
    .update({
      handle: persona.handle,
      display_name: persona.display_name,
      bio: persona.bio,
    })
    .eq('id', userId);
  if (error) throw error;
}

async function createBinder(ownerId: string, spec: PersonaBinder): Promise<string> {
  const { data, error } = await admin
    .from('binders')
    .insert({
      owner_id: ownerId,
      title: spec.title,
      description: spec.description,
      accent_color: spec.accent,
      layout_type: spec.layout,
      is_public: true,
    })
    .select('id')
    .single();
  if (error) throw error;

  // Tags: get-or-create then join.
  for (const tagName of spec.tags) {
    const slug = tagName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const { data: tag } = await admin
      .from('tags')
      .upsert({ slug, name: tagName }, { onConflict: 'slug' })
      .select('id')
      .single();
    if (tag) {
      await admin
        .from('binder_tags')
        .insert({ binder_id: data.id, tag_id: tag.id })
        .then(
          () => {},
          () => {},
        );
    }
  }

  return data.id;
}

async function createPages(ownerId: string, binderId: string, spec: PersonaBinder) {
  for (let i = 0; i < spec.pages.length; i++) {
    const page = spec.pages[i];
    if (!page) continue;

    const { data: pageRow, error: pageErr } = await admin
      .from('binder_pages')
      .insert({
        binder_id: binderId,
        owner_id: ownerId,
        name: page.name,
        layout_type: spec.layout,
        position: i,
      })
      .select('id')
      .single();
    if (pageErr) throw pageErr;

    // Pull real TCG cards
    const tcgCards = await searchTcg(page.query, page.limit);
    if (tcgCards.length === 0) {
      console.warn(`    ! "${page.query}" returned 0 cards`);
      continue;
    }

    for (let j = 0; j < tcgCards.length; j++) {
      const raw = tcgCards[j];
      if (!raw) continue;
      await mirrorTcg(raw);
      await admin.from('cards').insert({
        owner_id: ownerId,
        binder_id: binderId,
        page_id: pageRow.id,
        name: raw.name,
        caption: page.captions?.[j] ?? null,
        set_code: raw.set.name,
        set_number: raw.number,
        rarity: raw.rarity ?? null,
        tcg_card_id: raw.id,
        position: j,
      });
    }
  }
}

async function maybeInsert(table: string, payload: Record<string, unknown>) {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name
  const { error } = await (admin.from(table as any) as any).insert(payload);
  if (error && error.code !== '23505') {
    console.warn(`  ! ${table} insert hint:`, error.message);
  }
}

function commentsForBinder(title: string): string[] {
  const t = title.toLowerCase();
  if (t.includes('cute') || t.includes('pichu') || t.includes('snom'))
    return COMMENTS_BY_THEME.cute;
  if (t.includes('rainbow') || t.includes('iridescent')) return COMMENTS_BY_THEME.rainbow;
  if (t.includes('master') || t.includes('obsidian')) return COMMENTS_BY_THEME.master;
  if (t.includes('off-center') || t.includes('misprint')) return COMMENTS_BY_THEME.errors;
  return COMMENTS_BY_THEME.generic;
}

// --------------------------------------------------------------------
// Main
// --------------------------------------------------------------------

async function main() {
  console.log('\n🌱 Foilio seed (real TCG cards)\n');

  // 1. Wipe any prior seed personas + everything cascading off them.
  const wiped = await wipeSeedUsers();
  if (wiped > 0) console.log(`  ✓ wiped ${wiped} prior seed user${wiped === 1 ? '' : 's'}\n`);

  // 2. Build personas + binders + pages + real cards
  const userIdByHandle = new Map<string, string>();
  for (const persona of PERSONAS) {
    console.log(`@${persona.handle}`);
    const userId = await createUser(persona);
    userIdByHandle.set(persona.handle, userId);
    await ensureProfile(userId, persona);

    for (const binderSpec of persona.binders) {
      const binderId = await createBinder(userId, binderSpec);
      await createPages(userId, binderId, binderSpec);
      console.log(`  ✓ ${binderSpec.title}`);
    }
  }

  // 3. Find non-seed (real) dev users so the personas interact with them
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  const devUsers = (listed?.users ?? []).filter(
    (u) => u.email && !u.email.endsWith(SEED_EMAIL_SUFFIX),
  );
  if (devUsers.length > 0) {
    console.log(`\nDev users found: ${devUsers.map((u) => u.email).join(', ')}\n`);
  }

  // 4. Cross-engagement
  console.log('Activity:');

  for (const persona of PERSONAS) {
    const me = userIdByHandle.get(persona.handle);
    if (!me) continue;
    const others = PERSONAS.filter((p) => p.handle !== persona.handle);
    for (const t of pick(others, 2 + Math.floor(Math.random() * 2))) {
      const target = userIdByHandle.get(t.handle);
      if (target) await maybeInsert('follows', { follower_id: me, followed_id: target });
    }
    for (const dev of devUsers) {
      await maybeInsert('follows', { follower_id: me, followed_id: dev.id });
    }
  }

  const { data: allPublicBinders } = await admin
    .from('binders')
    .select('id, owner_id, title')
    .eq('is_public', true);
  const binders = allPublicBinders ?? [];

  for (const persona of PERSONAS) {
    const me = userIdByHandle.get(persona.handle);
    if (!me) continue;
    const targets = binders.filter((b) => b.owner_id !== me);
    for (const b of pick(targets, 3 + Math.floor(Math.random() * 3))) {
      await maybeInsert('likes', { user_id: me, binder_id: b.id });
    }
    for (const b of pick(targets, 1 + Math.floor(Math.random() * 2))) {
      await maybeInsert('saves', { user_id: me, binder_id: b.id });
    }
  }

  for (const binder of binders) {
    const possible = PERSONAS.filter((p) => userIdByHandle.get(p.handle) !== binder.owner_id);
    const commenters = pick(possible, 1 + Math.floor(Math.random() * 2));
    const lines = commentsForBinder(binder.title);
    for (const c of commenters) {
      const me = userIdByHandle.get(c.handle);
      if (!me) continue;
      const body = lines[Math.floor(Math.random() * lines.length)];
      if (!body) continue;
      await maybeInsert('comments', { binder_id: binder.id, user_id: me, body });
    }
  }

  console.log('  ✓ follows, likes, saves, comments wired up');

  // 5. Summary
  const totals = await Promise.all([
    admin.from('binders').select('id', { count: 'exact', head: true }).eq('is_public', true),
    admin.from('cards').select('id', { count: 'exact', head: true }),
    admin.from('cards').select('id', { count: 'exact', head: true }).not('tcg_card_id', 'is', null),
    admin.from('likes').select('user_id', { count: 'exact', head: true }),
    admin.from('saves').select('user_id', { count: 'exact', head: true }),
    admin.from('follows').select('follower_id', { count: 'exact', head: true }),
    admin.from('comments').select('id', { count: 'exact', head: true }),
    admin.from('notifications').select('id', { count: 'exact', head: true }),
  ]);

  console.log('\n📊 Totals on the DB now:');
  console.log(`   public binders:    ${totals[0].count}`);
  console.log(`   cards:             ${totals[1].count}`);
  console.log(`   cards w/ TCG art:  ${totals[2].count}`);
  console.log(`   likes:             ${totals[3].count}`);
  console.log(`   saves:             ${totals[4].count}`);
  console.log(`   follows:           ${totals[5].count}`);
  console.log(`   comments:          ${totals[6].count}`);
  console.log(`   notifications:     ${totals[7].count}`);

  console.log('\n✅ Done.\n');
}

main().catch((e) => {
  console.error('\n❌ Seed failed:', e);
  process.exit(1);
});
