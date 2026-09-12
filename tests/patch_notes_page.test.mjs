// ===========================================================================
// patch_notes_page.test.mjs: /fitcreature/patch-notes/ (built page).
//
//   npm test        (runs `astro build` first)
//
// Invariants:
//   - the page exists at the published URL and the landing page links to it
//   - with no entries it renders the "in testing" state, never an empty list
//   - with entries, they are ordered newest build first and every one
//     carries its <version>-<build> anchor and both store dates
// ===========================================================================

import fs from 'node:fs';
import path from 'node:path';

const PAGE = path.join('dist', 'fitcreature', 'patch-notes', 'index.html');
const LANDING = path.join('dist', 'fitcreature', 'index.html');
let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.error(`FAIL: ${msg}`); } };

check(fs.existsSync(PAGE), `${PAGE} was not built`);
const html = fs.existsSync(PAGE) ? fs.readFileSync(PAGE, 'utf8') : '';
const landing = fs.readFileSync(LANDING, 'utf8');
check(landing.includes('href="/fitcreature/patch-notes/"'), 'landing page does not link to the patch notes page');

const anchors = [...html.matchAll(/<article id="(\d+\.\d+\.\d+)-(\d+)"/g)].map((m) => ({ version: m[1], build: Number(m[2]) }));
const entryFiles = fs.readdirSync(path.join('src', 'content', 'patch-notes')).filter((f) => f.endsWith('.md'));

if (entryFiles.length === 0) {
  check(html.includes('id="in-testing"'), 'no entries but the in-testing state is missing');
  check(anchors.length === 0, 'no entry files but the page rendered entries');
} else {
  check(!html.includes('id="in-testing"'), 'entries exist but the in-testing state still renders');
  check(anchors.length === entryFiles.length, `expected ${entryFiles.length} entries, page has ${anchors.length}`);
  for (let i = 1; i < anchors.length; i++) {
    check(anchors[i - 1].build > anchors[i].build, `entries out of order at ${anchors[i - 1].build} -> ${anchors[i].build}`);
  }
  for (const a of anchors) {
    const file = `${a.version}-${a.build}.md`;
    check(entryFiles.includes(file), `anchor ${a.version}-${a.build} has no ${file}`);
  }
  check((html.match(/App Store [A-Z][a-z]+ \d+, \d{4} &middot; Google Play/g) || []).length === anchors.length,
    'every entry must show both store dates');
}

if (failures) { console.error(`${failures} patch-notes assertion(s) failed`); process.exit(1); }
console.log(`patch_notes_page: ok (${anchors.length} entries)`);
