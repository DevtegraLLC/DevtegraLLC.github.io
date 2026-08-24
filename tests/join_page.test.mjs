// ===========================================================================
// join_page.test.mjs — /join landing-page state machine.
//
//   npm test        (runs `astro build` first — this reads the BUILT page)
//
// The page renders a neutral "you've got a code" state for any well-formed
// ?ref, then the ref_scan answer resolves it. The invariant worth guarding:
// a code the server does not know must NOT read as a real invitation, and
// an endpoint FAILURE must not downgrade a real one. Both directions are
// asserted below, plus the user / promo / partner framings.
//
// Runs the built page's inline script against a minimal DOM shim — no
// browser, no dependencies.
// ===========================================================================

import fs from 'node:fs';
import path from 'node:path';

const PAGE = path.join('dist', 'join', 'index.html');
const html = fs.readFileSync(PAGE, 'utf8');
const inline = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .filter((s) => s.includes('CODE_RE'));
if (inline.length !== 1) {
  console.error(`expected exactly 1 inline join script in ${PAGE}, found ${inline.length}`);
  process.exit(1);
}
const src = inline[0];

function makeEnv(refValue, scanResult) {
  const els = {};
  for (const id of ['join-generic','join-referred','join-code','join-copy','join-copied',
                    'join-headline','join-blurb','join-partner-logo',
                    'join-unknown-note','join-unknown-code']) {
    // Mirror the markup's initial hidden state, so an assertion about a
    // block staying hidden is a real assertion.
    const initiallyHidden = ['join-referred','join-copied','join-partner-logo','join-unknown-note'];
    els[id] = { id, hidden: initiallyHidden.includes(id), textContent: '', src: '', alt: '',
                addEventListener() {} };
  }
  const env = {
    document: { getElementById: (id) => els[id] },
    location: { search: `?ref=${refValue}` },
    navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14)' },
    URLSearchParams,
    fetch: async () => (scanResult === null
      ? { ok: false }
      : { ok: true, json: async () => scanResult }),
    els,
  };
  return env;
}

async function run(ref, scanResult) {
  const env = makeEnv(ref, scanResult);
  const fn = new Function('document','location','navigator','URLSearchParams','fetch', src);
  fn(env.document, env.location, env.navigator, env.URLSearchParams, env.fetch);
  await new Promise((r) => setTimeout(r, 10));
  return env.els;
}

let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : ' :: ' + detail}`);
  if (!cond) failures++;
}

// 1. Unknown code -> generic page + note, no invite framing.
let e = await run('XXXXXXXX', { ok: true, status: 'unknown' });
check('unknown: referred block hidden', e['join-referred'].hidden === true, JSON.stringify(e['join-referred']));
check('unknown: generic block shown', e['join-generic'].hidden === false, '');
check('unknown: note shown with code', e['join-unknown-note'].hidden === false && e['join-unknown-code'].textContent === 'XXXXXXXX', e['join-unknown-code'].textContent);

// 2. Real user code -> invite framing.
e = await run('3CGNJZF6', { ok: true, status: 'ok', code_type: 'user' });
check('user: referred block shown', e['join-referred'].hidden === false, '');
check('user: invite headline', e['join-headline'].textContent === "You've been invited.", e['join-headline'].textContent);
check('user: note stays hidden', e['join-unknown-note'].hidden === true, 'note leaked');

// 3. Promo code -> campaign framing.
e = await run('FCTT2026', { ok: true, status: 'ok', code_type: 'promo' });
check('promo: campaign headline', e['join-headline'].textContent === 'You found a FitCreature code.', e['join-headline'].textContent);
check('promo: referred block shown', e['join-referred'].hidden === false, '');
check('promo: note stays hidden', e['join-unknown-note'].hidden === true, 'note leaked');

// 4. Partner code -> partner branding.
e = await run('RRCOFFEE', { ok: true, status: 'ok', code_type: 'partner', partner_name: 'River Road Coffee', partner_logo_url: 'https://x/logo.png' });
check('partner: branded headline', e['join-headline'].textContent === 'A welcome from River Road Coffee.', e['join-headline'].textContent);
check('partner: logo shown', e['join-partner-logo'].hidden === false, '');

// 5. Endpoint failure -> neutral state stands, nothing downgraded.
e = await run('3CGNJZF6', null);
check('failure: referred block still shown', e['join-referred'].hidden === false, '');
check('failure: neutral headline kept', e['join-headline'].textContent === '', 'headline was mutated: ' + e['join-headline'].textContent);
check('failure: no unknown note', e['join-unknown-note'].hidden === true, 'note leaked');

// 6. No ref at all -> nothing touched.
e = await run('', { ok: true, status: 'unknown' });
check('no ref: referred block stays hidden', e['join-referred'].hidden === true && e['join-code'].textContent === '', '');

process.exit(failures ? 1 : 0);
