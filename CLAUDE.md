# CLAUDE.md — Open Civilization

Project-scoped Claude instructions for `opencivilization.fm`. Read this at the start of every session before making changes.

---

## Project overview

**Open Civilization** is a podcast and public-intellectual project hosted by **Mehdi Nayebi**. The site is the show's public face — a pre-launch marketing surface, editorial statement, and subscriber funnel.

- **Live URL:** https://opencivilization.fm (also `www.opencivilization.fm`)
- **Contact:** contact@opencivilization.fm
- **Parent project:** Gravitas Society — an intellectual community fighting tribal epistemics.
- **Status:** Pre-launch. EP 01 is not recorded or published yet. Nothing is subscribable as audio; only the Dispatch newsletter collects real subscribers today.

**The organizing line of the site:** *the forces shaping the future of the free world.* Every section of the homepage serves that umbrella sentence.

**Tagline:** *How open societies endure, and how they decay.* Rejected alternatives are recorded at the end of this file.

---

## Tech stack (what this is and isn't)

This is **NOT** a Next.js / Tailwind project. Prior prompts and drafts sometimes assume it is. It isn't.

| Layer | Choice |
|-------|--------|
| Markup | Static HTML. `public/index.html` (the site), plus internal tools: `public/admin.html`, `public/framing-engine.html`, `public/guest-desk.html` |
| Styling | Inline `<style>` block in each HTML file. No external CSS. No framework. |
| JavaScript | Vanilla JS at the bottom of each HTML file. No framework. No build step. |
| Hosting | Vercel. **Git auto-deploy is broken, see Deploy below. Every deploy is manual.** |
| Serverless API | Vercel Functions in `api/` — `subscribe.js`, `subscribers.js`, `schema.sql` |
| Database | Neon Postgres via `@neondatabase/serverless` (HTTP driver) |
| Analytics | Vercel Web Analytics (script in HTML head, data in Vercel dashboard) |
| Redirects | `vercel.json` 301s `/principles.html` and `/principles` to `/#doctrine` |
| Search | Google Search Console (domain-verified via DNS TXT) |
| Fonts | Google Fonts — Fraunces (variable serif) + IBM Plex Mono |
| Favicon | Path-based SVG monogram, generated via `sharp` + `png-to-ico` from `scripts/generate-favicons.mjs` |
| Dev server | `vercel dev --listen 3000` (serves static + API functions locally) |
| Node version | 24.x |

A future Next.js migration is deferred until EP 01 is real. Do not migrate preemptively.

### Repo layout

```
open-civilization-site/
├── public/
│   ├── index.html         ← homepage, all CSS + JS inline
│   ├── admin.html         ← token-protected subscriber viewer
│   ├── favicon.ico / icon.svg / icon.png / apple-touch-icon.png
├── api/
│   ├── subscribe.js       ← POST /api/subscribe (adds email to Neon)
│   ├── subscribers.js     ← GET /api/subscribers (admin-only, token auth)
│   └── schema.sql         ← Neon table reference
├── app/                   ← reserved for Next.js migration; currently holds favicon source files only
├── scripts/
│   └── generate-favicons.mjs
├── vercel.json            ← outputDirectory: "public", /api/(.*) rewrite
├── package.json
├── .env                   ← local dev only, gitignored, contains DATABASE_URL + ADMIN_TOKEN
├── .env.example
├── PRODUCT_OVERVIEW.md    ← comprehensive reference document
└── CLAUDE.md              ← this file
```

---

## Environment variables

| Variable | Where set | Purpose |
|----------|-----------|---------|
| `DATABASE_URL` | Vercel (production) + local `.env` | Neon Postgres connection string |
| `ADMIN_TOKEN` | Vercel (production) + local `.env` | Password for `/admin.html` subscriber viewer |

Never commit `.env`. Never echo secrets in chat unless explicitly requested. Both are in `.gitignore`.

---

## Design system — single source of truth

### Color palette

Defined as CSS custom properties at `:root` in `public/index.html`:

| Token | Hex | Usage |
|-------|-----|-------|
| `--paper` | `#f1ede3` | Page background (ivory/cream) |
| `--paper-2` | `#e9e4d5` | Hover states, cards, featured blocks |
| `--ink` | `#0e0e0e` | Primary text, borders, rules |
| `--ink-2` | `#1c1c1a` | Body text, secondary content |
| `--muted` | `#6e6a5e` | Labels, tags, subtle UI text |
| `--muted-2` | `#a8a394` | Dividers, status dots, faint accents |
| `--red` | `#b22a1f` | Primary accent — section numbers, hover, emphasis |
| `--red-ink` | `#7a1a12` | Hover state for red elements, italic emphasis |
| `--rule` | `#0e0e0e` | Border/rule color (alias of ink) |

**Do not introduce new colors without a good reason.** The palette is deliberate.

### Fonts

```css
--serif: 'Fraunces', 'Times New Roman', Georgia, serif;
--mono:  'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
```

- **Fraunces** is used for all display and editorial text: hero wordmark, section titles, principle names, episode titles, body paragraphs set in serif.
- **IBM Plex Mono** is used for all UI text: labels, tags, buttons, host bio, dispatch body, footer, form inputs.
- Body paragraphs can be **either serif (editorial voice) or mono (utility/card)** — see type scale table below.
- Google Fonts preconnect hints are in the `<head>`.

### Fraunces variation axes — READABILITY RULES

Fraunces is variable along `SOFT` (0–100), `WONK` (0–1), and `opsz` (9–144).

- **Display elements** (hero title, section titles, host name, dispatch headline, episode titles, principle numbers, pitch card title, colophon wordmark) use `"SOFT" 0, "WONK" 1, "opsz" 144` — the decorative display cut.
- **Body-lg paragraphs** (hero promise, premise, doctrine lede, episodes lede, guest lede) use `"SOFT" 100, "WONK" 0, "opsz" 32` — the body-readable cut. This is critical. WONK 1 at body size is hard to read. Do not use display axes on long paragraphs.

### Type scale (9 tokens, mobile-first)

**All font-size / line-height / letter-spacing values are defined as CSS custom properties at `:root` in `public/index.html` and overridden in `@media (min-width: 768px)`.** Nothing else. Every text element consumes a token via `var(--*-size)` etc.

| Token | Role | Mobile | Desktop (≥768px) | Line-height | Letter-spacing |
|-------|------|--------|------------------|-------------|----------------|
| `display-xl` | Hero wordmark ONLY | 60px | 144px | 0.95 / 0.92 | -0.02em |
| `display-lg` | Section titles, host name, dispatch headline | 44px | 80px | 1.05 / 1.0 | -0.015em |
| `display-md` | Featured ep title, pitch card title, principle numbers, colophon wordmark | 34px | 56px | 1.15 / 1.1 | -0.01em |
| `display-sm` | Upcoming episode titles, principle names, platform names | 28px | 34px | 1.2 | -0.005em |
| `body-lg` | Hero promise, premise, ledes, guest lede | 24px | 32px | 1.5 / 1.45 | 0 |
| `body-md` | Host bio, dispatch paragraph, pitch body, footer links | 18px | 20px | 1.6 / 1.6 | 0 |
| `body-sm` | Principle glosses (mono), featured ep desc, platform URL | 16px | 17px | 1.65 / 1.6 | 0 |
| `label` | Section markers, tags, captions, masthead, all CTAs | 13px | 14px | 1.4 | 0.08em uppercase |
| `micro` | Footer legal, schedule block | 13px | 14px | 1.5 | 0.02em |

**Rules:**

1. **No ad-hoc font sizes in the CSS.** Every text rule must consume `var(--*-size)`. If you find a hardcoded `font-size: 18px` on a rendered element, replace it.
2. **Line-heights and letter-spacing are locked to the token.** Don't override per-component.
3. **`display-xl` is reserved for the hero wordmark "Open Civilization." only.** Nothing else on the page hits that size.
4. **Italic secondary words** (the "`Ten <em>principles.</em>`" pattern) are mandatory. Every display/serif title uses `<em>` for its second word.
5. **Mobile cap:** `display-xl` at 60px mobile fits "Civilization." on all iPhones ≥375px. On 320px iPhone SE it will be snug but acceptable.

### Mobile overflow — the trap in this layout

The page is full of fixed-px grid columns and long unbreakable strings (email addresses, URLs). A plain `1fr` track **cannot shrink below its content's min-content width**, so one long token silently pushes a section wider than the viewport. `body { overflow-x: hidden }` hides the symptom, which is why two of these survived unnoticed until 2026-07-31.

Rules when touching any grid:

- Use `minmax(0, 1fr)` rather than `1fr` wherever a track holds an email, a URL, or a fixed-px sibling column.
- Long unbreakable strings need `overflow-wrap: anywhere` (or `word-break: break-all`) as a safety net.
- Any grid with a fixed-px column (`180px 1fr`, `80px 1fr …`) **must** have a mobile rule that stacks it. `.tx-note` had none and squeezed its text into a 78px ribbon on every phone.
- Test at **320px**, not just 375px. Several issues only appear on iPhone SE width.

Check with:

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
```

### Vertical rhythm

- Section padding: `70px 24px` mobile / `90px 40px` desktop (default `.section` rule).
- Section head to content: `mb-44` mobile / `mb-60` desktop.
- Principle rows: `padding: 30px 0 28px` desktop; `padding: 28px 0 26px` mobile. No margin between rows — the hairline divider carries the separation.

### Paper grain overlay

`body::before` paints a fractal noise SVG at 0.35 opacity with `mix-blend-mode: multiply`. It's applied via inline SVG data URI — no network request, no asset. Do not remove.

### Favicon

Path-based "OC" monogram — cream `#F5F1E8` on near-black `#0A0A0A`, classical serif letterforms, tightly kerned. Source of truth is `scripts/generate-favicons.mjs`. To regenerate:

```bash
node scripts/generate-favicons.mjs
```

Files live in both `app/` (for future Next.js migration) and `public/` (for current static site). Both copies must be kept in sync.

---

## Copy rules (editorial voice)

- **No em-dashes** (`—`) in rendered copy. Hyphens, commas, or sentence splits instead. The only allowed em-dashes are in CSS/HTML comments (section dividers) where users never see them. This is enforced by grep in verification.
- **No "long-form podcast."** Just "a show" or "a podcast."
- **No startup clichés**, no generic mission-statement abstractions, no dramatic apocalypse tone.
- **No hype, no exclamation points, no "in today's world."** Confidence comes from precision, not volume.
- **Intelligent, serious, precise, elegant.** Written for a curious, skeptical, time-pressed reader.
- **Anti-tribal.** Never adopt left-coded or right-coded vocabulary. If a sentence could appear in a partisan outlet on either side, rewrite it.
- **Voice test:** would this sentence appear in *Foreign Affairs* or *Noema*? If not, rewrite.
- **No emojis** in any production copy. Emojis are fine in dev notes and commit messages.
- **Preserve the italic secondary-word pattern** in every display title.
- **No Roman numerals** anywhere in rendered copy: not in section markers, not as a masthead date, not in the copyright line.
- **No six-noun intersections.** Lists of abstract nouns ("geopolitics, institutions, technology, finance, power, and civilizational renewal") are how people signal seriousness when they haven't said anything yet. Removed 2026-07-31; don't write them back.

---

## The ten principles (canonical)

The show's editorial position, and the only place it now lives (the standalone full-statement page was deleted). These are fixed — do not rewrite the names or reorder without explicit approval.

| # | Name | Hard part (the tension) |
|---|------|--------------------------|
| 01 | Rare, *not default.* | Most people alive have never lived in one. |
| 02 | Dispersed *power.* | The same checks that stop tyranny can stop you building. |
| 03 | Liberty as *foundation.* | Cheaper to erode now than it was to win. |
| 04 | Revisable *belief.* | Knowledge institutions run by people with an interest in the answer. |
| 05 | Moral *universalism.* | Universal claims have justified a great deal. |
| 06 | Markets *with rules.* | Rule-makers are outspent by the regulated. |
| 07 | Reform institutions, *don't destroy them.* | Reform is slower than decay. |
| 08 | Universal values, *national communities.* | Little that decides a country's future is decided inside it. |
| 09 | Tolerance that *defends itself.* | Someone decides which is which, and can be wrong. |
| 10 | Historically *conscious.* | History is a poor guide to a situation with no precedent. |

### Structure of the doctrine table (reworked 2026-07-31)

Each row is now **number · name · one-sentence body · tension line**, under a `PRINCIPLE` / `THE HARD PART` column header. The section reads as ten arguments rather than ten declarations, and dropped from roughly 600 words to 300.

- **The old right-hand keyword column is gone** (EXCEPTION, CHECKS, FREEDOM, INQUIRY, UNIVERSAL, MARKETS, INSTITUTIONS, NATIONS, DEFENSE, HISTORY). Do not reinstate it.
- `.doctrine-hard` is the tension line: mono, `--body-sm`, italic, `--red-ink`. Red is not decorative — on mobile the column header is hidden, so **colour alone carries the distinction**. Never render the hard part in ink.
- Grid is `72px 1.2fr 2fr 1.4fr` on `.doctrine-row` **and** `.doctrine-head`. If you change one, change both or the header labels stop aligning with their columns.
- Bodies are one sentence. Row padding (`20px 0 18px`) is sized for that. If a body grows back to a paragraph, the padding is wrong.
- Mobile stacks to number + title, then the sentence, then the hard part indented 16px. The header row is `display: none`.

---

## Homepage section order (fixed)

1. **Masthead** — brand + nav, sticky; nav hidden below 1000px
2. **Hero** — "Open / Civilization." + single serif paragraph + primary CTA
3. **Premise** (`#question`) — thesis paragraph
4. **Doctrine** (`#doctrine`) — "Ten principles." + `PRINCIPLE` / `THE HARD PART` header + 10 rows
5. **Host** (`#host`) — "About the host." + huge "Mehdi / Nayebi" + 3-paragraph bio + contact links
6. **Episodes** (`#episodes`) — lede + featured EP 01 ("Coming soon") + 9 upcoming + schedule note
7. **Guests** (`#guest`) — "Come on the show." + lede + pitch card (sticky on desktop)
8. **Listen** (`#listen`) — "Listen anywhere." + 5 platform rows
9. **Dispatch** (`#dispatch`) — monthly newsletter, dark background + form
10. **Footer** — 4-column colophon + copyright strip

Do not reorder sections.

**No Roman numerals, no `§`.** Section markers are plain uppercase mono words: `PREMISE`, `DOCTRINE`, `HOST`, `EPISODES`, `GUESTS`, `LISTEN`, `DISPATCH`. The `§ I` / `§ II` notation and the `MMXXVI` masthead date were removed on 2026-07-31 and must not come back. The same applies to the footer copyright, which uses a plain year.

---

## Hero CTA state

**Pre-launch (current):** Single outlined primary CTA, `READ THE PREMISE →`, anchors to `#question`. No secondary CTA. Nothing red-filled.

**Post-launch (when EP 01 ships):** Reintroduce a red-filled primary `LISTEN TO EP. 01 →` linking to the episode page. The TODO is marked in `public/index.html` above the `.hero-ctas` div AND in the `.hero-cta` CSS. Search for `TODO: when EP 01 ships` to find it.

---

## Animations

Three systems, all in `public/index.html`:

1. **Hero rise-in** — `@keyframes riseIn` on `.hero-title .line`, `.hero-promise`, `.hero-ctas`. Runs once on page load, staggered 0.1s → 0.25s → 0.45s → 0.6s.
2. **Status dot pulse** — `@keyframes pulse` on `.status-dot`. Red glow expansion, 2.2s infinite.
3. **Scroll reveal** — IntersectionObserver adds `.is-visible` to every `.reveal` section. Observer settings: `threshold: 0`, `rootMargin: '0px 0px 20% 0px'` (triggers 20% BEFORE the section hits the viewport). Transition: 0.5s, translateY 14px → 0. Critical: the rootMargin must have a positive bottom value so reveals fire preemptively, not laggy.
4. **Doctrine stagger** — When `.doctrine-table` enters viewport, 10 rows fade in at 50ms intervals. Same IntersectionObserver settings.
5. **Masthead shrink** — Scroll listener + rAF. When `scrollY > hero bottom - 100px`, adds `.is-scrolled` to `.masthead-bar`. Tightens padding, border, font-size.

**All animations respect `@media (prefers-reduced-motion: reduce)`:**
- Reveals render at full opacity immediately (no transition).
- Doctrine stagger disabled.
- Masthead transition disabled.
- `riseIn` and `pulse` keyframes currently NOT explicitly disabled under reduced-motion (known gap).

**Do not introduce new animations without a clear editorial reason.** The site uses motion sparingly and deliberately.

---

## Git workflow

### Branches

- `master` — production source of truth. **Pushing does not deploy, see Deploy below.**
- `vN-edits` — iterative design phases (v2, v3, v4, v5, ...). Create as needed for major passes.

### Tags

- `v1` through `v5` mark historical milestones. New tags only at meaningful rollups.

### Commits

- **Conventional Commits style:** `feat(hero): ...`, `fix(mobile): ...`, `refactor(doctrine): ...`, `style(copy): ...`, `chore: ...`, `docs: ...`.
- **One logical change per commit.** Big passes (e.g., v5, type scale overhaul) get multiple commits committed in sequence.
- **Co-author attribution:** `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`
- **Never push to master with `--force`.** Never skip hooks (`--no-verify`) unless the user explicitly asks.
- **Never commit `.env`** or anything with secrets.

### Deploy

**Git auto-deploy is broken. Pushing to `master` does NOT update the live site.**

Discovered 2026-07-30. The last deployment triggered by a GitHub push was commit `4ada121` on **2026-04-16**; every push after that produced no deployment, no commit status, and no GitHub deployment record. Production silently kept serving the April build.

Until the integration is repaired, **every deploy is manual**:

```bash
vercel deploy --prod
```

- Takes ~10 seconds. The push to `master` still matters (it is the source of truth), it just does not deploy.
- **Always verify the live site after deploying.** `curl -s "https://opencivilization.fm/?cb=$RANDOM" | grep <something-new>`. The CDN serves `x-vercel-cache: HIT` from the previous build until the new deployment replaces it, so "the push succeeded" is not evidence that anything shipped.
- To repair the integration: Vercel dashboard → Project → Settings → Git → reconnect the GitHub repository. This is a dashboard action and needs the account owner. Once reconnected, verify with a trivial commit before trusting it again, and update this section.
- If Vercel Analytics is ever re-enabled, a fresh deploy is also required so `/_vercel/insights/script.js` is injected. The existing deploy won't retroactively serve it.

---

## What to do without being asked

- **After any non-trivial edit, verify the file is syntactically sound** (grep for common errors, check line counts, or read back the modified region).
- **Before committing, run `git status` and `git diff`** so the user sees exactly what's changing.
- **Use CSS custom property tokens** for every new text element. Never introduce a hardcoded size.
- **Preserve the italic secondary-word pattern** in any new display text.
- **Check for em-dashes in any new copy** and replace with commas/periods before shipping.

## What NOT to do without explicit approval

- Do not modify `package.json` dependencies (proposing them is fine; installing them needs permission).
- Do not touch `.env*` files or anything containing secrets.
- Do not change Vercel project settings, domain configuration, or DNS records.
- Do not push to `master` until the user confirms.
- Do not introduce Tailwind, Next.js, React, or any framework while this is still a static HTML site.
- Do not delete files outside `/public`, `/api`, `/app`, or `/scripts`.
- Do not generate Lorem ipsum copy in production files. Use real or clearly-marked draft copy.
- Do not touch `admin.html`, `framing-engine.html`, `guest-desk.html`, or any section the user didn't mention when working on homepage-only asks. Scope matters.

---

## Serverless API contracts

### `POST /api/subscribe`

```
Request:  { "email": "user@example.com" }
Success:  200 { "ok": true }
Error:    400 { "ok": false, "error": "Invalid email address" }
          500 { "ok": false, "error": "Server error. Please try again." }
```

- Validates email via loose regex.
- `INSERT ... ON CONFLICT (email) DO NOTHING` — duplicates are silently ignored and return success.

### `GET /api/subscribers`

```
Headers:  Authorization: Bearer {ADMIN_TOKEN}
Success:  200 { "ok": true, "count": N, "subscribers": [{ id, email, created_at }] }
Error:    401 { "error": "Unauthorized" }
          500 { "error": "Server error" }
```

### Database schema

```sql
CREATE TABLE IF NOT EXISTS subscribers (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

Hosted on Neon (`open-civilization` project, AWS US East 1).

---

## Analytics & SEO

- **Vercel Web Analytics** — script tag in `<head>` of `index.html`. Must be enabled in the Vercel dashboard (Project → Analytics → Enable). Script won't fire until enabled AND the project is redeployed after enabling.
- **Google Search Console** — domain-verified via DNS TXT record on `opencivilization.fm`. Processing takes 24-72 hours after verification.
- **Meta tags** — `<title>`, `<meta name="description">`, and Open Graph / Twitter Card tags are set in `<head>` of `index.html`. Keep aligned with the umbrella sentence.

---

## Known gaps / TODOs

**0. The two open content decisions (raised 2026-07-31, not yet actioned):**

- **The ten episode titles are stale.** They predate the season work and no longer match the intended slate. They are abstract categories ("When Institutions Stop Working") where they should be a specific country plus a specific fact ("Why Britain Can't Build a Railway Anymore"). The show's name does no discovery work, so episode titles carry that entire job.
- **The schedule note promises "New episodes every week. Full archive available on all major podcast platforms."** Both halves are false pre-launch: nothing is recorded and there is no archive. It sits in `.tx-note` at the bottom of the Episodes section. The Dispatch newsletter was changed to monthly on 2026-07-31, so a weekly episode promise is also now inconsistent with it.

1. **Episode pages don't exist.** Featured EP 01 and upcoming rows are not clickable (no `href`).
2. **Platform links are placeholders.** Apple Podcasts, Spotify, YouTube URLs don't resolve to real listings yet. The Listen section presents them as live.
3. **RSS feed.** `/rss` is a placeholder; no actual feed is generated.
4. **Hero `riseIn` and status-dot `pulse`** are not explicitly disabled under `prefers-reduced-motion`. Scroll-triggered animations and masthead shrink are properly guarded.
5. **`/principles.html` no longer exists.** It was deleted on 2026-07-31 and `vercel.json` 301-redirects both `/principles.html` and `/principles` to `/#doctrine`. Keep the redirect: the URL was live and indexed in Google Search Console.
6. **`admin.html` same as above** — separate styles, not token-driven.
7. **Post-launch CTA swap.** When EP 01 ships, swap the hero primary to a red-filled `LISTEN TO EP. 01 →`. Search for `TODO: when EP 01 ships` in `public/index.html`.
8. **Next.js migration** is deferred until EP 01 is real. When it happens, port the type scale, color palette, and component patterns from this document verbatim.

---

## Host context (for bio copy)

Mehdi Nayebi — French national, Canadian permanent resident, host of Open Civilization. Founder/CEO of LifeShield Technologies, founder of Gravitas Society, co-founder of Alopeyk (one of Iran's largest tech platforms). Background spans investment banking at Deutsche Bank and Bank of America (London), on-demand logistics in Iran, and health tech in North America. Currently in Toronto, relocating to Miami end of 2026.

**Framing guidance for bio/host copy:**
- Lean on: convener, builder across cultures, concerned with how free societies sustain themselves.
- Do NOT frame him as an "Iranian entrepreneur." He is French and Canadian. Iran is a subject of his work, not his nationality.
- Closed-society credibility is the unique asset: he built inside a sanctioned authoritarian system and left Iran for safety reasons. That perspective is non-reproducible by hosts who've never lived inside one.
- Work sits at the intersection of geopolitics, institutions, technology, finance, power, and civilizational renewal.

---

## Verification checklist (run after any non-trivial change)

```bash
# 1. Structural integrity
grep -c '<!DOCTYPE html>' public/index.html       # expect 1
grep -c '</html>' public/index.html               # expect 1

# 2. No em-dashes in rendered copy (comments-only allowed)
grep -n '—' public/index.html | grep -v '/\*\|<!--'  # expect empty

# 3. Every font-size consumes a token (body default is the only hardcoded exception)
grep 'font-size:\s*[0-9]' public/index.html | grep -v 'body\|var('  # expect empty

# 4. Ten principles present, each with a tension line
grep -c 'class="doctrine-row"' public/index.html   # expect 10
grep -c 'class="doctrine-hard"' public/index.html  # expect 10
grep -c 'class="doctrine-tag"' public/index.html   # expect 0 (old keyword column)

# 4b. No Roman numerals or section signs in rendered copy
grep -c '§\|MMXXVI' public/index.html              # expect 0

# 5. Analytics script present
grep -q '/_vercel/insights/script.js' public/index.html && echo "analytics: OK"

# 6. Dev server responds
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000
```

## Live API smoke tests

```bash
# Subscribe endpoint (production)
curl -s -X POST https://opencivilization.fm/api/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoketest@example.com"}'
# → {"ok":true}

# Subscriber list (requires ADMIN_TOKEN)
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://opencivilization.fm/api/subscribers | jq '.count'

# Analytics script endpoint
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  https://opencivilization.fm/_vercel/insights/script.js
# → 200 (404 means Analytics disabled or needs redeploy)
```

---

## When in doubt

1. Re-read this file.
2. Re-read `PRODUCT_OVERVIEW.md` for the full architectural reference.
3. Ask the user before making architectural changes.
4. Prefer smaller, reversible changes over big rewrites.
5. The visual language is premium, restrained, editorial, and intentional. **If a change would make the site busier, noisier, or more "startup-y", do not ship it.**

---

## Rejected in review (recorded so they are not reintroduced)

Proposed in the 2026-07-30 rework, built, then reverted at the host's direction on 2026-07-31. The work is preserved in git at commit `f300454` and can be restored with `git revert --no-commit 4e9b3ce` if any of it is revisited.

- Renaming the show. **Open Civilization stays.**
- Replacing the tagline. **"How open societies endure, and how they decay" stays.**
- Cutting the ten principles to five.
- Renaming the doctrine section to "assumptions".
- Linking each principle to the episode that tests it.
- Reducing six sections to four (deleting Premise, Guests, Listen).
- A second email capture beneath the hero.
- A host attribution line in the hero.

Do not re-propose these as improvements. They were considered and declined.
