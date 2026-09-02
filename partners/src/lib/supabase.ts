// ===========================================================================
// The portal's Supabase client (F91). Talks to the FitCreature project as
// the signed-in partner (role partner_user) or admin (role authenticated +
// server-side is_admin_role checks) — every capability decision is made
// SERVER-side; this client is transport.
//
// The publishable key is public by design (it grants only what RLS + the
// grant posture allow, which for anon is nothing). Local development against
// the FitCreature local stack: run `localStorage.fc_env = 'local'` in the
// console (and clear it to go back) — the demo keys below are the CLI's
// public defaults.
// ===========================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const PROD_URL = 'https://oonouwvcegrmudmjkmds.supabase.co';
const PROD_KEY = 'sb_publishable_0Ir4hGzTyzAST-6UIYyYtA_D6nsjOsg';
const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export function isLocalEnv(): boolean {
  try {
    return localStorage.getItem('fc_env') === 'local';
  } catch {
    return false;
  }
}

export function supabaseUrl(): string {
  return isLocalEnv() ? LOCAL_URL : (import.meta.env.PUBLIC_SUPABASE_URL || PROD_URL);
}

function supabaseKey(): string {
  return isLocalEnv() ? LOCAL_KEY : (import.meta.env.PUBLIC_SUPABASE_ANON_KEY || PROD_KEY);
}

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  client ??= createClient(supabaseUrl(), supabaseKey());
  return client;
}

export function functionsUrl(name: string): string {
  return `${supabaseUrl()}/functions/v1/${name}`;
}

/** Authorization + apikey headers for edge-function fetches. */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('not signed in');
  return { Authorization: `Bearer ${token}`, apikey: supabaseKey() };
}
