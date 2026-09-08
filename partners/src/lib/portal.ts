// Shared portal page plumbing (F91): session guards, edge-fn calls, small UI
// helpers. Every guard here is a UX convenience; the SERVER enforces every
// rule again (role grants, ownership asserts, the agreements gate).

import { authHeaders, functionsUrl, supabase } from './supabase';

export interface ListingState {
  status: string;
  account_status?: string;
  agreements_current?: boolean;
  field_limits?: Record<string, number>;
  live?: Record<string, unknown> | null;
  draft?: Record<string, unknown> | null;
}

/** Redirect to sign-in unless a session exists; returns the session. */
export async function requireSession(): Promise<import('@supabase/supabase-js').Session> {
  const { data } = await supabase().auth.getSession();
  if (!data.session) {
    location.href = '/';
    throw new Error('redirecting');
  }
  return data.session;
}

/** The JWT role claim ('partner_user' for partners, 'authenticated' for admins). */
export function roleOf(session: import('@supabase/supabase-js').Session): string {
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role ?? 'authenticated';
  } catch {
    return 'authenticated';
  }
}

export async function rpc<T = Record<string, unknown>>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase().rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

export async function callFn(name: string, body: unknown): Promise<Response> {
  return await fetch(functionsUrl(name), {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

export async function callFnJson<T = Record<string, unknown>>(name: string, body: unknown): Promise<T> {
  const res = await callFn(name, body);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as T;
}

export function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} missing`);
  return node as T;
}

export function show(id: string, visible: boolean): void {
  el(id).hidden = !visible;
}

let toastTimer: number | undefined;
export function toast(message: string): void {
  let node = document.getElementById('portal-toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'portal-toast';
    node.className =
      'fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg';
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (node!.hidden = true), 4000);
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function signOut(): Promise<void> {
  await supabase().auth.signOut();
  location.href = '/';
}

export function fmtDate(value: unknown): string {
  if (!value) return '';
  return new Date(String(value)).toLocaleDateString();
}

/** A date-only value (YYYY-MM-DD) shown as that calendar day, not shifted by the local zone. */
export function fmtDay(value: unknown): string {
  if (!value) return '';
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Locations (F92). One partner login may hold several referral codes, one
// per venue; the per-location pages (Members, Lobby screen) act on the one
// the partner has selected. The choice persists per browser so a
// multi-location manager is not re-asked on every page.
// ---------------------------------------------------------------------------

export interface PartnerLocation {
  code_id: string;
  code: string;
  partner_name: string | null;
  address: string | null;
  is_primary: boolean;
  listing_published: boolean;
  display_enabled: boolean;
  display_handle: string | null;
  display_token: string | null;
  member_count: number;
  pending_count: number;
}

export interface LocationsState {
  status: string;
  agreements_current?: boolean;
  locations?: PartnerLocation[];
}

const LOCATION_KEY = 'fc_location';

export function loadLocations(): Promise<LocationsState> {
  return rpc<LocationsState>('get_my_partner_locations');
}

/** The remembered location if the login still holds it, else the primary. */
export function pickLocation(locations: PartnerLocation[]): PartnerLocation | null {
  if (locations.length === 0) return null;
  let remembered: string | null = null;
  try {
    remembered = localStorage.getItem(LOCATION_KEY);
  } catch {
    remembered = null;
  }
  return locations.find((l) => l.code_id === remembered) ?? locations.find((l) => l.is_primary) ?? locations[0];
}

export function rememberLocation(codeId: string): void {
  try {
    localStorage.setItem(LOCATION_KEY, codeId);
  } catch {
    // Storage blocked: the page still works, the choice just does not persist.
  }
}

export function locationLabel(l: PartnerLocation): string {
  return `${l.partner_name ?? 'Unnamed location'} (${l.code})`;
}

/**
 * Fill the `<select id>` with the login's locations and return the active
 * one. A single-location login sees no selector (the wrapper is hidden);
 * `onChange` fires with the newly selected location after it is remembered.
 */
export function mountLocationSelector(
  selectId: string,
  wrapId: string,
  locations: PartnerLocation[],
  onChange: (l: PartnerLocation) => void,
): PartnerLocation | null {
  const active = pickLocation(locations);
  const select = el<HTMLSelectElement>(selectId);
  select.innerHTML = '';
  for (const l of locations) {
    const opt = document.createElement('option');
    opt.value = l.code_id;
    opt.textContent = locationLabel(l);
    opt.selected = active?.code_id === l.code_id;
    select.appendChild(opt);
  }
  show(wrapId, locations.length > 1);
  select.onchange = () => {
    const next = locations.find((l) => l.code_id === select.value);
    if (!next) return;
    rememberLocation(next.code_id);
    onChange(next);
  };
  return active;
}

/**
 * Location plumbing for the F91 pages (listing, report, print pack) that
 * predate the selector. Loads the login's locations and mounts the selector;
 * returns the active location, or null when locations cannot be loaded (an
 * older backend, a non-partner session). Null means "send no code": the
 * server then acts on the login's primary location exactly as before, so a
 * portal deployed ahead of its backend still works for every single-location
 * partner.
 */
export async function initLocationSelector(
  selectId: string,
  wrapId: string,
  onChange: (l: PartnerLocation) => void,
): Promise<PartnerLocation | null> {
  let state: LocationsState;
  try {
    state = await loadLocations();
  } catch {
    return null;
  }
  if (state.status !== 'ok' || !state.locations?.length) return null;
  return mountLocationSelector(selectId, wrapId, state.locations, onChange);
}

/** `{ p_code_id }` for an RPC call, or `{}` when no location is selected. */
export function codeArg(active: PartnerLocation | null): Record<string, unknown> {
  return active ? { p_code_id: active.code_id } : {};
}

/** `?code_id=` for an edge-function URL, or '' when no location is selected. */
export function codeQuery(active: PartnerLocation | null): string {
  return active ? `?code_id=${encodeURIComponent(active.code_id)}` : '';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A `code_id` carried on the page URL (the print layouts), validated. */
export function codeIdFromUrl(): string | null {
  const v = new URLSearchParams(location.search).get('code_id');
  return v && UUID_RE.test(v) ? v : null;
}

/** The public lobby-screen URL for a display token (the token is the capability). */
export function displayUrl(token: string): string {
  return `${location.origin}/display?t=${token}`;
}

/** Brand still for a species key; null for an unhatched egg or an unknown key. */
const CREATURE_STILLS = new Set(['alieo', 'brutoh', 'chi', 'karmuth', 'wolfie']);
export function creatureStill(type: string | null | undefined): string | null {
  return type && CREATURE_STILLS.has(type) ? `/assets/brand/creatures/fc_creature_${type}_front.png` : null;
}

/** Minimal markdown renderer for OUR OWN published agreement documents.
 * Escapes all HTML first, then applies the constructs the documents use
 * (headings, paragraphs, lists, bold): safe by construction, no dependency. */
export function renderAgreementMd(md: string): string {
  const esc = (t: string) =>
    t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const inline = (t: string) =>
    esc(t).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const blocks = md.replaceAll('\r\n', '\n').split(/\n{2,}/);
  const html: string[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;
    if (/^#{1,3} /.test(lines[0])) {
      const level = lines[0].match(/^#+/)![0].length;
      html.push(`<h${level}>${inline(lines[0].replace(/^#+ /, ''))}</h${level}>`);
      const rest = lines.slice(1).join(' ');
      if (rest) html.push(`<p>${inline(rest)}</p>`);
    } else if (lines.every((l) => /^[-*] /.test(l.trim()))) {
      html.push(`<ul>${lines.map((l) => `<li>${inline(l.trim().replace(/^[-*] /, ''))}</li>`).join('')}</ul>`);
    } else {
      html.push(`<p>${inline(lines.join(' '))}</p>`);
    }
  }
  return html.join('\n');
}
