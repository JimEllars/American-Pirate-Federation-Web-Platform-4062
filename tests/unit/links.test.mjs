import test from 'node:test';
import assert from 'node:assert/strict';

import { LINK_LIMITS, isSafeLinkUrl, normalizeLinks, safeLinkUrl } from '../../src/lib/api/links.js';

/**
 * Member profile links land in an `href`. These cases are the ones a member could store by
 * posting straight to PostgREST, bypassing the form.
 */

test('http and https URLs are kept', () => {
  assert.equal(safeLinkUrl('https://example.org/crew'), 'https://example.org/crew');
  assert.equal(safeLinkUrl('http://example.org'), 'http://example.org');
  assert.equal(safeLinkUrl('  https://example.org  '), 'https://example.org');
  assert.equal(safeLinkUrl('HTTPS://example.org/Upper'), 'HTTPS://example.org/Upper');
});

test('script and data schemes are refused, not rewritten', () => {
  const hostile = [
    'javascript:alert(document.cookie)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '//example.org/protocol-relative',
    'example.org/no-scheme'
  ];
  for (const value of hostile) {
    assert.equal(safeLinkUrl(value), '', `expected ${JSON.stringify(value)} to be refused`);
    assert.equal(isSafeLinkUrl(value), false);
  }
});

test('malformed http URLs are refused', () => {
  assert.equal(safeLinkUrl('https://'), '');
  assert.equal(safeLinkUrl('https:// example.org'), '');
  assert.equal(safeLinkUrl('https://exa mple.org'), '');
});

test('empty and non-string values are refused without throwing', () => {
  assert.equal(safeLinkUrl(''), '');
  assert.equal(safeLinkUrl('   '), '');
  assert.equal(safeLinkUrl(null), '');
  assert.equal(safeLinkUrl(undefined), '');
  assert.equal(safeLinkUrl(42), '');
});

test('normalizeLinks drops hostile entries and keeps the good ones', () => {
  const links = normalizeLinks([
    { label: 'Website', url: 'https://example.org' },
    { label: 'Trap', url: 'javascript:alert(1)' },
    { label: 'Social', url: 'https://social.example/@crew' },
    null,
    'not-an-object'
  ]);
  assert.deepEqual(links, [
    { label: 'Website', url: 'https://example.org' },
    { label: 'Social', url: 'https://social.example/@crew' }
  ]);
});

test('normalizeLinks caps the count, the label and the URL length', () => {
  const many = Array.from({ length: 9 }, (_, index) => ({
    label: `l${index}`,
    url: `https://example.org/${index}`
  }));
  assert.equal(normalizeLinks(many).length, LINK_LIMITS.count);

  const [long] = normalizeLinks([{ label: 'x'.repeat(200), url: 'https://example.org' }]);
  assert.equal(long.label.length, LINK_LIMITS.label);

  const [longUrl] = normalizeLinks([{ label: 'x', url: `https://example.org/${'a'.repeat(500)}` }]);
  assert.ok(longUrl, 'a long but valid URL is kept');
  assert.ok(longUrl.url.length <= LINK_LIMITS.url);
});

test('normalizeLinks tolerates a non-array payload', () => {
  assert.deepEqual(normalizeLinks(null), []);
  assert.deepEqual(normalizeLinks('[]'), []);
  assert.deepEqual(normalizeLinks({ 0: { url: 'https://example.org' } }), []);
});
