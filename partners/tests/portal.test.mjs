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
  'listing/index.html',
  'report/index.html',
  'print-pack/index.html',
  'print/tent/index.html',
  'print/lobby/index.html',
  'account/index.html',
  'agreement/index.html',
  'admin/index.html',
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
  'get_my_partner_listing',
  'save_partner_draft',
  'submit_partner_draft',
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
]) {
  ok(all.includes(needle), `wired: ${needle}`);
}

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
