#!/usr/bin/env node
/**
 * Gateway 2 verifier (SOP §5).
 *
 * `npm run build` exiting 0 only proves the bundler finished. It says nothing about what
 * actually ships to a first-time visitor, and the two failures this guards against are
 * both silent:
 *
 *   1. Source maps in dist/ — full pre-minified source on a public CDN.
 *   2. An oversized initial payload. A 2.1 MB `web3` chunk was being `modulepreload`ed
 *      from index.html, so every visitor paid for it before the hero rendered even though
 *      a wallet is optional (Architectural Law 4).
 *
 * Also re-checks `public/_headers` for the two CSP properties the SOP forbids losing:
 * no `'unsafe-eval'`, and no wildcard host in `connect-src`.
 *
 * Usage: node scripts/verify-build.mjs [--max-initial-kb=850]
 * Exit code 1 on any violation.
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// SOP Playbook C target for a route bundle. Recorded, not enforced, until the web3
// extraction lands — see docs/audit-2026-11-02.md §3.
const SOP_TARGET_KB = 200;

const argMax = process.argv.find((a) => a.startsWith('--max-initial-kb='));
const MAX_INITIAL_KB = argMax ? Number(argMax.split('=')[1]) : 850;

const failures = [];
const notes = [];

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
const gzipKb = async (relPath) => {
  const buf = await readFile(join(DIST, relPath.replace(/^\//, '')));
  return gzipSync(buf, { level: 9 }).length;
};

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

// ---- 1. no source maps ------------------------------------------------------
const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
};
const files = await walk(DIST);
const maps = files.filter((f) => f.endsWith('.map'));
if (maps.length) {
  failures.push(`${maps.length} source map(s) in dist/ — e.g. ${maps[0].replace(ROOT + '/', '')}`);
}

// ---- 2. initial payload -----------------------------------------------------
const html = await readFile(join(DIST, 'index.html'), 'utf8');
const preloads = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
const entry = (html.match(/<script[^>]+src="([^"]+)"/) || [])[1];
const css = (html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/) || [])[1];

// The `web3` chunk is the one we care about most: it must not be preloaded.
const initialAssets = [...new Set([entry, css, ...preloads].filter(Boolean))];
let initialBytes = 0;
const rows = [];
for (const asset of initialAssets) {
  const size = await gzipKb(asset);
  initialBytes += size;
  rows.push({ asset: asset.replace('/assets/', ''), gzip: size });
}

console.log('Initial payload (entry + modulepreload + css), gzipped:');
for (const row of rows.sort((a, b) => b.gzip - a.gzip)) {
  console.log(`  ${kb(row.gzip).padStart(10)}  ${row.asset}`);
}
console.log(`  ${kb(initialBytes).padStart(10)}  TOTAL`);

const web3Preloaded = preloads.some((p) => /web3/i.test(p));
if (web3Preloaded) {
  notes.push(
    'web3 chunk is still modulepreloaded from index.html — the SOP target of ' +
      `${SOP_TARGET_KB} kB cannot be met until the wallet layer is code-split (see audit §3).`
  );
}

if (initialBytes / 1024 > MAX_INITIAL_KB) {
  failures.push(
    `initial payload ${kb(initialBytes)} exceeds the ${MAX_INITIAL_KB} kB ceiling ` +
      '(regression guard; raise deliberately or fix the regression)'
  );
} else if (initialBytes / 1024 > SOP_TARGET_KB) {
  // Known deviation, not a build failure. Reported so it cannot be forgotten.
  console.log(
    `\n! ${kb(initialBytes)} initial vs the ${SOP_TARGET_KB} kB SOP target ` +
      `(+${kb(initialBytes - SOP_TARGET_KB * 1024)}). Tracked as open item, not a gate failure.`
  );
}

// ---- 3. CSP invariants ------------------------------------------------------
const headers = await readFile(join(ROOT, 'public', '_headers'), 'utf8');
const csp = (headers.match(/Content-Security-Policy:\s*(.+)/) || [])[1] || '';
if (!csp) failures.push('public/_headers has no Content-Security-Policy');
if (/unsafe-eval/.test(csp)) failures.push("CSP contains 'unsafe-eval'");
if (/connect-src[^;]*\*\.supabase\.co/.test(csp)) {
  failures.push('CSP connect-src allows any Supabase project (*.supabase.co)');
}
if (!/connect-src[^;]*xzdgytloaczpzmtflenl\.supabase\.co/.test(csp)) {
  failures.push('CSP connect-src is missing the APF Supabase project origin');
}

// ---- 4. no secrets compiled into the bundle --------------------------------
const SECRET_PATTERNS = [
  /sk_live_[0-9a-zA-Z]{10,}/,
  /sk_test_[0-9a-zA-Z]{10,}/,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /EMAILIT_API_KEY/,
  /AI_API_SECRET/,
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/
];
for (const file of files.filter((f) => /\.(js|css|html)$/.test(f))) {
  const text = await readFile(file, 'utf8');
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      failures.push(`possible secret matching ${pattern} in ${file.replace(ROOT + '/', '')}`);
    }
  }
}

// ---- report ----------------------------------------------------------------
for (const note of notes) console.log(`\n! ${note}`);

if (failures.length) {
  console.error('\nBUILD VERIFICATION FAILED');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log('\n✓ no source maps, CSP invariants intact, no secrets in dist/');
