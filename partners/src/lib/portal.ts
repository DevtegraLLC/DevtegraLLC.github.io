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
