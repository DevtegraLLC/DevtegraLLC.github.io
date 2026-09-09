// ===========================================================================
// portal.test.mjs — static assertions over the BUILT partner portal.
//
//   npm test   (astro build first; reads dist/)
//
// No browser: the server behavior behind every flow is integration-tested in
// the FitCreature repo (partner_* deno suites). What this guards is the
// portal artifact itself: every page built, the wiring strings are present
// in the bundles, and no secret-shaped value ever lands in dist.
// ===========================================================================

import fs from 'node:fs';
import path from 'node:path';

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ok  ${msg}`);
  else {
    console.error(`FAIL  ${msg}`);
    failures++;
  }
};

const PAGES = [
  'index.html',
  'dashboard/index.html',
  'brand/index.html',
  'listing/index.html',
  'report/index.html',
  'print-pack/index.html',
  'print/tent/index.html',
  'print/lobby/index.html',
  'account/index.html',
  'agreement/index.html',
  'admin/index.html',
  'members/index.html',
  'screen/index.html',
  'display/index.html',
  'team/index.html',
];
for (const page of PAGES) {
  ok(fs.existsSync(path.join('dist', page)), `built: ${page}`);
}

// Collect every built byte (HTML + hashed JS/CSS bundles).
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  );
const all = walk('dist')
  .filter((f) => /\.(html|js|css)$/.test(f))
  .map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n');

// Secret-leak guard: the PUBLISHABLE key is public by design; a secret or
// service key in a static bundle would be an incident. supabase-js itself
// mentions the sb_secret_ PREFIX in its own browser warning, so the guard
// matches key-shaped values, not the bare prefix.
ok(!/sb_secret_[A-Za-z0-9_-]{20,}/.test(all), 'no sb_secret key material in dist');
ok(!/eyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}"?\s*,?\s*"?role"?\s*:?\s*"?service_role/.test(all), 'no service-role JWT in dist');
ok(all.includes('sb_publishable_'), 'publishable key wired');

// Wiring: the pages call the real surface.
for (const needle of [
  // Decision 6.137 brand model: brand-level listing + brand-level takedown
  'get_my_partner_brand',
  'save_partner_brand_draft',
  'submit_partner_brand_draft',
  // Decision 6.138: one draft per brand carries every location change
  'save_partner_locations_draft',
  'p_locations',
  'location_required',
  'created_locations',
  'set_partner_listing_published',
  'p_brand_id',
  'get_partner_agreement_state',
  'accept_partner_agreement',
  'partner_download_agreement',
  'get_my_partner_metrics',
  'partner_print_pack',
  'partner_upload_logo',
  'admin_partner_review_queue',
  'admin_approve_partner_draft',
  'admin_publish_agreement',
  'admin_set_partner_status',
  'get_my_agreement_acceptances',
  // F92 partner display board
  'get_my_partner_locations',
  'get_partner_members',
  'partner_accept_member',
  'partner_remove_member',
  'get_my_partner_board',
  'rotate_partner_display_token',
  'functions/v1/partner_display',
  // Decision 6.139: brand admins vs location managers
  'get_my_partner_team',
  'grant_partner_location',
  'revoke_partner_location',
  'set_partner_login_role',
  'partner_set_login_status',
  'request_partner_login',
  'pending_requests',
  'forbidden_brand',
  'can_edit_brand',
  'can_add_location',
  'submit_block',
  // Draft concurrency + the server-minted entry key (Decision 6.139)
  'p_expected_updated_at',
  'p_remove_entry_ids',
  'entry_id',
  // Decision 6.140: the venue retire lifecycle
  'preview_partner_location_retire',
  'retire_partner_location',
  'reopen_partner_location',
  'can_retire_location',
  'retired_locations',
  'retire_grace_days',
  'archive_due_at',
  'logins_without_active_venue',
  'is_last_active_venue',
  'partner_status',
  'p_reason',
]) {
  ok(all.includes(needle), `wired: ${needle}`);
}

// The per-location draft RPCs were DROPPED with Decision 6.138; a bundle
// still naming one would call a function that no longer exists. The junction
// table and its attach path went with Decision 6.139, and the account's
// primary venue became default_code_id (is_default on the switcher).
for (const gone of [
  'get_my_partner_listing',
  'save_partner_draft',
  'submit_partner_draft',
  'attach_partner_code',
  'admin_attach_partner_location',
  'partner_account_codes',
  'is_primary',
  // Decision 6.140: referral_codes.is_active is a DERIVED MIRROR of
  // partner_status, and a direct UPDATE of it RAISES. Nothing in the portal
  // may reach for the table, let alone the flag.
  'referral_codes',
  // The hard teardown is internal (sweep + operator break-glass), never a
  // partner-facing control.
  'archive_partner_location',
]) {
  ok(!all.includes(gone), `retired RPC absent: ${gone}`);
}

// The lobby screen is a public page: no session guard, the token rides the
// URL, and it must never fetch with a signed-in session (a leaked link must
// not carry a login). Its own bundle is the one that names partner_display.
const displayHtml = fs.readFileSync('dist/display/index.html', 'utf8');
const displayScripts = [...displayHtml.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
const displayBundle = displayScripts
  .map((src) => fs.readFileSync(path.join('dist', src.replace(/^\//, '')), 'utf8'))
  .join('\n');
ok(displayBundle.includes('partner_display'), 'display page calls partner_display');
ok(!displayBundle.includes('requireSession') && !displayBundle.includes('getSession'), 'display page needs no session');
ok(displayHtml.includes('robots') && displayHtml.includes('noindex'), 'display page is noindex');
// Slide skeletons all present (the config decides which run).
for (const slide of ['slide-board', 'slide-top5', 'slide-join', 'slide-perk']) {
  ok(displayHtml.includes(`id="${slide}"`), `display slide: ${slide}`);
}
// Creature stills the board renders ride the brand library.
for (const s of ['alieo', 'brutoh', 'chi', 'karmuth', 'wolfie']) {
  ok(fs.existsSync(`dist/assets/brand/creatures/fc_creature_${s}_front.png`), `creature still present: ${s}`);
}

// F92 step 4: the per-location pages carry the location selector (hidden for
// a single-location login) and the print layouts accept the location on
// their URL, so a multi-location partner acts on the venue they picked.
for (const page of ['report', 'print-pack']) {
  ok(fs.readFileSync(`dist/${page}/index.html`, 'utf8').includes('id="loc-select"'), `location selector on ${page}`);
}
ok(all.includes('p_code_id'), 'per-location RPC argument wired');
ok(all.includes('code_id='), 'per-location code rides the print URLs');
// Decision 6.138: the Locations page edits EVERY venue at once (one draft per
// brand, one submission), so it has no selector and a partner can add venues.
const listingHtml = fs.readFileSync('dist/listing/index.html', 'utf8');
const listingBundle = [...listingHtml.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map((m) => fs.readFileSync(path.join('dist', m[1].replace(/^\//, '')), 'utf8'))
  .join('\n');
ok(!listingHtml.includes('loc-select') && !listingBundle.includes('loc-select'), 'locations page has no per-location selector');
ok(listingHtml.includes('id="loc-add"'), 'locations page lets the partner add a venue');
ok(listingBundle.includes('save_partner_locations_draft') && listingBundle.includes('submit_partner_brand_draft'),
  'locations page saves + submits the one brand draft');
// The logo is brand-level (Decision 6.137): the upload never names a location.
const brandHtml = fs.readFileSync('dist/brand/index.html', 'utf8');
const brandBundle = [...brandHtml.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map((m) => fs.readFileSync(path.join('dist', m[1].replace(/^\//, '')), 'utf8'))
  .join('\n');
ok(brandBundle.includes('partner_upload_logo') && !brandBundle.includes('code_id='), 'logo upload is brand-level');
ok(!fs.readFileSync('dist/listing/index.html', 'utf8').includes('f-logo'), 'location page carries no logo control');

// Decision 6.139, the role split. The Team page is brand-admin only: it
// renders its own "not available for your login" state from the server's
// forbidden_brand answer rather than an error, it carries the four team
// controls and the operator-mediated request flow, and the nav link that
// reaches it is hidden until the role says brand admin.
const teamHtml = fs.readFileSync('dist/team/index.html', 'utf8');
const teamBundle = [...teamHtml.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map((m) => fs.readFileSync(path.join('dist', m[1].replace(/^\//, '')), 'utf8'))
  .join('\n');
ok(teamHtml.includes('id="team-forbidden"'), 'team page renders a not-available state for a manager');
ok(teamBundle.includes('forbidden_brand'), 'team page reads the forbidden_brand answer');
for (const fn of [
  'get_my_partner_team',
  'grant_partner_location',
  'revoke_partner_location',
  'set_partner_login_role',
  'partner_set_login_status',
  'request_partner_login',
]) {
  ok(teamBundle.includes(fn), `team page calls ${fn}`);
}
ok(teamHtml.includes('id="req-form"') && teamHtml.includes('id="team-requests"'),
  'team page carries the request flow and its waiting list');
ok(teamHtml.includes('No invite email'), 'request flow says no invite email goes out');
// Every soft status the team RPCs can return is answered with next steps.
for (const status of ['last_brand_admin', 'self_demote', 'self_suspend', 'operator_only', 'is_brand_admin',
  'locations_required', 'already_requested']) {
  ok(all.includes(status), `team status handled: ${status}`);
}
// The Team link is nav-gated by role, and the role-gated markup exists on the
// pages a manager still reaches.
ok(all.includes('id="nav-team"'), 'nav carries the role-gated Team link');
ok(all.includes('syncNavRole') || all.includes('nav-team'), 'nav role sync wired');
ok(brandHtml.includes('id="brand-readonly"'), 'brand page has a read-only state for a manager');
ok(listingHtml.includes('id="submit-note"'), 'locations page explains a blocked submit');
ok(listingBundle.includes('submit_block') && listingBundle.includes('can_add_location'),
  'locations page renders submit + add-location from the server flags');
ok(listingBundle.includes('p_expected_updated_at') && listingBundle.includes('p_remove_entry_ids'),
  'locations save carries the concurrency token and explicit removals');
ok(brandBundle.includes('p_expected_updated_at'), 'brand save carries the concurrency token');
ok(all.includes('Another login changed this submission'), 'stale save tells the partner to reload');

// Decision 6.140, the venue retire lifecycle. Closing a location is a
// brand-admin action on the Locations page, behind a two-step confirm fed by
// preview_partner_location_retire, and closed venues get their own section
// with a Reopen that points at a fresh screen link.
ok(listingHtml.includes('id="retire-overlay"'), 'locations page carries the close confirm panel');
ok(listingHtml.includes('id="retired-section"') && listingHtml.includes('id="retired-list"'),
  'locations page carries the Closed locations section');
ok(listingHtml.includes('Closed locations'), 'Closed locations section is named');
for (const fn of ['preview_partner_location_retire', 'retire_partner_location', 'reopen_partner_location']) {
  ok(listingBundle.includes(fn), `locations page calls ${fn}`);
}
// The confirm names all three consequences in plain language, and the two a
// partner will not have thought about ride on the server's own answers.
ok(listingHtml.includes('The lobby screen goes dark now'), 'confirm says the lobby screen goes dark now');
ok(listingHtml.includes('Printed codes stop working now'), 'confirm says printed codes stop working now');
ok(listingHtml.includes('the member list is cleared') && listingHtml.includes('cannot be'),
  'confirm says the member list is cleared and cannot be undone');
ok(listingBundle.includes('is_last_active_venue') && listingBundle.includes('logins_without_active_venue'),
  'confirm surfaces the last-venue and stranded-login consequences');
ok(listingBundle.includes('only open location'), 'last open location is spelled out');
ok(listingBundle.includes('no open location'), 'stranded logins are spelled out');
// Step two: the panel is not the click that closes it.
ok(listingBundle.includes('confirm(') && listingBundle.includes('stop working right away'),
  'closing takes a second confirm');
// Reopen deliberately does NOT restore the screen token, so the UI says so.
ok(listingBundle.includes('was not restored'), 'reopen points the partner at a fresh screen link');
// Every soft status the lifecycle RPCs can return is answered with next steps.
for (const status of ['already_retired', 'not_retired', 'reason_too_long', 'unknown_location', 'archived']) {
  ok(all.includes(status), `lifecycle status handled: ${status}`);
}
// The shared selector groups closed venues under a disabled group, so the four
// per-location pages stop silently offering a venue the server refuses.
ok(all.includes('optgroup'), 'location selector groups closed venues');
ok(all.includes('No open locations'), 'selector says when nothing is open');

// The report page must carry the not-counted install framing (annex §9.5:
// never present an Android-only number as a total, never estimate).
ok(all.includes('cannot be counted') || all.includes('Not counted'), 'installs framed as not counted');

// The brand library rides every build (public/brand -> /assets/brand).
ok(fs.existsSync('dist/assets/brand/icons/fc_appicon_1024.png'), 'brand library copied into the portal build');
ok(fs.existsSync('dist/assets/brand/MANIFEST.md'), 'brand manifest rides along');
for (const v of ['color', 'black', 'white']) {
  ok(fs.existsSync(`dist/assets/brand/logos/fc_logo_${v}.png`) && fs.existsSync(`dist/assets/brand/logos/fc_logo_${v}.svg`),
    `logo variant present: ${v}`);
}
ok(all.includes('fc_logo_white.png') && all.includes('fc_logo_black.png'), 'print templates wired to the logo slots');
ok(all.includes('style=bw') || all.includes("style=${"), 'style variant links wired');

// No em dashes anywhere in the portal source (Will's standing copy rule;
// the F91 spec bans them in comments and UI copy too).
const srcFiles = walk('src').filter((f) => /\.(astro|ts|css)$/.test(f));
for (const f of srcFiles) {
  const text = fs.readFileSync(f, 'utf8');
  ok(!text.includes('\u2014'), `no em dash in ${f}`);
}

// The sign-in page never promises self-serve signup (accounts are provisioned).
const index = fs.readFileSync('dist/index.html', 'utf8');
ok(index.includes('set up by the FitCreature team'), 'no self-serve signup implied');

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nportal.test.mjs: all assertions passed');
