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
| Markup | Static HTML. Public page: `index.html`. Retained but unpromoted: `principles.html`. Internal tools: `admin.html`, `framing-engine.html`, `guest-desk.html` |
| Styling | Inline `<style>` block in each HTML file. No external CSS. No framework. |
| JavaScript | Vanilla JS at the bottom of each HTML file. No framework. No build step. |
| Hosting | Vercel, auto-deploying from `master` via the Vercel GitHub App (reconnected 2026-07-31, see Deploy) |
| Serverless API | Vercel Functions in `api/` — `subscribe.js`, `subscribers.js`, `schema.sql` |
| Database | Neon Postgres via `@neondatabase/serverless` (HTTP driver) |
| Analytics | Vercel Web Analytics (script in HTML head, data in Vercel dashboard) |
| Routing | `vercel.json` sets `cleanUrls: true`. `/principles` still serves `principles.html` but is unpromoted and out of the sitemap. `/episodes`, `/episodes.html`, `/civilizational-stack` and `/civilizational-stack.html` are retired and permanently redirect |
| Search | Google Search Console (domain-verified via DNS TXT) |
| Fonts | Google Fonts — Fraunces (variable serif) + IBM Plex Mono |
| Favicon | Path-based SVG monogram, generated via `sharp` + `png-to-ico` from `scripts/generate-favicons.mjs` |
| Dev server | `vercel dev --listen 3000` (serves static + API functions locally) |
| Node version | 24.x |

A future Next.js migration is deferred until EP 01 is real. Do not migrate preemptively.

### Repo layout

```
open-civilization-site/
├── content/
│   └── episodes.json      ← internal episode slate, 30 records, first 10 public
├── public/
│   ├── index.html         ← homepage, all CSS + JS inline
│   ├── principles.html    ← /principles, retained but unpromoted
│   ├── admin.html         ← token-protected subscriber viewer
│   ├── framing-engine.html / guest-desk.html  ← internal tools
│   ├── sitemap.xml / robots.txt
│   ├── favicon.ico / icon.svg / icon.png / apple-touch-icon.png
├── api/
│   ├── subscribe.js       ← POST /api/subscribe (adds email to Neon)
│   ├── subscribers.js     ← GET /api/subscribers (admin-only, token auth)
│   └── schema.sql         ← Neon table reference
├── app/                   ← reserved for Next.js migration; favicon source files only
├── scripts/
│   ├── build-episodes.mjs ← renders the first ten episode rows into index.html
│   └── generate-favicons.mjs
├── vercel.json            ← outputDirectory "public", cleanUrls, redirects
├── package.json
├── .env                   ← local dev only, gitignored
├── .env.example
├── PRODUCT_OVERVIEW.md
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

### Section tone (the page rhythm)

Sections alternate between the two paper tones so each topic reads as its own plate. Without it the page is one continuous cream field from masthead to footer, with the only tonal break being the dispatch at the very bottom, and seven sections repeating identical furniture (small red label, serif title, hairline rule) at the same scale and the same left edge.

| Section | Tone |
|---------|------|
| Hero | `--paper` |
| Premise | `--paper-2` (`.tinted`) |
| Doctrine | `--paper` |
| Host | `--paper-2` (`.tinted`) |
| Episodes | `--paper` |
| Guests | `--paper-2` (`.tinted`) |
| Listen | `--paper` |
| Dispatch | `--ink` |
| Footer | `--paper` |

Add `tinted` to a `.section` to tint it. The pattern lands the statement sections on tint and the list sections on plain, and ends on the ink dispatch.

**Tone goes on whole sections, never on one item inside a list.** Tinting a single row says "this item is different"; tinting a section says "this topic is different", which is the true statement. A full-bleed inverted featured episode was built and reverted for exactly this reason: it made EP 01 look like a different kind of thing from the rest of the slate. Don't repeat it.

**Hover inverts on tinted ground.** `--paper-2` is also the hover colour for `.doctrine-row`, `.tx-row`, `.platform-row` and `.connect-row`, so on a tinted section a hover would resolve to the section's own background and disappear. `.section.tinted` overrides send hover and card surfaces to `--paper` instead. **If you tint another section, check every hover and card inside it.**

### Listen section

**Structurally identical to every other section (2026-08-05).** Rail label, heading, the shared `.section-head` rule, then content starting under it at the same left edge as the episode and principle tables. Listen simply has one content row instead of ten. Roughly 307px at desktop.

- Platform names in the existing serif, middot separated, accent red on hover.
- **Deleted deliberately:** row numbers, displayed URLs, and per-row action labels (SUBSCRIBE, FOLLOW, WATCH, COPY, ADD). A visitor infers the destination from the name.
- Names stay live links. Overcast and Pocket Casts point at the RSS feed, as they did before.
- The section header is **"Listen and *watch.*"**, and Apple Podcasts keeps its full name.

**The governing idea.** A platform link is the same class of object as an episode title or a principle name: one item in a list, set in display serif on a ruled row. So `.listen-line` takes exactly the same type as `.tx-title` and `.doctrine-name`, through the same `--display-sm-*` tokens rather than copied numbers. If the token moves, this follows. These links are the section's only calls to action and must be the most prominent thing in it.

**Three arrangements have now been rejected. Do not rebuild any of them:**

- **The centred bordered block.** `.listen-block` at `max-width: 700px`, centred, with its own top border directly under the section-head rule, producing two stacked rules with a dead band between. It was also the only centred object on a page with one left edge.
- **The horizontal band.** Heading and links sharing a line, links at `--body-sm`, right aligned, wrapping to two lines. It made Listen the only section where the heading does not sit above its content, set the calls to action smaller than any body copy on the page, and introduced a right edge the page does not otherwise have.
- **The `LISTEN ON` label**, which repeated the heading in smaller type.

**Wrapping.** The full line is about 1160px at `--display-sm` desktop, so it sits on one line at 1280 and above and wraps once between 601 and 1200, where a trailing middot reads as continuation. **Below 600px the separators come out** (`.listen-line .dot { display: none }`) and the gap separates the names: measured leading middots at 390 and 414, trailing ones at 320, 360, 375 and 480, and a separator only means anything between two names on the same row. If a seventh platform is added, let it wrap. **Do not reduce the font size to prevent a wrap** — that is what produced the band.

Verified at 21 widths from 320 to 1512: no line begins or ends on a separator, no horizontal overflow, and the line's left edge matches the episodes table at every width.

### Mobile overflow — the trap in this layout

The page is full of fixed-px grid columns and long unbreakable strings (email addresses, URLs). A plain `1fr` track **cannot shrink below its content's min-content width**, so one long token silently pushes a section wider than the viewport. `body { overflow-x: hidden }` hides the symptom, which is why two of these survived unnoticed until 2026-07-31.

Rules when touching any grid:

- Use `minmax(0, 1fr)` rather than `1fr` wherever a track holds an email, a URL, or a fixed-px sibling column.
- Long unbreakable strings need `overflow-wrap: anywhere` (or `word-break: break-all`) as a safety net.
- Any grid with a fixed-px column (`180px 1fr`, `80px 1fr …`) **must** have a mobile rule that stacks it. `.tx-note` had none and squeezed its text into a 78px ribbon on every phone.
- Test at **320px**, not just 375px. Several issues only appear on iPhone SE width.
- **Never bulk-edit this stylesheet with a regex that spans rules.** A `re.sub` with `re.S` over the responsive block silently ate the Guests, Dispatch and Footer mobile rules in round three, including the `minmax(0,1fr)` overflow fix, and left an unclosed media query. Edit rules by exact match, and after any scripted edit check `{` and `}` counts inside `<style>` balance.
- **Fixed-px columns must fit their longest content.** `.platform-row` held URLs in a 200px column while `youtube.com/@opencivilization` needs 296px, so three of five rows ran under the CTA at full desktop width. Each row is its own grid, so these columns cannot be `max-content`; they must be a fixed value wide enough for the longest string. It is now 320px.

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

- **No em dashes** (`—`) in rendered copy, in comments, or in `content/episodes.json`. `scripts/build-episodes.mjs` fails the build if one appears in episode data. Use commas, colons or a sentence split. Hyphens, commas, or sentence splits instead. The only allowed em-dashes are in CSS/HTML comments (section dividers) where users never see them. This is enforced by grep in verification.
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

1. **Masthead** — brand + nav, sticky. Below 1000px the nav links are replaced by a single `LISTEN →` action and the bar height drops by about a third.
2. **Hero** — "Open / Civilization." + single serif paragraph + primary CTA
3. **Premise** (`#question`) — thesis paragraph
4. **Doctrine** (`#doctrine`) — "Ten principles." + `PRINCIPLE` / `THE HARD PART` header + 10 rows
5. **Host** (`#host`) — "Mehdi Nayebi." + 3-paragraph bio + one inline contact line
6. **Episodes** (`#episodes`) — red label reads `WHAT'S COMING`, header "Episodes." + `EPISODE` / `THE QUESTION` header row + 10 identical rows. No lede, no featured card.
7. **Guests** (`#guest`) — "Come on the show." + lede + pitch card (sticky on desktop)
7. **Listen** (`#listen`) — "Listen anywhere." + one centred inline line of platform names
8. **Dispatch** (`#dispatch`) — monthly newsletter, dark background + form
9. **Footer** — 4-column colophon + copyright strip

Do not reorder sections.

**No Roman numerals, no `§`.** Section markers are plain uppercase mono words: `PREMISE`, `DOCTRINE`, `HOST`, `EPISODES`, `GUESTS`, `LISTEN`, `DISPATCH`. The `§ I` / `§ II` notation and the `MMXXVI` masthead date were removed on 2026-07-31 and must not come back. The same applies to the footer copyright, which uses a plain year.

---

## Hero CTA state

**Pre-launch (current):** No hero CTA. The `READ THE PREMISE` button was removed on 2026-07-31. The `.hero-ctas` / `.hero-cta` styles are deliberately kept for the post-launch button.

**Post-launch (when EP 01 ships):** Reintroduce a red-filled primary `LISTEN TO EP. 01 →` linking to the episode page. The TODO is marked in `public/index.html` above the `.hero-ctas` div AND in the `.hero-cta` CSS. Search for `TODO: when EP 01 ships` to find it.

---

## Animations

Three systems, all in `public/index.html`:

1. **Hero rise-in** — `@keyframes riseIn` on `.hero-title .line`, `.hero-promise`, `.hero-ctas`. Runs once on page load, staggered 0.1s → 0.25s → 0.45s → 0.6s.
2. **Status dot pulse** — `@keyframes pulse` on `.status-dot`. Red glow expansion, 2.2s infinite.
3. **Smooth anchor scrolling** — `html { scroll-behavior: smooth; scroll-padding-top: 84px; }`. The padding clears the 52px sticky masthead so a target section's top rule is not hidden on arrival; without it, sections land flush under the bar. Disabled under `prefers-reduced-motion`.
4. **Scroll reveal** — IntersectionObserver adds `.is-visible` to every `.reveal` section. Observer settings: `threshold: 0`, `rootMargin: '0px 0px 20% 0px'` (triggers 20% BEFORE the section hits the viewport). Transition: 0.5s, translateY 14px → 0. Critical: the rootMargin must have a positive bottom value so reveals fire preemptively, not laggy.
5. **Doctrine stagger** — When `.doctrine-table` enters viewport, 10 rows fade in at 50ms intervals. Same IntersectionObserver settings.
6. **Masthead shrink** — Scroll listener + rAF. When `scrollY > hero bottom - 100px`, adds `.is-scrolled` to `.masthead-bar`. Tightens padding, border, font-size.

**All animations respect `@media (prefers-reduced-motion: reduce)`:**
- Reveals render at full opacity immediately (no transition).
- Doctrine stagger disabled.
- Masthead transition disabled.
- `riseIn` and `pulse` keyframes currently NOT explicitly disabled under reduced-motion (known gap).

**Hover states change colour, never geometry.** `.tx-row` used to add `padding-left: 12px` on hover with `padding` in its transition, so pointing at an episode slid its number, title, description and question 12px right and animated the text under the cursor. Removed 2026-08-05. The principle rows never did this, so it was inconsistent as well as distracting. No `:hover` rule on a public page may set padding, margin, width, font-size, letter-spacing or a transform on a text block. The only surviving transform hovers are `.hero-cta.primary/.secondary`, which are the post-launch buttons and are not rendered today.

**Do not introduce new animations without a clear editorial reason.** The site uses motion sparingly and deliberately.

---

## Git workflow

### Branches

- `master` — production. Pushing deploys via the Vercel GitHub App. Verify the live site after every push, see Deploy.
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

**History:** Git auto-deploy silently stopped working between **2026-04-16** (commit `4ada121`, the last push-triggered deployment) and **2026-07-30**. Every push in that window produced no deployment, no commit status, and no GitHub deployment record, and production kept serving the April build while pushes appeared to succeed. The Git integration was disconnected and reconnected in the Vercel dashboard on **2026-07-31**.

Manual deploy, still valid at any time and the fallback if auto-deploy stops again:

```bash
vercel deploy --prod
```

- **Always verify the live site after any deploy.** `curl -s "https://opencivilization.fm/?cb=$RANDOM" | grep <something-new>`. The CDN serves `x-vercel-cache: HIT` from the previous build until a new deployment replaces it, so "the push succeeded" is never evidence that anything shipped. That is exactly how the three-month outage went unnoticed.
- **There is no repo webhook, and there should not be one.** Vercel connects through a **GitHub App**, not a repository webhook. GitHub Apps never appear under repo Settings → Webhooks; they are under Settings → GitHub Apps. An empty Webhooks page is normal and is *not* a diagnosis.
- **To check whether auto-deploy is actually working:** push a commit and do **not** run `vercel deploy`. Then `gh api repos/mehdinayebi/open-civilization-site/deployments --jq '.[0].sha'` and confirm it matches the new commit. A manual CLI deploy also creates a deployment record, so records alone prove nothing unless the push was the only trigger.
- To repair it: Vercel dashboard → Project → Settings → Git → disconnect, then reconnect. Dashboard action, needs the account owner.
- If Vercel Analytics is ever re-enabled, a fresh deploy is required so `/_vercel/insights/script.js` is injected. The existing deploy won't retroactively serve it.

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
- ~~The schedule note~~ **Resolved 2026-07-31:** deleted. It claimed "New episodes every week. Full archive available on all major podcast platforms," both false pre-launch.

1. **Episode pages don't exist.** Featured EP 01 and upcoming rows are not clickable (no `href`).
2. **Platform links are placeholders.** Apple Podcasts, Spotify, YouTube URLs don't resolve to real listings yet. The Listen section presents them as live.
3. **RSS feed.** `/rss` is a placeholder; no actual feed is generated.
4. **Hero `riseIn` and status-dot `pulse`** are not explicitly disabled under `prefers-reduced-motion`. Scroll-triggered animations and masthead shrink are properly guarded.
5. **`/principles.html` no longer exists.** It was deleted on 2026-07-31 and `vercel.json` permanently redirects both `/principles.html` and `/principles` to `/#doctrine` (308, verified live). Keep the redirect: the URL was live and indexed in Google Search Console.
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

## Pages and routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `public/index.html` | Homepage |
| `/principles` | `public/principles.html` | Full doctrine with the hard-part column. **Retained but not promoted**: no homepage CTA, no footer link, not in the sitemap |

`cleanUrls: true` in `vercel.json` does the extension stripping. Do not add rewrites for these.

**The sitemap lists the homepage only.** `/principles` is deliberately excluded so an unpromoted page is not presented as a core route.

**Retired 2026-08-04.** `/episodes` and `/episodes.html` permanently redirect to `/#episodes`; `/civilizational-stack` and `/civilizational-stack.html` permanently redirect to `/`. Do not recreate either page.

The Civilizational Stack essay is in git history at `a9911fd`. Do not restore it, and do not add a replacement framework section, explanatory block or diagram to the homepage without an explicit instruction.

**Back-compatible anchors.** `#doctrine`, `#question` and `#guest` were live hashes before the 2026-08-04 restructure. They survive as zero-height `<span class="anchor-alias">` targets immediately before the sections that replaced them (`#principles`, `#premise`, `#guests`). Do not delete them.

---

## Homepage section order (fixed)

1. **Hero** — wordmark, then **one integrated paragraph**, then two text links
2. **Premise** (`#premise`) — "Free, and fragile."
3. **Episodes** (`#episodes`) — label `EPISODES`, episodes 01 to 10 only, no archive CTA
4. **Principles** (`#principles`) — compact list, no hard-part column, no CTA to /principles
5. **Host** (`#host`)
6. **Guests** (`#guests`)
8. **Listen** (`#listen`)
9. **Dispatch** (`#dispatch`)
10. **Footer**

The narrative order is deliberate: the defining question, the stakes, the episodes, the principles, the host, participation. Episodes sit **above** Principles. Do not move the doctrine back up.

Primary nav is Premise, Episodes, Principles, Host, Dispatch, Listen, on every public page. **Listen is last on purpose**, it is the practical action. Guests is deliberately not in the primary nav but stays in the footer nav.

---

## Hero

One paragraph under the wordmark, no separate descriptor or byline line. Exact copy:

> A show by Mehdi Nayebi on the forces shaping the future of the free world in an age of exponential technological change, and on whether open societies can stay strong enough to *build, innovate, and defend* the freedoms, prosperity, and stability they depend on.

- `.hero-promise`, Fraunces, `--body-lg`, `SOFT 100 / WONK 0 / opsz 32`, `max-width: 66ch` on desktop. The `<em>` on "build, innovate, and defend" is part of the approved copy.
- **There is no `.hero-descriptor`.** A hero split into a large question plus a small byline was tried on 2026-08-04 and reverted: the second line read as detached metadata. Do not reintroduce a secondary line, tagline or heading in the hero.
- The sentence establishes, in order: whose show it is, the subject, the context, the concern, the stakes. It deliberately does not open on the undefined term "open societies"; the Premise develops that.
- Actions are `Episodes` and `Join the dispatch`. Do not add a third.

**Metadata carries the concise first clause only**, not the whole sentence:

> A show by Mehdi Nayebi on the forces shaping the future of the free world in an age of exponential technological change.

Applied to `<meta name="description">`, `og:description`, `twitter:description` and the JSON-LD `description`.

---

## Footer

Three columns: **brand, navigate, contact**. `grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.75fr) minmax(0, 0.9fr)`, gap 56px. Brand spans the full first row at 1000px, everything stacks at 600px.

**There is no About column.** It restated the homepage thesis in a cramped column and was removed on 2026-08-04. Do not add a mission statement back to the footer: the brand block carries the identity and the page above carries the argument.

Every track is `minmax(0, ...)`. A bare `fr` cannot shrink below the unbreakable contact email and pushed the footer past the viewport between 1001px and roughly 1200px.

---

## Episode data

**Public terminology is "episodes", never "investigations".** The label is `EPISODES`, the hero link is `Episodes`, the column header is `EPISODE`. Internal notes may say episode slate.

`content/episodes.json` is the internal editorial slate: 30 records. Fields: `number`, `title`, `titleHtml` (carries the italic `<em>`), `description`, `question`, `slug`, `featured`.

**Only the ten `featured` records are ever public.** Records 11 to 30 are editorial planning. They must not render, be summarised, be counted, or be linked on any public page. There is no public archive.

**There is no `subtitle` field.** It was removed from the public system on 2026-08-04. The build script throws if one reappears, and also throws on any unrecognised field rather than dropping it silently.

Rows are generated into both pages, never hand-written:

```bash
node scripts/build-episodes.mjs
```

- Writes between the `EPISODES:START` / `EPISODES:END` markers in `public/index.html` only. **Anything between those markers is overwritten.**
- `featured: true` controls the public set, currently 01 to 10.
- Episode titles are `h3`, inside the Episodes section which carries the `h2`.
- The script validates contiguous numbering, at least ten featured records, no subtitle, no unknown fields, and **throws if any episode field contains an em dash**.
- Run it and commit the resulting HTML. There is still no build step at deploy time.

**Do not** give planned episodes play controls, durations, dates or "listen now" language. Nothing is published.

---


## Episode slate (superseded)

**Superseded on 2026-08-04.** The slate below was replaced wholesale by the episode slate in `content/episodes.json`. Kept only as a record of what was retired: The Grid Can't Take It, Three Companies Own the Frontier, The Training Data Wars, Why Rich Democracies Can't Build, The Drone War Changed Everything, The Chokepoints Nobody Planned For, When Impersonation Is Free, Open Weights, Open Risk, Science Under Political Management, Does Financial Statecraft Still Work? These remain usable future episode concepts, they are simply not the opening slate.

| # | Title | Summary | The question |
|---|-------|---------|--------------|
| 01 | The Grid Can't Take It | AI's power demand has collided with grids nobody can expand fast enough. | Can a democracy still build power at the scale this needs? |
| 02 | Three Companies Own the Frontier | The critical capacity of the age sits with a handful of firms and their capital partners. | What does dispersed power mean when the capacity sits with three companies? |
| 03 | The Training Data Wars | The largest uncompensated transfer of privately created value in commercial history. | Can property rights be reasserted through code when law is too slow? |
| 04 | Why Rich Democracies Can't Build | Permitting, veto points, and the protections that stop tyranny and also stop construction. | What would a democracy have to give up to build at speed again? |
| 05 | The Drone War Changed Everything | Cheap precision has inverted the economics of defence, and every military is studying it. | Can procurement adapt as fast as the technology now demands? |
| 06 | The Chokepoints Nobody Planned For | Chips are the famous one. Gallium, helium and rare earths are the ones nobody priced. | Can an open society build redundancy without becoming a command economy? |
| 07 | When Impersonation Is Free | Detection is losing to generation, and the first elections inside that environment are underway. | Can verification be rebuilt, or do societies simply adapt their epistemics? |
| 08 | Open Weights, Open Risk | Freedom to build against the strength required to stay safe, argued by both sides. | Is openness a value or a strategy? |
| 09 | Science Under Political Management | Funding, publication and international collaboration are all being reshaped at once. | Can the open scientific system survive politicisation? |
| 10 | Does Financial Statecraft Still Work? | Evasion architecture is maturing faster than enforcement. | Is the main instrument short of war already spent? |

**The order is deliberate, do not resequence.** It opens on the most concrete and most currently argued story, which is where a new show gets its first traction. Episodes 1 to 4 are researchers, founders, lawyers and executives who will take a call from a show with nothing published. Episode 5 is the first hard booking and lands only once there are four conversations to send. Six through ten widen the range across supply chains, information, safety, science and finance, so anyone arriving at any single episode finds a show rather than a hobbyhorse. **Nothing is historical, everything is live.**

### Display rules for the episodes block

- **No taxonomy tags.** DECAY, TRUTH, POWER, CAPACITY and the rest are gone. They carried no information.
- **No `UPCOMING` marker.** Repeated ten times it was pure visual noise.
- Every row carries a **one-line summary** under the title, so a stranger knows what the episode is.
- Every row carries the **central question** in the right column, accent red italic, the same treatment as `.doctrine-hard`. The block reuses the doctrine grid on purpose, so the site develops one visual language.
- The right edge is **deliberately blank**. The spec calls for a month per row; no months are committed yet, and its own instruction is that empty reads better than the same word ten times. **To add them:** widen `.tx-row` / `.tx-head` to four columns and append a right-aligned `.tx-month` cell. Do not invent months.
- **No featured card.** EP 01 is row 01, formatted identically to 02-10. The shaded block, the `FEATURED · EPISODE 01` label and the `COMING SOON` marker were all removed in round three: singling out one episode made it read as a different kind of thing. The `EPISODE` / `THE QUESTION` header sits *above* row 01.
- **Column headers align with the title column, not the number.** `.dh-left` and `.th-left` both start at grid column 2. The number is an index and needs no header; the title and the description together are the principle (or the episode). Do not add a third header word for the description column.

---

## Positioning language (not site copy)

What to say when someone asks why the show matters now. Reference for writing copy; do not paste onto the site.

**Ten seconds.** The decisions being made right now about compute, energy, biology and surveillance are constitutional decisions. Nobody is treating them that way, and nobody voted on any of them.

**Thirty seconds.** There are excellent shows about AI, and excellent shows about politics. The AI people do not think about institutions and the institutions people do not understand the technology. This show sits in the gap. And almost everyone working in that gap is a journalist or an academic. I built a company inside a country that had already stopped needing its builders, and I left because of it. I am asking whether the free ones are heading somewhere similar, and what would stop it.

**The three differentiators.**

1. An operator rather than a commentator.
2. Connects the technology layer to the institutional layer, where almost nobody works.
3. Asks a capability question with a possible yes, rather than running the decline genre everyone else is running.

---

## Host section

Compacted 2026-07-31. It was the tallest low-value block on the page and carried four headers before a word of content.

- Section header is **"Mehdi Nayebi."** — one header, not two. The giant `Mehdi / Nayebi` display lockup below it is gone; it duplicated the header.
- The `HOST & CREATOR` label and "Entrepreneur, operator, and host of Open Civilization" are gone; they restated the section name.
- Contact is **one inline line** (`contact@opencivilization.fm · X · LinkedIn`), small mono caps, no arrows, no rules. Not three full-width rows.
- **The bio text itself is unchanged and must stay that way.**
- **Open:** the spec's preferred layout (Option A) is a portrait in a left column beside the bio. It is blocked on a photograph. The site has no human face anywhere, which is the cheapest available fix for its coldness. Until a photo exists the bio runs at a comfortable measure (Option B). Search `TODO: Option A` in `public/index.html`.


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
