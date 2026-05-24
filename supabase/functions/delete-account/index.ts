// Supabase Edge Function: delete-account
//
// Allows an authenticated user to delete their own auth.users record,
// which cascades through every public.* table (profiles → binders →
// pages → cards → comments → likes → saves → follows → notifications).
//
// Required for Apple App Store guideline 5.1.1(v) — in-app account
// deletion for any app that supports account creation.
//
// Auth model:
//   - Caller passes their normal user JWT.
//   - This function verifies the JWT, then uses the service-role key
//     (set via `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`) to
//     issue the privileged auth.admin.deleteUser call against the
//     caller's own user id.
//   - Users can therefore only delete THEMSELVES.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: 'Edge function not configured (missing env)' }, 500);
  }

  // Read the caller's JWT from the Authorization header. supabase.functions.invoke
  // sets this automatically when called from an authed client.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing bearer token' }, 401);
  }

  // Resolve the caller's user id from the JWT. The supabase-js client wants the
  // project's ANON key as its api key — the user JWT goes through the
  // Authorization header (passed via `global.headers`), and `auth.getUser()`
  // then validates that header.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error: userErr,
  } = await callerClient.auth.getUser();
  if (userErr || !user) {
    return json({ error: 'Invalid token' }, 401);
  }

  // Now delete using the service-role client. This bypasses RLS and is the
  // ONLY operation in this function that uses elevated privileges.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
  if (deleteErr) {
    return json({ error: deleteErr.message }, 500);
  }

  return json({ ok: true, deleted_user_id: user.id });
});
