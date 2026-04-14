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

---

## Tech stack (what this is and isn't)

This is **NOT** a Next.js / Tailwind project. Prior prompts and drafts sometimes assume it is. It isn't.

| Layer | Choice |
|-------|--------|
| Markup | Static HTML. Three files only: `public/index.html`, `public/principles.html`, `public/admin.html` |
| Styling | Inline `<style>` block in each HTML file. No external CSS. No framework. |
| JavaScript | Vanilla JS at the bottom of each HTML file. No framework. No build step. |
| Hosting | Vercel (auto-deploys from `master` branch on GitHub) |
| Serverless API | Vercel Functions in `api/` — `subscribe.js`, `subscribers.js`, `schema.sql` |
| Database | Neon Postgres via `@neondatabase/serverless` (HTTP driver) |
| Analytics | Vercel Web Analytics (script in HTML head, data in Vercel dashboard) |
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
│   ├── principles.html    ← full editorial statement, independent styles
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

---

## The ten principles (canonical)

The show's editorial position. These are fixed — do not rewrite the names or reorder without explicit approval. Both `public/index.html` (compressed glosses) and `public/principles.html` (full statement) must list these in this order.

| # | Name | Tag |
|---|------|-----|
| 01 | Rare, *not default.* | Exception |
| 02 | Dispersed *power.* | Checks |
| 03 | Liberty as *foundation.* | Freedom |
| 04 | Revisable *belief.* | Inquiry |
| 05 | Moral *universalism.* | Universal |
| 06 | Markets *with rules.* | Markets |
| 07 | Institutions *over iconoclasm.* | Institutions |
| 08 | Cosmopolitan, *particular.* | Nations |
| 09 | Tolerance that *defends itself.* | Defense |
| 10 | Historically *conscious.* | History |

**The homepage and `/principles.html` must stay in lockstep on names, order, and tags.** Body text can differ (short form vs long form) but conceptually they must agree.

---

## Homepage section order (fixed)

1. **Masthead** — brand + year strip, sticky; nav hidden on mobile
2. **Hero** — "Open / Civilization." + single serif paragraph + primary CTA
3. **§ I / Premise** — thesis paragraph
4. **§ II / Doctrine** — "Ten principles." table (10 rows) + "Read the full statement" CTA
5. **§ III / Host** — "About the host." + huge "Mehdi / Nayebi" + bio + contact links
6. **§ IV / Episodes** — intro lede + featured EP 01 (marked UPCOMING with "Coming soon" state indicator) + 9 upcoming episodes + schedule note
7. **§ V / Guests** — "Come on the show." + lede + pitch card (sticky)
8. **§ VI / Listen** — "Listen anywhere." + 5 platform rows
9. **§ VII / Dispatch** — newsletter section (dark background) + form
10. **Footer** — 4-column colophon + copyright strip

Section numbers and labels are part of the editorial grammar. Do not reorder or renumber.

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

- `master` — production. Vercel auto-deploys on push.
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

- Push to `master` → Vercel auto-deploys in ~8-15 seconds.
- If Vercel Analytics was just enabled, **manually trigger a new deploy** (`vercel deploy --prod`) so the `/_vercel/insights/script.js` endpoint gets injected. The existing deploy won't retroactively serve it.

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
- Do not touch `principles.html`, `admin.html`, or any section the user didn't mention when working on homepage-only asks. Scope matters.

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

- **Vercel Web Analytics** — script tag in `<head>` of `index.html` and `principles.html`. Must be enabled in the Vercel dashboard (Project → Analytics → Enable). Script won't fire until enabled AND the project is redeployed after enabling.
- **Google Search Console** — domain-verified via DNS TXT record on `opencivilization.fm`. Processing takes 24-72 hours after verification.
- **Meta tags** — `<title>`, `<meta name="description">`, and Open Graph / Twitter Card tags are set in `<head>` of `index.html`. Keep aligned with the umbrella sentence.

---

## Known gaps / TODOs

1. **Episode pages don't exist.** Featured EP 01 and upcoming rows are not clickable (no `href`).
2. **Platform links are placeholders.** Apple Podcasts, Spotify, YouTube URLs don't resolve to real listings yet.
3. **RSS feed.** `/rss` is a placeholder; no actual feed is generated.
4. **Hero `riseIn` and status-dot `pulse`** are not explicitly disabled under `prefers-reduced-motion`. Scroll-triggered animations and masthead shrink are properly guarded.
5. **`principles.html` uses its own inline `<style>` block** and does not consume the homepage's 9-token type scale. If consistency matters, the same tokens should be ported there (or both files should share a stylesheet).
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

# 4. Ten principles present on homepage
grep -c 'class="doctrine-row"' public/index.html  # expect 10

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
