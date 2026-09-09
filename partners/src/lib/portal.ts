// Shared portal page plumbing (F91): session guards, edge-fn calls, small UI
// helpers. Every guard here is a UX convenience; the SERVER enforces every
// rule again (role grants, ownership asserts, the agreements gate).

import { authHeaders, functionsUrl, supabase } from './supabase';

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
  forgetRole();
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

/** A timestamp shown with the time of day (last sign-in, request filed). */
export function fmtDateTime(value: unknown): string {
  if (!value) return '';
  return new Date(String(value)).toLocaleString();
}

// ---------------------------------------------------------------------------
// Roles (Decision 6.139). A brand may have several logins. A BRAND grant
// (brand_admin) reaches every venue of the brand, present and future; a
// LOCATION grant (location_manager) reaches exactly the venues it was given.
// The server decides all of it: get_my_partner_brand hands back role,
// can_edit_brand, can_add_location, can_submit and submit_block, and its
// locations arrays arrive already filtered. Everything below is PRESENTATION
// on top of those answers, never a second rule: hiding a control is a
// courtesy, and the same call is refused server-side either way.
// ---------------------------------------------------------------------------

export type PartnerRole = 'brand_admin' | 'location_manager';

export function isRole(value: unknown): value is PartnerRole {
  return value === 'brand_admin' || value === 'location_manager';
}

/** "Brand admin" / "Location manager", for a chip or a sentence. */
export function roleLabel(role: unknown): string {
  return role === 'brand_admin' ? 'Brand admin' : role === 'location_manager' ? 'Location manager' : 'Unknown role';
}

/** What the role reaches, in one plain line. */
export function roleReach(role: unknown): string {
  return role === 'brand_admin'
    ? 'Every venue of the brand, including any added later, plus the brand section and the team.'
    : 'The venues assigned to this login.';
}

const ROLE_KEY = 'fc_role';

export function cachedRole(): PartnerRole | null {
  try {
    const value = localStorage.getItem(ROLE_KEY);
    return isRole(value) ? value : null;
  } catch {
    // Storage blocked: the nav simply paints once the role arrives.
    return null;
  }
}

export function cacheRole(role: unknown): void {
  if (!isRole(role)) return;
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    // Storage blocked: nothing to remember between pages, which is fine.
  }
  paintNavRole(role);
}

export function forgetRole(): void {
  try {
    localStorage.removeItem(ROLE_KEY);
  } catch {
    // Storage blocked: there was nothing remembered to clear.
  }
}

/** Show the Team link for a brand admin, hide it otherwise. */
export function paintNavRole(role: PartnerRole | null): void {
  const link = document.getElementById('nav-team');
  if (link) link.hidden = role !== 'brand_admin';
}

/**
 * Paint the nav from the remembered role, then confirm it with the server.
 * A page that already loads the role calls `cacheRole` instead of waiting
 * for this. Admin sessions are not partners, so their nav keeps Team hidden.
 */
export async function syncNavRole(): Promise<void> {
  paintNavRole(cachedRole());
  const { data } = await supabase().auth.getSession();
  if (!data.session || roleOf(data.session) !== 'partner_user') {
    paintNavRole(null);
    return;
  }
  const account = await rpc<Record<string, unknown>>('get_my_partner_account');
  if (account.status !== 'ok') return;
  if (isRole(account.role)) cacheRole(account.role);
}

/**
 * Team-write outcomes, said as what to do next rather than as a code. Every
 * one of these is a soft status the RPCs in Decision 6.139 can return.
 */
const TEAM_STATUS_TEXT: Record<string, string> = {
  last_brand_admin:
    'A brand always keeps at least one active brand admin. Give another login brand admin first, then this one can change.',
  self_demote:
    'This is the only active brand admin, so it keeps brand access for now. Promote another login, then step this one down.',
  self_suspend:
    'A login cannot suspend itself. Another brand admin can do it, or the FitCreature team can help.',
  operator_only:
    'Switching a suspended login back on is done by the FitCreature team. Reach out and we will restore it.',
  is_brand_admin:
    'A brand admin already reaches every venue, so single venues are not assigned to it. Change the role to location manager first.',
  not_granted: 'That venue was already unassigned. Reload for the current list.',
  not_found: 'That login is no longer part of your brand. Reload for the current list.',
  forbidden_code: "That venue is not one of your brand's active locations. Reload for the current list.",
  forbidden_brand: 'Team changes are made by a brand login.',
  agreements_required: 'Please accept the current agreements on the Overview page first, then try again.',
  already_requested: 'There is already an open request for that address, listed under requests waiting.',
  invalid_email: 'That email address could not be read. Check it and try again.',
  invalid_name: 'That contact name could not be read. Plain letters, spaces, and numbers work best.',
  invalid_role: 'That role could not be read. Reload and try again.',
  invalid_status: 'That change could not be read. Reload and try again.',
  locations_required: 'A location manager needs at least one venue. Pick the venues this login covers.',
  brand_mismatch: 'That venue belongs to another brand. Reload for the current list.',
  invalid_code: 'That venue could not be found. Reload for the current list.',
  suspended: 'This login is suspended, so it cannot make changes. Reach out to the FitCreature team.',
};

export function teamStatusText(status: unknown): string {
  const key = String(status ?? '');
  return TEAM_STATUS_TEXT[key] ?? `That did not go through (${key || 'unknown'}). Reload and try again.`;
}

/**
 * Venue lifecycle outcomes (Decision 6.140), said as what to do next rather
 * than as a code. retire_partner_location and reopen_partner_location return
 * these as SOFT statuses; unauthorized, not-a-partner and suspended RAISE
 * instead (partner_assert_active), so a caller handles a thrown error too.
 */
const RETIRE_STATUS_TEXT: Record<string, string> = {
  forbidden_brand:
    'Closing or reopening a location is done by a brand login. Your login covers the venues assigned to it.',
  unknown_location: 'That venue is no longer part of your brand. Reload for the current list.',
  already_retired: 'That venue is already closed. It is listed under Closed locations, where it can be reopened.',
  archived:
    'That venue has passed its grace window and been archived, so it cannot be reopened. A new venue can be added instead.',
  not_retired: 'That venue is open, so there is nothing to reopen. Reload for the current list.',
  reason_too_long: 'That note is longer than the limit. Shorten it and try again.',
  suspended: 'This login is suspended, so it cannot make changes. Reach out to the FitCreature team.',
};

export function retireStatusText(status: unknown): string {
  const key = String(status ?? '');
  return RETIRE_STATUS_TEXT[key] ?? `That did not go through (${key || 'unknown'}). Reload and try again.`;
}

/**
 * Why this login cannot send the submission as it stands
 * (partner_draft_submit_block). NULL means it can.
 */
const SUBMIT_BLOCK_TEXT: Record<string, string> = {
  brand_section:
    'This submission also changes the brand section (business name, website, or brand-wide perks), so a brand login sends it.',
  logo: 'A new logo is staged in this submission, so a brand login sends it.',
  new_location: 'This submission proposes a new venue, so a brand login sends it.',
  forbidden_location:
    'This submission includes a venue outside the ones assigned to your login, so a brand login sends it.',
  no_draft: 'There is nothing staged to send yet. Make a change and save it first.',
};

export function submitBlockText(block: unknown): string {
  const key = String(block ?? '');
  return SUBMIT_BLOCK_TEXT[key] ?? 'A brand login sends this submission.';
}

/** The stale-save line: one draft per brand, so another login may have moved first. */
export const STALE_DRAFT_TEXT =
  'Another login changed this submission while this page was open. Reload to pick up their version, then make your change again.';

// ---------------------------------------------------------------------------
// Locations (F92, Decisions 6.137 / 6.138 / 6.139). A partner login belongs to
// one BRAND and reaches some of its locations (one referral code per venue):
// every venue for a brand admin, the granted ones for a location manager. The
// per-location pages (Members, Lobby screen, Report, Print pack) act on the one
// the partner has selected, and the list arrives already filtered by the
// server. The choice persists per browser so a multi-venue login is not
// re-asked on every page. The Locations page itself edits every venue the
// login reaches at once (one draft per brand) and has no selector.
// ---------------------------------------------------------------------------

export interface PartnerLocation {
  code_id: string;
  code: string;
  brand_name: string | null;
  label: string | null;
  address: string | null;
  is_default: boolean;
  is_active: boolean;
  // Decision 6.140. 'active' is the normal venue. 'retired' is closed: it
  // still arrives here so the portal can show it and offer Reopen, but every
  // per-location RPC refuses it, so it is never selectable. 'archived' venues
  // are not returned at all.
  partner_status: 'active' | 'retired' | 'archived';
  retired_at: string | null;
  retire_reason: string | null;
  archive_due_at: string | null;
  via_role: PartnerRole;
  listing_published: boolean;
  display_enabled: boolean;
  display_handle: string | null;
  display_token: string | null;
  member_count: number;
  pending_count: number;
}

export interface LocationsState {
  status: string;
  brand_id?: string;
  brand_name?: string;
  role?: PartnerRole;
  default_code_id?: string | null;
  agreements_current?: boolean;
  retire_grace_days?: number;
  active_location_count?: number;
  locations?: PartnerLocation[];
}

/** Closed venues come back alongside open ones; only the open ones are usable. */
export function isOpenLocation(l: PartnerLocation): boolean {
  return l.partner_status !== 'retired' && l.partner_status !== 'archived';
}

/**
 * What a per-location page says when the selector has nothing to act on. A
 * login whose only venues are CLOSED is not a login with no venues, and saying
 * so points at the one page that can do something about it.
 */
export function noLocationText(locations: PartnerLocation[]): string {
  return locations.some((l) => !isOpenLocation(l))
    ? 'Every location this login covers is closed right now. A brand login can reopen one under Locations.'
    : 'No locations are attached to this account yet.';
}

const LOCATION_KEY = 'fc_location';

export function loadLocations(): Promise<LocationsState> {
  return rpc<LocationsState>('get_my_partner_locations');
}

/**
 * The remembered location if the login still reaches it and it is open, else
 * its default, else the first open one. A closed venue is never picked: every
 * per-location RPC refuses it (Decision 6.140), so landing on one would put
 * the page on a venue the server will not answer for.
 */
export function pickLocation(locations: PartnerLocation[]): PartnerLocation | null {
  const open = locations.filter(isOpenLocation);
  if (open.length === 0) return null;
  let remembered: string | null = null;
  try {
    remembered = localStorage.getItem(LOCATION_KEY);
  } catch {
    remembered = null;
  }
  return open.find((l) => l.code_id === remembered) ?? open.find((l) => l.is_default) ?? open[0];
}

export function rememberLocation(codeId: string): void {
  try {
    localStorage.setItem(LOCATION_KEY, codeId);
  } catch {
    // Storage blocked: the page still works, the choice just does not persist.
  }
}

/** "Downtown (EASTLIFT)": the location's label, else its address, else just the code. */
export function locationLabel(l: PartnerLocation): string {
  const name = l.label ?? l.address;
  return name ? `${name} (${l.code})` : l.code;
}

/**
 * Fill the `<select id>` with the login's locations and return the active
 * one. A single-location login sees no selector (the wrapper is hidden);
 * `onChange` fires with the newly selected location after it is remembered.
 *
 * Decision 6.140: closed venues still arrive in the list, so they are grouped
 * under a DISABLED "Closed" group rather than dropped. Listing them says why a
 * venue vanished from the switcher; disabling them means the page never sends
 * a code every per-location RPC refuses.
 */
export function mountLocationSelector(
  selectId: string,
  wrapId: string,
  locations: PartnerLocation[],
  onChange: (l: PartnerLocation) => void,
): PartnerLocation | null {
  const open = locations.filter(isOpenLocation);
  const closed = locations.filter((l) => !isOpenLocation(l));
  const active = pickLocation(locations);
  const select = el<HTMLSelectElement>(selectId);
  select.innerHTML = '';

  if (open.length === 0) {
    const none = document.createElement('option');
    none.textContent = 'No open locations';
    none.disabled = true;
    none.selected = true;
    select.appendChild(none);
  }
  for (const l of open) {
    const opt = document.createElement('option');
    opt.value = l.code_id;
    opt.textContent = locationLabel(l);
    opt.selected = active?.code_id === l.code_id;
    select.appendChild(opt);
  }
  if (closed.length > 0) {
    const group = document.createElement('optgroup');
    group.label = 'Closed';
    group.disabled = true;
    for (const l of closed) {
      const opt = document.createElement('option');
      opt.value = l.code_id;
      opt.textContent = locationLabel(l);
      opt.disabled = true;
      group.appendChild(opt);
    }
    select.appendChild(group);
  }

  show(wrapId, open.length > 1 || closed.length > 0);
  select.onchange = () => {
    const next = open.find((l) => l.code_id === select.value);
    if (!next) return;
    rememberLocation(next.code_id);
    onChange(next);
  };
  return active;
}

/**
 * Location plumbing for the per-location pages (report, print pack, members,
 * screen). Loads the login's locations and mounts the selector; returns the
 * active location, or null when locations cannot be loaded (a non-partner
 * session). Null means "send no code": the server then acts on the login's
 * primary location.
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
