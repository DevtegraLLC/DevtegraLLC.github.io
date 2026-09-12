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
// Decision 6.144: a partner board shows a position, a handle and a species,
// and nothing that explains the order. No level, streak or strength on the
// public lobby screen or on the portal's screen preview.
for (const [label, needle] of [
  ['level field', '.level'],
  ['streak field', '.streak'],
  ['streak copy', 'day streak'],
  ['level copy', 'Lv '],
]) {
  ok(!displayBundle.includes(needle), `lobby screen renders no ${label}`);
}
const screenHtml = fs.readFileSync('dist/screen/index.html', 'utf8');
const screenBundle = [...screenHtml.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map((m) => fs.readFileSync(path.join('dist', m[1].replace(/^\//, '')), 'utf8'))
  .join('\n');
ok(!/>\s*Level\s*</.test(screenHtml) && !/>\s*Streak\s*</.test(screenHtml), 'screen preview has no Level or Streak column');
ok(!screenBundle.includes('.streak') && !screenBundle.includes('.level'), 'screen preview renders no level or streak field');

// Accept and remove rebuild the board in the same transaction (migration
// 20260909000000), so the Members page must not tell partners to wait for a
// daily refresh.
const membersHtml = fs.readFileSync('dist/members/index.html', 'utf8');
const membersBundle = [...membersHtml.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map((m) => fs.readFileSync(path.join('dist', m[1].replace(/^\//, '')), 'utf8'))
  .join('\n');
ok(!membersHtml.includes('daily refresh') && !membersBundle.includes('daily refresh'), 'members page no longer says the board waits for a daily refresh');

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

// ===========================================================================
// Decisions 6.141 / 6.142: notification contacts, switches and routing.
// Two independent questions per notice. WHERE it goes: venue address, else
// brand address, else every active brand login's sign-in address. WHETHER it
// goes: a master switch ANDed with a per-event switch. The assertions below
// guard the three things that are easy to render wrong.
// ===========================================================================
for (const needle of [
  'set_partner_brand_settings',
  'set_partner_location_settings',
  'can_edit_brand_settings',
  'notifications_enabled',
  'notify_draft_approved',
  'notify_draft_changes_requested',
  'notify_member_join_request',
  'contact_email_source',
  'resolved_recipients',
  'recipients_visible',
  'notification_routing',
  'brand_settings',
]) {
  ok(all.includes(needle), `notifications wired: ${needle}`);
}

// 1. An address field never renders empty: every tier resolves to a sentence
//    naming where the notice lands, and the last tier is an ARRAY of every
//    active brand login, so the copy agrees in number.
ok(all.includes("this location's own address"), 'venue_override source sentence');
ok(all.includes('your brand address. Set one here to use a different one'), 'brand_override source sentence');
ok(all.includes('the sign-in address of your brand login, because nothing else is set'),
  'brand_login source sentence');
ok(all.includes('the sign-in addresses of your brand logins'), 'the fallback tier is rendered as a set');
ok(all.includes('No address resolves yet'), 'an empty chain is said plainly rather than left blank');

// 2. A lit switch that is not sending says so, with the master right there.
ok(all.includes('notifications are off entirely for your brand right now'), 'brand lit-but-off note');
ok(all.includes('notifications are off entirely for this location right now'), 'venue lit-but-off note');

// 3. Brand off does not mute the venues, said beside the brand master switch.
ok(all.includes('It does not mute your locations'), 'brand master says the venues are not muted');
ok(all.includes('Its address is kept'), 'muting a level keeps its address');

// 4. The muted badge rides the venue CARD, so a brand admin sees a quiet venue
//    without opening anything.
ok(all.includes('Notifications off'), 'muted badge copy');
ok(listingHtml.includes('data-muted') || listingBundle.includes('data-muted'), 'muted badge is on the venue card');
ok(listingBundle.includes('data-notify'), 'venue cards carry a notification editor');

// 5. recipients_visible false REDACTS the address and keeps the row: the tier
//    is still named, the brand's own addresses are not printed.
ok(all.includes('Going to your brand address. A brand login can see it and change it'),
  'redacted brand_override keeps the source sentence');
ok(all.includes('A brand login can set a brand address instead'), 'redacted brand_login keeps the source sentence');

// Every soft status both write RPCs can return is answered with next steps.
for (const line of [
  'Nothing had changed, so nothing was saved',              // nothing_to_change
  'accept the current agreements on the Overview page',      // agreements_required
  'Brand notifications are set by a brand login',            // forbidden_brand
  'That location is not one your login covers',              // forbidden_code
  'its notifications are paused',                            // retired
  'has been archived, so its settings are gone',             // archived
  'This login is suspended',                                 // suspended
  'not a partner account, so it has no notification settings', // not_a_partner
  'Your session has ended',                                  // unauthorized
]) {
  ok(all.includes(line), `settings status handled: ${line}`);
}
// The typed validation codes, each said as the thing to fix.
for (const line of [
  'A plain business address such as ops@yourgym.example works best', // not_an_address
  'has a space in it',                                              // whitespace
  'has a < or > in it',                                             // html
  'carries hidden characters',                                      // zero_width
  'characters this field cannot carry',                             // control_or_astral
  'longer than 254 characters',                                     // max_length
  'That switch could not be read',                                  // not_a_boolean
  'That change could not be read',                                  // not_an_object
]) {
  ok(all.includes(line), `settings error handled: ${line}`);
}

// The brand page carries the brand-admin-only editor; it is hidden, not
// half-rendered, for a location manager (settings arrives null).
ok(brandHtml.includes('id="brand-notify"'), 'brand page carries the notifications section');
for (const id of ['bn-email', 'bn-source', 'bn-master', 'bn-events']) {
  ok(brandHtml.includes(`id="${id}"`), `brand notifications control: ${id}`);
}
ok(brandBundle.includes('set_partner_brand_settings'), 'brand page writes through the brand settings RPC');
ok(listingBundle.includes('set_partner_location_settings'), 'locations page writes through the venue settings RPC');
// A closed venue keeps its address and says routing is paused (annex §18.4).
ok(listingBundle.includes('Notices are paused while this location is closed'),
  'closed locations say routing is paused and the address is kept');

// The Account page says what "change contact email" actually does: it moves
// the SIGN-IN address, which is also the last notification fallback. That
// wording is what hid a live drift bug (Decision 6.141).
const accountHtml = fs.readFileSync('dist/account/index.html', 'utf8');
ok(accountHtml.includes('Change your sign-in email'), 'account page names the sign-in address');
ok(accountHtml.includes('confirmation link') && accountHtml.includes('new address'),
  'account page says the new address is confirmed by a mailed link');
ok(accountHtml.includes('last fallback for business notices'),
  'account page says the sign-in address is the notification fallback');
ok(!accountHtml.includes('Change contact email'), 'the old drifting "contact email" wording is gone');

// The review queue shows where an approve / changes-requested answer lands,
// resolved rather than as stored intent, and calls out the empty case.
const adminHtml = fs.readFileSync('dist/admin/index.html', 'utf8');
const adminBundle = [...adminHtml.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map((m) => fs.readFileSync(path.join('dist', m[1].replace(/^\//, '')), 'utf8'))
  .join('\n');
ok(adminBundle.includes('notification_routing'), 'review queue reads the resolved routing');
ok(adminBundle.includes('Where your decision lands'), 'review queue names the routing block');
ok(adminBundle.includes('Nobody would be mailed'), 'review queue makes the empty recipient list visible');
for (const reason of ['notifications_disabled', 'event_switch_off', 'no_address', 'venue_retired', 'venue_archived']) {
  ok(adminBundle.includes(reason), `review queue names the suppression: ${reason}`);
}

// ===========================================================================
// Decision 6.152 / BUG_LOG B95: a partner login is deactivated, never deleted.
// The operator console closes a login through admin_deactivate_partner_login
// (superadmin, audited) behind a two-step confirm that names every
// consequence, and the sign-in page says plainly when a login is closed.
// ===========================================================================
ok(adminBundle.includes('admin_deactivate_partner_login'), 'console calls admin_deactivate_partner_login');
ok(adminBundle.includes('p_partner_account_id') && adminBundle.includes('p_note'),
  'deactivation passes the two parameters the RPC defines');
ok(adminBundle.includes('brand_has_active_admin') && adminBundle.includes('has no active brand admin left'),
  'console warns when the brand has no active brand admin left');
for (const status of ['already_deactivated', 'not_found', 'admin_forbidden']) {
  ok(adminBundle.includes(status), `deactivation outcome handled: ${status}`);
}
ok(adminBundle.includes('Deactivated'), 'a deactivated row carries the Deactivated badge');
ok(adminBundle.includes('can no longer be suspended or reactivated'),
  "console answers admin_set_partner_status's 409 deactivated");
ok(adminHtml.includes('id="deact-overlay"') && adminHtml.includes('id="deact-note"'),
  'console carries the deactivate confirm panel with the audit note');
for (const [label, needle] of [
  ['permanent', 'It is permanent'],
  ['sign-in and every session end at once', 'every open session on this login ends at'],
  ['venue access is removed', 'Its venue access is removed'],
  ['acceptance records are kept', 'Its agreement acceptance records are kept'],
  ['coming back needs a different sign-in address', 'a different sign-in address'],
]) {
  ok(adminHtml.includes(needle), `deactivate confirm says: ${label}`);
}
ok(adminBundle.includes('confirm(') && adminBundle.includes('for good'), 'deactivating takes a second confirm');
// Operator only: no partner-facing page reaches for it.
for (const page of PAGES.filter((pg) => pg !== 'admin/index.html')) {
  const html = fs.readFileSync(path.join('dist', page), 'utf8');
  const bundles = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((m) => fs.readFileSync(path.join('dist', m[1].replace(/^\//, '')), 'utf8'))
    .join('\n');
  ok(!html.includes('admin_deactivate_partner_login') && !bundles.includes('admin_deactivate_partner_login'),
    `no deactivation call on ${page}`);
}
// Sign-in: GoTrue refuses a banned (deactivated) login with user_banned. The
// page's script may be inlined, so the HTML is read alongside its bundles.
const signInHtml = fs.readFileSync('dist/index.html', 'utf8');
const signInCode = signInHtml + [...signInHtml.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map((m) => fs.readFileSync(path.join('dist', m[1].replace(/^\//, '')), 'utf8'))
  .join('\n');
ok(signInCode.includes('user_banned'), 'sign-in reads the user_banned error code');
ok(signInCode.includes('This login has been closed. Contact us at contact.us@devtegra.com if you think this is a mistake.'),
  'sign-in says plainly when a login is closed');
ok(signInCode.includes('mailto:'), 'the contact address on the closed-login line is a link');
ok(signInCode.includes('sign-in didn'), 'every other sign-in refusal keeps the generic line');

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
