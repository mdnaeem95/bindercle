// Supabase Edge Function: tcg-search
//
// Proxies TCG Price Lookup's API to keep the secret X-API-Key off the
// client. Two modes:
//
//   POST { q, game?, limit?, offset? }   -> /v1/cards/search
//   POST { id }                          -> /v1/cards/{id}
//
// Authentication: callers must hit this with a valid Supabase JWT.
// Set the upstream key with `supabase secrets set TCG_API_KEY=...`.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TCG_API_BASE = 'https://api.tcgpricelookup.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SearchBody {
  q?: string;
  id?: string;
  game?: string;
  limit?: number;
  offset?: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('TCG_API_KEY');
  if (!apiKey) {
    return json({ error: 'TCG_API_KEY not configured on the Edge Function' }, 500);
  }

  let body: SearchBody;
  try {
    body = (await req.json()) as SearchBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const game = body.game ?? 'pokemon';
  let upstreamUrl: string;

  if (body.id) {
    upstreamUrl = `${TCG_API_BASE}/cards/${encodeURIComponent(body.id)}`;
  } else if (body.q) {
    const params = new URLSearchParams({
      q: body.q,
      game,
      limit: String(body.limit ?? 24),
      offset: String(body.offset ?? 0),
    });
    upstreamUrl = `${TCG_API_BASE}/cards/search?${params.toString()}`;
  } else {
    return json({ error: 'Provide `q` for search or `id` for a single card' }, 400);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { 'X-API-Key': apiKey },
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return json(
        {
          error: 'Upstream error',
          upstream_status: upstream.status,
          upstream_body: data,
        },
        upstream.status,
      );
    }

    return json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: 'Edge Function failure', detail: message }, 500);
  }
});
