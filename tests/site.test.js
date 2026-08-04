// Tests for the public static site: structure, copy and routing config.
//
// These assert the intended state of the shipped HTML rather than any runtime
// behaviour, because the site has no build step and the HTML in public/ is what
// Vercel serves. They exist mainly to stop the retired Civilizational Stack
// framework from creeping back in, and to pin copy that has been reverted once.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const PUBLIC_PAGES = ['public/index.html', 'public/principles.html'];

const home = read('public/index.html');
const principles = read('public/principles.html');
const sitemap = read('public/sitemap.xml');
const vercel = JSON.parse(read('vercel.json'));

// Strip the inline <style> and <script> blocks so copy assertions only see
// rendered markup, not CSS class names or JS strings.
function markup(html) {
  return html
    .replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '');
}

// ── the retired framework ────────────────────────────────────────────────────

test('no public page mentions the civilizational stack', () => {
  for (const p of PUBLIC_PAGES) {
    assert.doesNotMatch(read(p), /civilizational stack/i, `${p} mentions the framework`);
  }
});

test('the framework page is deleted', () => {
  assert.equal(existsSync(resolve(root, 'public/civilizational-stack.html')), false);
});

test('no primary nav links to the framework', () => {
  for (const p of PUBLIC_PAGES) {
    const nav = read(p).match(/<nav[\s\S]*?<\/nav>/)?.[0] ?? '';
    assert.doesNotMatch(nav, /stack/i, `${p} nav still links to the framework`);
    assert.doesNotMatch(nav, /The Stack/, `${p} nav still has The Stack`);
  }
});

test('no footer links to the framework', () => {
  for (const p of PUBLIC_PAGES) {
    assert.doesNotMatch(read(p), /href="\/civilizational-stack"/, `${p} footer links to the framework`);
  }
});

test('the homepage has no stack section or stack CSS', () => {
  assert.doesNotMatch(home, /id="stack"/);
  assert.doesNotMatch(home, /stack-diagram|stack-term|stack-concept|stack-lede|stack-meta/);
});

test('the sitemap lists the homepage only', () => {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, ['https://opencivilization.fm/']);
});

test('both retired framework URLs redirect permanently to the homepage', () => {
  for (const source of ['/civilizational-stack', '/civilizational-stack.html']) {
    const rule = vercel.redirects.find((r) => r.source === source);
    assert.ok(rule, `missing redirect for ${source}`);
    assert.equal(rule.destination, '/');
    assert.equal(rule.permanent, true);
  }
});

test('the retired archive routes redirect permanently', () => {
  for (const source of ['/episodes', '/episodes.html']) {
    const rule = vercel.redirects.find((r) => r.source === source);
    assert.ok(rule, `missing redirect for ${source}`);
    assert.equal(rule.permanent, true);
    assert.match(rule.destination, /^\/(#episodes)?$/);
  }
});

test('existing redirects and rewrites survive', () => {
  const sources = vercel.redirects.map((r) => r.source);
  assert.ok(sources.includes('/principles.html'));
  assert.ok(sources.includes('/doctrine'));
  const rewrites = vercel.rewrites.map((r) => r.source);
  assert.deepEqual(rewrites, ['/api/(.*)', '/framing-engine', '/guest-desk']);
  assert.equal(vercel.cleanUrls, true);
  assert.equal(vercel.outputDirectory, 'public');
});

// ── copy that has been wrong or reverted before ──────────────────────────────

test('the host biography uses the approved copy', () => {
  assert.match(home, /Born in Tehran and raised in France, Mehdi Nayebi is an entrepreneur and former banker/);
  assert.match(home, /He began his career in structured products at Deutsche Bank and Bank of America/);
  assert.match(home, /Building under an authoritarian system, and later leaving Iran for safety reasons/);
  assert.match(home, /an inquiry into how free societies can remain open, capable and strong enough to endure/);
});

test('the superseded host phrasing is gone', () => {
  for (const phrase of [
    'has spent much of his life thinking about',
    'sanctioned authoritarian system',
    'what a closed society actually looks like',
  ]) {
    assert.ok(!home.includes(phrase), `host bio still contains: ${phrase}`);
  }
});

test('the dispatch body is the approved non-framework copy', () => {
  assert.match(
    home,
    /Essays, research notes and signals on the technologies, institutions and strategic dependencies reshaping the free world/
  );
  assert.match(home, /Dispatch · Monthly/);
  assert.match(home, /A monthly <em>dispatch<\/em> for people who want the deeper map\./);
  assert.match(home, /Receive the dispatch/);
});

test('the hero question avoids the open / less open repetition', () => {
  assert.match(
    home,
    /Can open societies build, govern, innovate and defend themselves at the scale and speed this century demands, without sacrificing what makes them worth defending\?/
  );
  const hero = home.match(/<p class="hero-promise">[\s\S]*?<\/p>/)[0];
  assert.doesNotMatch(hero, /less open/);
});

test('the hero descriptor is serif and subordinate', () => {
  const rule = home.match(/\.hero-descriptor \{[^}]*\}/)[0];
  assert.match(rule, /font-family: var\(--serif\)/);
  assert.doesNotMatch(rule, /var\(--mono\)/);
  assert.match(rule, /var\(--body-md-size\)/);
  assert.match(home, /A show by Mehdi Nayebi on technology, power and the future of the free world\./);
});

test('the first hero action reads Episodes', () => {
  const actions = home.match(/<div class="hero-actions">[\s\S]*?<\/div>/)[0];
  assert.match(actions, /href="#episodes">Episodes /);
  assert.match(actions, /href="#dispatch">Join the dispatch /);
});

test('the episodes section uses episode language', () => {
  assert.match(home, /<div class="section-num">Episodes<\/div>/);
  assert.match(home, /The questions that <em>define the show\.<\/em>/);
  assert.match(home, /The first ten episodes examine the forces deciding whether open societies remain capable/);
});

test('accepted premise, guests and listen copy is intact', () => {
  assert.match(home, /A show by Mehdi Nayebi on technology, power and the future of the free world\./);
  assert.match(home, /Free, and <em>fragile\.<\/em>/);
  assert.match(home, /Open Civilization examines what makes open societies capable/);
  assert.match(home, /Open Civilization speaks with dissidents, founders, investors/);
  assert.match(home, /Listen and <em>watch\.<\/em>/);
  assert.match(home, /Open Civilization examines whether open societies can build, govern, innovate and defend themselves/);
});

// ── structure ────────────────────────────────────────────────────────────────

test('homepage sections are in the approved order', () => {
  const ids = [...home.matchAll(/<section class="[^"]*" id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['premise', 'episodes', 'principles', 'host', 'guests', 'listen', 'dispatch']);
});

test('back-compatible anchors survive', () => {
  for (const id of ['question', 'doctrine', 'guest']) {
    assert.match(home, new RegExp(`id="${id}"`), `missing alias #${id}`);
  }
});

test('exactly ten episodes render publicly', () => {
  assert.equal((home.match(/class="tx-row"/g) ?? []).length, 10);
});

test('there is no public episode archive', () => {
  assert.equal(existsSync(resolve(root, 'public/episodes.html')), false);
  for (const p of PUBLIC_PAGES) {
    assert.doesNotMatch(read(p), /href="\/episodes"/, `${p} links to the retired archive`);
  }
});

test('episodes 11 to 30 stay internal', () => {
  const data = JSON.parse(read('content/episodes.json'));
  for (const ep of data.filter((e) => !e.featured)) {
    assert.ok(!home.includes(ep.title), `homepage exposes held-back episode: ${ep.title}`);
    assert.ok(!home.includes(ep.description), `homepage exposes held-back summary: ${ep.number}`);
  }
});

test('no public page advertises a total of thirty', () => {
  for (const p of PUBLIC_PAGES) {
    assert.doesNotMatch(markup(read(p)), /\b30\b|thirty/i, `${p} advertises the full slate size`);
  }
});

test('the featured records are the ten that render', () => {
  const data = JSON.parse(read('content/episodes.json'));
  assert.equal(data.filter((e) => e.featured).length, 10);
  for (const ep of data.filter((e) => e.featured)) {
    assert.match(home, new RegExp(`>${ep.number}</div>`), `homepage missing ${ep.number}`);
    assert.ok(home.includes(ep.description), `homepage missing summary ${ep.number}`);
    assert.ok(home.includes(ep.question), `homepage missing question ${ep.number}`);
  }
});

test('no episode record carries a subtitle and none renders', () => {
  const data = JSON.parse(read('content/episodes.json'));
  for (const ep of data) assert.ok(!('subtitle' in ep), `episode ${ep.number} still has a subtitle`);
  for (const p of PUBLIC_PAGES) {
    assert.doesNotMatch(read(p), /tx-subtitle/, `${p} still renders subtitles`);
  }
  assert.doesNotMatch(home, /Drones, autonomy and the end of expensive war/);
  assert.doesNotMatch(home, /The return of energy abundance/);
});

test('no public-facing investigation terminology', () => {
  for (const p of PUBLIC_PAGES) {
    assert.doesNotMatch(read(p), /investigation/i, `${p} still says investigation`);
  }
});

test('the promotional CTAs are gone', () => {
  assert.doesNotMatch(home, /View all 30/);
  assert.doesNotMatch(home, /Read the full doctrine/);
  assert.doesNotMatch(home, /Explore the first investigations/);
});

test('planned episodes carry no published-state language', () => {
  for (const p of PUBLIC_PAGES) {
    const m = markup(read(p));
    assert.doesNotMatch(m, /listen now/i, `${p} implies published`);
    assert.doesNotMatch(m, /\bduration\b/i, `${p} implies published`);
  }
});

test('principles stay compact on the homepage and full on the dedicated page', () => {
  assert.equal((home.match(/class="doctrine-row"/g) ?? []).length, 10);
  assert.doesNotMatch(home, /doctrine-hard/, 'homepage should not carry the hard-part column');
  assert.equal((principles.match(/class="doctrine-row"/g) ?? []).length, 10);
  assert.equal((principles.match(/class="doctrine-hard"/g) ?? []).length, 10);
});

test('working integrations are untouched', () => {
  assert.match(home, /id="dispatch-form"/);
  assert.match(home, /fetch\('\/api\/subscribe'/);
  assert.match(home, /_vercel\/insights\/script\.js/);
  assert.match(home, /contact@opencivilization\.fm\?subject=Guest%20Suggestion/);
  for (const url of [
    'https://podcasts.apple.com/podcast/open-civilization',
    'https://open.spotify.com/show/opencivilization',
    'https://youtube.com/@opencivilization',
    'https://opencivilization.fm/rss',
    'https://x.com/mehdinayebi',
    'https://linkedin.com/in/mehdinayebi',
  ]) {
    assert.ok(home.includes(url), `missing ${url}`);
  }
});

// ── house rules ──────────────────────────────────────────────────────────────

test('no em dash appears in any public page or in episode data', () => {
  for (const p of [...PUBLIC_PAGES, 'public/sitemap.xml', 'content/episodes.json']) {
    assert.ok(!read(p).includes('—'), `${p} contains an em dash`);
  }
});

test('each public page has exactly one h1 and no skipped heading level', () => {
  for (const p of PUBLIC_PAGES) {
    const m = markup(read(p));
    assert.equal((m.match(/<h1[\s>]/g) ?? []).length, 1, `${p} h1 count`);
    const levels = [...m.matchAll(/<h([1-6])[\s>]/g)].map((x) => Number(x[1]));
    for (let i = 1; i < levels.length; i++) {
      assert.ok(levels[i] - levels[i - 1] <= 1, `${p} skips ${levels[i - 1]} to ${levels[i]}`);
    }
  }
});

test('no page has an empty or placeholder link', () => {
  for (const p of PUBLIC_PAGES) {
    assert.doesNotMatch(read(p), /href="#"/, `${p} has a placeholder link`);
    assert.doesNotMatch(read(p), /href=""/, `${p} has an empty link`);
  }
});

test('every in-page anchor resolves on its own page', () => {
  for (const p of PUBLIC_PAGES) {
    const html = read(p);
    const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
    for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(ids.has(target), `${p} links to missing #${target}`);
    }
  }
});
