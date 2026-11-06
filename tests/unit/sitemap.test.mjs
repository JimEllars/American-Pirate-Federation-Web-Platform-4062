import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { FORUM_CATEGORIES } from '../../src/lib/forum/categories.js';

/**
 * `public/sitemap.xml` carries a standing instruction: "the SPA routes in src/App.jsx are
 * the set that exists ... Update both this file and App.jsx together." Between 2026-11-05 and
 * 2026-11-06 the forum and the member directory shipped without it, so /forum, /members and
 * all eight boards were missing from the sitemap. This test is the missing enforcement.
 *
 * Routes that must not be indexed are listed explicitly with a reason, so adding one is a
 * decision rather than an omission.
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');

const NOT_FOR_SEARCH_ENGINES = new Map([
  ['/profile', 'signed-in member’s own record; there is nothing public to index']
]);

const readSitemapPaths = () => {
  const xml = readFileSync(resolve(root, 'public/sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1].trim());
    return url.pathname.replace(/\/+$/, '') || '/';
  });
};

const readAppRoutes = () => {
  const source = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
  return [...source.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]);
};

const routeMatches = (route, path) => {
  if (route === '*') return false;
  const pattern = new RegExp(
    `^${route
      .split('/')
      .map((segment) => (segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('/')}$`
  );
  return pattern.test(path);
};

test('every sitemap URL is a route the app actually serves', () => {
  const routes = readAppRoutes();
  for (const path of readSitemapPaths()) {
    assert.ok(
      routes.some((route) => routeMatches(route, path)),
      `${path} is in the sitemap but no route in src/App.jsx serves it`
    );
  }
});

test('every public static route is in the sitemap', () => {
  const sitemap = new Set(readSitemapPaths());
  const missing = readAppRoutes()
    .filter((route) => route !== '*' && !route.includes(':'))
    .filter((route) => !NOT_FOR_SEARCH_ENGINES.has(route))
    .filter((route) => !sitemap.has(route.replace(/\/+$/, '') || '/'));

  assert.deepEqual(missing, [], `routes missing from public/sitemap.xml: ${missing.join(', ')}`);
});

test('the sitemap lists exactly the forum boards the app ships', () => {
  const sitemap = new Set(readSitemapPaths());
  const expected = FORUM_CATEGORIES.map((category) => `/forum/${category.slug}`);
  const listed = [...sitemap].filter((path) => path.startsWith('/forum/')).sort();

  assert.deepEqual(listed, [...expected].sort());
});

test('the sitemap declares no duplicate URLs', () => {
  const paths = readSitemapPaths();
  assert.equal(new Set(paths).size, paths.length);
});
