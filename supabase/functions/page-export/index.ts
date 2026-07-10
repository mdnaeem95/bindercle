// Supabase Edge Function: page-export  (w27 Item 2 — Path B, server compose)
//
// Renders a binder page as a shareable PNG WITHOUT a native module, so page
// export ships over OTA (no build 15). The app sends { page_id }; this function
// reconstructs the page's grid from the catalog image URLs (+ user card-photo
// URLs), stamps the Bindercle wordmark + owner @handle (the distribution-loop
// payload), and returns a base64 PNG the client writes to a temp file and
// shares via expo-sharing.
//
// Auth model:
//   - The caller's Authorization header (a user JWT, or the anon key for a
//     signed-out browser) is forwarded into a read Supabase client, so ALL
//     content reads go through RLS. A page is exportable iff the caller can
//     read it: public binders → anyone (incl. anon, powering the share loop);
//     private binders → owner only.
//   - The composed PNG is uploaded to the public `exports` bucket using the
//     service-role key (the ONLY elevated step, and it only writes a file the
//     caller was already allowed to render). The client shares the returned
//     public CDN URL via the RN Share sheet — no expo-sharing / expo-file-system
//     native module, so page export stays OTA (Path B).
//
// Font: server-side text needs a TTF. We fetch one from EXPORT_FONT_URL (pinned
// default below) and cache it per warm instance. If it can't load, the grid
// still renders and we draw a solid branded bar (graceful degrade) — the
// staging smoke should confirm the wordmark/handle actually render before prod.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// --- Layout geometry -------------------------------------------------------
// Pocket columns per binder layout (slot count is cols²). Mirrors
// BINDER_LAYOUT_COLUMNS in the app; unknown/legacy values default to 3.
const LAYOUT_COLUMNS: Record<string, number> = {
  four_pocket: 2,
  nine_pocket: 3,
  sixteen_pocket: 4,
};

const CARD_W = 320;
const CARD_H = Math.round((CARD_W * 88) / 63); // real card aspect ratio
const GAP = 20;
const PAD = 44;
const WATERMARK_H = 92;

const COLOR_BG = 0x0a0a0fff;
const COLOR_SLOT = 0x15151cff;
const COLOR_WORDMARK = 0xf8f8f2ff;
const COLOR_HANDLE = 0x9a9aa6ff;

// Pinned default font (overridable via `supabase secrets set EXPORT_FONT_URL`).
// npm-pinned .ttf on jsDelivr — verified 200 + valid TrueType (magic 00010000),
// version-locked so it won't drift. (The earlier google/fonts@main path 404'd,
// which is what degraded the watermark to a plain bar on the first smoke.)
const DEFAULT_FONT_URL =
  'https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.2.3/Inter_700Bold.ttf';

let cachedFont: Uint8Array | null | undefined; // undefined = untried, null = failed

async function loadFont(): Promise<Uint8Array | null> {
  if (cachedFont !== undefined) return cachedFont;
  try {
    const url = Deno.env.get('EXPORT_FONT_URL') ?? DEFAULT_FONT_URL;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`font fetch ${res.status}`);
    cachedFont = new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    console.warn('[page-export] font load failed; watermark text disabled:', e);
    cachedFont = null;
  }
  return cachedFont;
}

type ExportCard = {
  position: number;
  tcg_card_id: string | null;
  pokemon_tcg_cards: { image_large: string | null; image_small: string | null } | null;
  card_photos: { url: string; order_index: number }[] | null;
};

/** Prefer the user's own photo (slot 0), else the catalog art. */
function resolveImageUrl(card: ExportCard): string | null {
  const photos = card.card_photos ?? [];
  if (photos.length > 0) {
    const first = [...photos].sort((a, b) => a.order_index - b.order_index)[0];
    if (first?.url) return first.url;
  }
  return card.pokemon_tcg_cards?.image_large ?? card.pokemon_tcg_cards?.image_small ?? null;
}

async function fetchCardImage(url: string): Promise<Image | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const img = await Image.decode(buf);
    return img.resize(CARD_W, CARD_H);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: 'Edge function not configured (missing env)' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401);

  let body: { page_id?: string };
  try {
    body = (await req.json()) as { page_id?: string };
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const pageId = body.page_id;
  if (!pageId) return json({ error: 'page_id is required' }, 400);

  // Everything below runs under the caller's RLS (user JWT or anon key).
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Page + parent binder + owner handle. RLS hides private/unreadable pages.
  const { data: page, error: pageErr } = await supabase
    .from('binder_pages')
    .select(
      `id, name, position, binder_id,
       binders!inner ( title, layout_type, owner_id,
         profiles!binders_owner_id_fkey ( handle ) )`,
    )
    .eq('id', pageId)
    .maybeSingle();

  if (pageErr) return json({ error: pageErr.message }, 500);
  if (!page) return json({ error: 'Page not found or not visible' }, 404);

  const binder = (
    page as { binders: { title: string; layout_type: string; profiles: { handle: string } | null } }
  ).binders;
  const cols = LAYOUT_COLUMNS[binder.layout_type] ?? 3;
  const slots = cols * cols;
  const handle = binder.profiles?.handle ?? null;

  const { data: cards, error: cardsErr } = await supabase
    .from('cards')
    .select(
      `position, tcg_card_id,
       pokemon_tcg_cards ( image_large, image_small ),
       card_photos ( url, order_index )`,
    )
    .eq('page_id', pageId)
    .gte('position', 0)
    .lt('position', slots)
    .order('position', { ascending: true });

  if (cardsErr) return json({ error: cardsErr.message }, 500);

  // --- Compose the canvas --------------------------------------------------
  const canvasW = PAD * 2 + cols * CARD_W + (cols - 1) * GAP;
  const gridH = cols * CARD_H + (cols - 1) * GAP;
  const canvasH = PAD + gridH + WATERMARK_H + PAD;

  const canvas = new Image(canvasW, canvasH);
  canvas.fill(COLOR_BG);

  const slotXY = (position: number) => {
    const row = Math.floor(position / cols);
    const col = position % cols;
    return {
      x: PAD + col * (CARD_W + GAP),
      y: PAD + row * (CARD_H + GAP),
    };
  };

  // Empty-pocket affordances first (so real cards paint over their slot).
  for (let pos = 0; pos < slots; pos++) {
    const { x, y } = slotXY(pos);
    canvas.drawBox(x, y, CARD_W, CARD_H, COLOR_SLOT);
  }

  // Fetch all card images in parallel, then blit at their real positions.
  const byPosition = new Map<number, ExportCard>();
  for (const c of (cards ?? []) as ExportCard[]) byPosition.set(c.position, c);

  const fetches = [...byPosition.entries()].map(async ([pos, card]) => {
    const url = resolveImageUrl(card);
    const img = url ? await fetchCardImage(url) : null;
    return { pos, img };
  });
  for (const { pos, img } of await Promise.all(fetches)) {
    if (!img) continue;
    const { x, y } = slotXY(pos);
    canvas.composite(img, x, y);
  }

  // --- Watermark: wordmark + @handle (the distribution loop payload) -------
  const font = await loadFont();
  const wmY = PAD + gridH + Math.round((WATERMARK_H - 40) / 2);
  if (font) {
    try {
      const wordmark = await Image.renderText(font, 40, 'bindercle', COLOR_WORDMARK);
      canvas.composite(wordmark, PAD, wmY);
      if (handle) {
        const handleImg = await Image.renderText(font, 26, `@${handle}`, COLOR_HANDLE);
        canvas.composite(handleImg, canvasW - PAD - handleImg.width, wmY + 8);
      }
    } catch (e) {
      console.warn('[page-export] text render failed; drawing plain bar:', e);
      canvas.drawBox(PAD, wmY + 18, 160, 6, COLOR_WORDMARK);
    }
  } else {
    // No font: still leave a branded mark so the export is never unbranded.
    canvas.drawBox(PAD, wmY + 18, 160, 6, COLOR_WORDMARK);
  }

  const png = await canvas.encode(); // Uint8Array PNG

  // Upload via the service role (bypasses storage RLS) to the public exports
  // bucket, then hand back the CDN URL for the RN Share sheet.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const objectPath = `${pageId}-${crypto.randomUUID()}.png`;
  const { error: uploadErr } = await admin.storage
    .from('exports')
    .upload(objectPath, png, { contentType: 'image/png', upsert: true });
  if (uploadErr) return json({ error: `Upload failed: ${uploadErr.message}` }, 500);

  const {
    data: { publicUrl },
  } = admin.storage.from('exports').getPublicUrl(objectPath);

  return json({
    url: publicUrl,
    width: canvasW,
    height: canvasH,
    page_name: (page as { name: string | null }).name ?? null,
  });
});
