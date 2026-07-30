# CLAUDE.md — Open Civilization

Project-scoped Claude instructions for `opencivilization.fm`. Read this at the start of every session before making changes.

---

## Project overview

**Open Civilization** is a podcast and public-intellectual project hosted by **Mehdi Nayebi**. The site is the show's public face — a pre-launch marketing surface, editorial statement, and subscriber funnel.

- **Live URL:** https://opencivilization.fm (also `www.opencivilization.fm`)
- **Contact:** contact@opencivilization.fm
- **Parent project:** Gravitas Society — an intellectual community fighting tribal epistemics.
- **Status:** Pre-launch. EP 01 is not recorded or published yet. Nothing is subscribable as audio; only the Dispatch newsletter collects real subscribers today.

**The tagline:** *How open societies endure, and how they decay.*

**The spine question:** *why can some societies still do hard things, and why do others forget how?* Every section of the homepage serves that question.

**The editorial frame is capability, not decline.** Failure episodes exist to explain why success is rare, not to form the spine. The published slate runs six capability stories to five failures, with wins in the first three.

**The name will never do discovery work.** A stranger scrolling learns nothing from "Open Civilization." That job falls entirely on episode titles and clips, which is why every episode title names a specific country and a specific fact. Never retitle an episode into an abstraction ("When Institutions Stop Working" is a category; "Why Britain Can't Build a Railway Anymore" is an argument someone will click).

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
| `display-md` | Featured ep title, principle numbers, colophon wordmark | 34px | 56px | 1.15 / 1.1 | -0.01em |
| `display-sm` | Hero tagline, upcoming episode titles, principle names | 28px | 34px | 1.2 | -0.005em |
| `body-lg` | Hero promise paragraphs, section ledes | 24px | 32px | 1.5 / 1.45 | 0 |
| `body-md` | Host bio, dispatch paragraph, footer links | 18px | 20px | 1.6 / 1.6 | 0 |
| `body-sm` | Principle glosses (mono), featured ep desc, upcoming ep desc | 16px | 17px | 1.65 / 1.6 | 0 |
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
- **No Roman numerals.** No `MMXXVI`, no `§ I` section markers. Removed in the rework, do not reintroduce.

### Kill list (removed in the rework — do not write these again)

These exact lines were cut, and so was the family of phrasing each one belongs to:

- "A compact statement of the principles beneath the project."
- "The show is not organized by sector. It is organized by relevance."
- "No marketing noise. Just signal."
- "a deeper map of the forces shaping the future of the free world"
- "His work sits at the intersection of geopolitics, institutions, technology, finance, power, and civilizational renewal."

The old umbrella sentence, *the forces shaping the future of the free world*, is retired everywhere: title, meta, OG tags, colophon tagline, episode lede. The tagline replaces it.

---

## The five principles (canonical)

The show's editorial position, cut from ten to five in the 2026 rework. These are fixed — do not rewrite the names or reorder without explicit approval. Both `public/index.html` (name + gloss) and `public/principles.html` (full statement) must list these in this order.

Read down the list: what you measure, what you need, what it costs, how you hold it, who does the work.

| # | Name | Gloss |
|---|------|-------|
| 01 | A country is what it *can build.* | Not what it declares. |
| 02 | A country that lies to itself *can't fix itself.* | Bad information is a tax on everything downstream. |
| 03 | Only strong countries can *afford to be open.* | Generosity is something you pay for. |
| 04 | Nobody can be trusted with *all of it.* | Courts, press, states, opposition: the point of dividing power is that no one has to be virtuous. |
| 05 | Countries get fixed by builders, *not commentators.* | (none — the closer runs as a single line) |

**There is no tag column anymore.** The five carry a name and a gloss, nothing else. Principle 05 has no gloss by design; its homepage row uses `.doctrine-row.solo`.

**The homepage and `/principles.html` must stay in lockstep on names, order, and glosses.** The full statement page adds one explanatory paragraph per principle; the homepage does not.

### What was dropped, and why (do not reinstate without asking)

- **Belonging / membership ("Universal values, national communities").** Cut at the host's call. It was the pillar most likely to get the show sorted into a tribe before anyone heard the argument.
- **Merit.** Folded into 01. Capacity is the observable result, merit is the mechanism, and only the observable one is worth stating. "Merit" is also heavily coded right now.
- **"Freedom as a discipline, not a mood."** Best line of the old set, worst pillar: it colors episodes rather than generating them. Keep it as recurring language in monologues, not as a principle.

Alternate for slot 04 if a more contrarian framing is ever wanted: *reform institutions, don't burn them*, which cuts against the tear-it-down instinct on both left and right.

---

## Homepage section order (fixed)

Four sections, down from six. The old page asked a stranger to read roughly 900 words of doctrine before reaching a single episode title, and almost nobody got there.

1. **Masthead** — brand + nav, sticky; nav hidden below 1000px
2. **Hero** — "Open / Civilization." + tagline + two-paragraph promise + primary CTA
3. **Doctrine** (`#doctrine`) — "Five principles." table (5 rows) + "Read the full statement" CTA
4. **Host** (`#host`) — "About the host." + huge "Mehdi / Nayebi" + 3-paragraph bio + contact links
5. **Episodes** (`#episodes`) — lede + featured EP 01 ("Coming soon" state) + 10 upcoming episodes, each with a description
6. **Dispatch** (`#dispatch`) — newsletter block, dark background, two lines of copy + form
7. **Footer** — 4-column colophon (brand / come on the show / navigate / contact) + copyright strip

**No Roman numerals anywhere.** The `§ I`, `§ II` section markers and the `MMXXVI` masthead date were removed in the rework — they were the loudest pomposity signal on the page. Section markers are now plain words (`Doctrine`, `Host`, `Episodes`) in the red mono label style. Do not reintroduce numerals or `§`.

### Sections that were removed (do not reinstate without asking)

- **Premise (`#question`).** Its work is now done by the hero.
- **Guests (`#guest`).** Folded into the footer as one line plus the contact email.
- **Listen (`#listen`).** Five platform rows pointing at listings that do not exist yet. Bring it back when EP 01 ships and the URLs resolve.
- **The episodes schedule note.** It claimed a full archive on all major platforms, which is not true pre-launch.

---

## Hero CTA state

**Pre-launch (current):** Single outlined primary CTA, `SEE THE EPISODES →`, anchors to `#episodes`. No secondary CTA. Nothing red-filled. It points at the episodes deliberately: the titles are what do the discovery work, so the fastest path to them is the point.

**Post-launch (when EP 01 ships):** Reintroduce a red-filled primary `LISTEN TO EP. 01 →` linking to the episode page. The TODO is marked in `public/index.html` above the `.hero-ctas` div AND in the `.hero-cta` CSS. Search for `TODO: when EP 01 ships` to find it.

---

## Episode slate (canonical)

Six capability stories to five failures, wins in the first three. That ratio is what makes the tagline honest rather than decorative. Every title names a specific country and a specific fact.

| Ep | Title | Tag | Hard thing | Principles |
|----|-------|-----|-----------|------------|
| 01 | I Built a Company in Iran. Here's What the State Did. | Iran · Capacity | Build a company under a hostile state | 4, 5 |
| 02 | South Korea Was Poorer Than Ghana | Korea · Capacity | Industrialise from nothing in one lifetime | 1 |
| 03 | France Built 56 Reactors in 15 Years | Energy · Capacity | Decarbonise a grid at scale | 1 |
| 04 | Poland Went From Warsaw Pact to Building Again | Poland · Renewal | Rebuild a country and rearm it | 5, 3 |
| 05 | Argentina Was Richer Than France. What Happened? | Decline · Institutions | Stay rich | 2 |
| 06 | Why Britain Can't Build a Railway Anymore | Britain · Capacity | Lay track | 1, cost of 4 |
| 07 | How a Country Learns to Lie to Itself | Truth · Power | Keep an accurate picture of reality | 2 |
| 08 | Ukraine Gave Up Its Nuclear Weapons in 1994 | Strength · Security | Defend yourself | 3 |
| 09 | Norway Turned Oil Into a Sovereign Fund. Nigeria Didn't. | Resources · Governance | Turn a windfall into an endowment | 4, 1 |
| 10 | Who Actually Controls the Chips | AI · Compute | Manufacture at the frontier | 1, 3 |
| 11 | Singapore Houses 80% of Its People. Why Can't Anyone Copy It? | Housing · Capacity | House your own population | 1 |

**Keep episodes 03, 06 and 11 — they put the show's own principles in tension.** 03 and 06 are the same argument from both sides: dispersed power protects you from tyranny and can also leave you unable to build. 11 is a state that houses everyone and therefore holds a lot of power over them. A show where the doctrine wins every week is a sermon, and listeners can smell it by episode four. Naming the price of your own position is what earns the rest of the argument.

**Cut, with reasons:** the standalone China episode (absorbed into 10, where it is concrete rather than thematic); the sanctions episode (it was about how open societies act outward rather than what they can do at home, it duplicated Episode 01, and putting the host on the receiving end twice reads as grievance rather than analysis). If sanctions is ever revived, the angle is sanctions as a capability test: can open societies still make their main non-military instrument work?

**Uncovered hero promise:** the hero names four tests — railway, clean election, housing, disease. The slate delivers railway (06) and housing (11). For the disease test, the candidate is *Smallpox Is Gone. Nothing Like It Has Happened Since.*

---

## Animations

Three systems, all in `public/index.html`:

1. **Hero rise-in** — `@keyframes riseIn` on `.hero-title .line`, `.hero-tagline`, `.hero-promise` (x2), `.hero-ctas`. Runs once on page load, staggered 0.1s → 0.25s → 0.4s → 0.55s → 0.7s → 0.85s.
2. **Status dot pulse** — `@keyframes pulse` on `.status-dot`. Red glow expansion, 2.2s infinite. Currently defined but unused: no element on the page carries `.status-dot`. Kept for the launch-state indicator.
3. **Scroll reveal** — IntersectionObserver adds `.is-visible` to every `.reveal` section. Observer settings: `threshold: 0`, `rootMargin: '0px 0px 20% 0px'` (triggers 20% BEFORE the section hits the viewport). Transition: 0.5s, translateY 14px → 0. Critical: the rootMargin must have a positive bottom value so reveals fire preemptively, not laggy.
4. **Doctrine stagger** — When `.doctrine-table` enters viewport, 5 rows fade in at 70ms intervals. Same IntersectionObserver settings.
5. **Masthead shrink** — Scroll listener + rAF. When `scrollY > hero bottom - 100px`, adds `.is-scrolled` to `.masthead-bar`. Tightens padding, border, font-size.

**All animations respect `@media (prefers-reduced-motion: reduce)`:**
- Reveals render at full opacity immediately (no transition).
- Doctrine stagger disabled.
- Masthead transition disabled.
- `riseIn` and `pulse` disabled, with every affected element forced to `opacity: 1`. This matters: each `riseIn` element starts at `opacity: 0`, so if a browser suppresses animations without that guard the whole hero renders blank. Any new element you attach `riseIn` to must be added to that guard list.

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

0. **Nothing is recorded.** This is the only item that matters. The concept has been in development since early 2025 with zero published episodes. Renaming, restructuring and retitling cost rework right now rather than audience, which will never be true again after launch. One published episode will say more about whether the frame lands than another month of refining it.
1. **Episode pages don't exist.** Featured EP 01 and upcoming rows are not clickable (no `href`).
2. **Platform links are gone, not fixed.** The Listen section was removed in the rework because none of the Apple/Spotify/YouTube URLs resolved. Rebuild it when the listings are real.
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
- Lean on: builder across cultures, someone who ran a real company against a hostile state.
- Do NOT frame him as an "Iranian entrepreneur." He is French and Canadian. Iran is a subject of his work, not his nationality.
- Closed-society credibility is the unique asset, and the line that carries it is: *he has seen what it looks like when a state works against the people trying to build.* That is the whole reason someone should listen to him rather than to a professor. Keep it in the bio.
- **No six-noun intersections.** "His work sits at the intersection of geopolitics, institutions, technology, finance, power, and civilizational renewal" was cut in the rework. Lists of abstract nouns are how people signal seriousness when they haven't said anything yet.

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

# 4. Five principles present on homepage, eleven episodes in the slate
grep -c 'class="doctrine-row' public/index.html   # expect 5
grep -c 'class="tx-row"' public/index.html        # expect 10 (EP 02-11; EP 01 is .tx-featured)

# 4b. No Roman numerals in rendered copy
grep -n 'MMXXVI\|§' public/index.html public/principles.html  # expect empty

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
