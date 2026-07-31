# Open Civilization — Product Overview

**Last updated:** 2026-04-12 · v5

---

## Project Summary

**Open Civilization** is a podcast and public-intellectual project hosted by Mehdi Nayebi. The website serves as the public face of the show — a marketing site, editorial statement, and subscriber funnel.

- **Live URL:** [opencivilization.fm](https://opencivilization.fm)
- **Domain aliases:** www.opencivilization.fm, open-civilization-site.vercel.app
- **Contact:** contact@opencivilization.fm
- **Host social:** [@mehdinayebi](https://x.com/mehdinayebi) (X), [LinkedIn](https://linkedin.com/in/mehdinayebi)
- **Parent project:** Gravitas Society — an intellectual community whose mission is fighting tribal epistemics

**Tagline:** *How open societies endure — and how they decay.*

---

## Tech Stack

| Layer          | Choice                                              |
|----------------|------------------------------------------------------|
| Markup         | Static HTML (`public/index.html`, `public/principles.html`, `public/admin.html`) |
| Styling        | Inline `<style>` blocks (no external CSS)            |
| JavaScript     | Vanilla JS (no framework)                            |
| Fonts          | Google Fonts — Fraunces (variable serif), IBM Plex Mono |
| Hosting        | Vercel (auto-deploys from `master` branch)           |
| Serverless API | Vercel Functions (`api/subscribe.js`, `api/subscribers.js`) |
| Database       | Neon Postgres (serverless, `@neondatabase/serverless` driver) |
| Dev server     | `vercel dev --listen 3000`                           |
| Favicon        | Path-based SVG monogram, generated via sharp/png-to-ico |

### npm Scripts

| Script     | Command                                     | Purpose                     |
|------------|----------------------------------------------|-----------------------------|
| `dev`      | `vercel dev --listen 3000`                   | Local dev with API support  |
| `start`    | `npx serve public -l 3000`                   | Static-only serve           |
| `validate` | `npx html-validate public/index.html`        | HTML validation             |
| `links`    | `npx linkinator public/index.html --silent`  | Broken link checking        |

### Dependencies

| Package                      | Type | Purpose                          |
|------------------------------|------|----------------------------------|
| `@neondatabase/serverless`   | prod | Neon Postgres driver for API     |
| `sharp`                      | dev  | SVG-to-PNG favicon generation    |
| `png-to-ico`                 | dev  | PNG-to-ICO favicon generation    |

### Environment Variables

| Variable       | Where set          | Purpose                        |
|----------------|--------------------|---------------------------------|
| `DATABASE_URL` | Vercel + `.env`    | Neon Postgres connection string |
| `ADMIN_TOKEN`  | Vercel + `.env`    | Password for `/admin.html`     |

---

## Pages

### 1. Homepage (`/` — `public/index.html`)

The main single-page site. All sections, styles, and scripts in one file.

### 2. Principles Page (`/principles.html`)

Full editorial statement of the ten principles. Long-read format with serif headings, mono body text, closing note signed by the host. Same design system as homepage. No animations (by design — it is a reading page).

### 3. Admin Dashboard (`/admin.html`)

Token-protected subscriber viewer. Displays total count, latest signup date, and a table of all emails. Token stored in `sessionStorage` for session persistence. Marked `noindex, nofollow`.

---

## Design System

### Color Palette

| Token       | Hex       | Usage                                  |
|-------------|-----------|----------------------------------------|
| `--paper`   | `#f1ede3` | Page background                        |
| `--paper-2` | `#e9e4d5` | Hover states, cards, featured blocks   |
| `--ink`     | `#0e0e0e` | Primary text, borders, rules           |
| `--ink-2`   | `#1c1c1a` | Body text, secondary content           |
| `--muted`   | `#6e6a5e` | Labels, tags, subtle UI text           |
| `--muted-2` | `#a8a394` | Dividers, status dots, faint accents   |
| `--red`     | `#b22a1f` | Primary accent — CTAs, section numbers |
| `--red-ink` | `#7a1a12` | Hover state for red, italic emphasis   |
| `--rule`    | `#0e0e0e` | Border/rule color (same as ink)        |

### Typography

| Token      | Family                                          | Role                         |
|------------|--------------------------------------------------|------------------------------|
| `--serif`  | Fraunces, Times New Roman, Georgia, serif        | Headings, display, editorial |
| `--mono`   | IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace | Body, labels, buttons, UI    |

**Fraunces variable axis settings:** `"SOFT" 0, "WONK" 1, "opsz" 144`

**Font features enabled:** `ss01`, `ss02`, `cv01`, `cv02`

#### Type Scale

| Element              | Size                          | Weight         |
|----------------------|-------------------------------|----------------|
| Hero title           | `clamp(72px, 14vw, 220px)`   | 400 / 300 italic |
| Hero promise         | `clamp(20px, 2.4vw, 28px)`   | 400            |
| Section titles       | `clamp(32px, 4.5vw, 56px)`   | 400            |
| Host name display    | `clamp(72px, 12vw, 180px)`   | 400 / 300 italic |
| Featured ep title    | `clamp(36px, 5vw, 62px)`     | 500            |
| Doctrine names       | `26px`                        | 500            |
| Premise paragraph    | `clamp(22px, 2.8vw, 34px)`   | 400            |
| Body text            | `16px–17px`                   | 400            |
| UI labels / tags     | `10px–12px`                   | 500–700        |
| CTA buttons          | `13px`                        | 600–700        |

### Visual Texture

Paper-grain overlay via `body::before` using an inline SVG filter (`feTurbulence` fractal noise), at `opacity: 0.35` with `mix-blend-mode: multiply`. Applied on both homepage and principles page.

### Favicon

Path-based "OC" monogram — cream `#F5F1E8` on near-black `#0A0A0A`. Classical serif letterforms, tightly kerned. Generated from SVG via `scripts/generate-favicons.mjs`.

| File                  | Size    | Dimensions           |
|-----------------------|---------|----------------------|
| `app/icon.svg`        | 1.2 KB  | Vector source        |
| `app/icon.png`        | 16 KB   | 512x512              |
| `app/apple-icon.png`  | 4 KB    | 180x180              |
| `app/favicon.ico`     | 15 KB   | 16, 32, 48 (multi)   |

Copies also live in `public/` with `<link>` tags in both HTML files.

---

## Homepage Sections

### 1. Masthead Bar

Sticky top navigation (`position: sticky; top: 0; z-index: 100`). Shrinks on scroll past hero.

- Brand: **OPEN CIVILIZATION**
- Date: MMXXVI
- Nav links: § Premise, § Doctrine, § Host, § Episodes, § Guests, § Dispatch

### 2. Hero

- Title: "Open / Civilization." (two-line animated rise-in)
- Question hook: "What does it take to keep a civilization *free, capable, and able to defend itself,* and why are those conditions *historically rare, difficult to sustain, and so often lost?*"
- Sub-line: "A weekly podcast hosted by Mehdi Nayebi for people who want a clearer map of the world." (IBM Plex Mono, muted)
- CTAs: "Listen to EP 01" (red primary) | "Subscribe →" (outlined secondary)

### 3. § I — Premise (`#question`)

- Label: § I / Premise
- Thesis: "Free societies are rare. Most don't last. They usually fall apart from the inside, slowly, while people argue about other things. By the time the decline is obvious, the institutions that could have stopped it are already hollow. This show is about what actually holds free societies together, what quietly pulls them apart, and the people still doing something about it before it's too late."

### 4. § II — Doctrine (`#doctrine`)

- Label: § II / Doctrine
- Title: "Ten *principles.*"
- 10-row table with staggered scroll-reveal animation
- Footer link: "Read the full statement →" → `/principles.html`

#### The Ten Principles

| #  | Name                              | Gloss                                                                                                                              | Tag         |
|----|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------|-------------|
| 01 | Rare, *not default.*              | Most societies in history have been closed, hierarchical, and unfree. The free society is a historical exception.                  | Exception   |
| 02 | Dispersed *power.*                | No person, class, or institution can be trusted with unchecked authority. Checks and balances exist to stop domination.            | Checks      |
| 03 | Liberty as *foundation.*          | Freedom of conscience, speech, association, movement, and economic activity are the condition that makes every other value chosen.  | Freedom     |
| 04 | Revisable *belief.*               | Truth is discoverable through inquiry. Dogma is the enemy of a society's ability to correct its own mistakes.                      | Inquiry     |
| 05 | Moral *universalism.*             | Some human rights and moral claims hold across cultures and eras. Cultural relativism is not a license for cruelty.                | Universal   |
| 06 | Markets *with rules.*             | Voluntary exchange produces more prosperity than central planning. But markets require courts, rules, and occasional correction.   | Markets     |
| 07 | Institutions *over iconoclasm.*   | Major institutions are load-bearing walls. The instinct to burn them down is almost always worse than the instinct to reform them. | Institutions|
| 08 | Cosmopolitan, *particular.*       | Moral concern extends beyond borders, but solidarity and self-government operate through bounded political communities.            | Nations     |
| 09 | Tolerance that *defends itself.*  | The free society does not extend protection to movements whose explicit goal is to end the free society itself.                    | Defense     |
| 10 | Historically *conscious.*         | Free societies know where they came from and know each generation has to defend them anew. Reversal is possible and has happened.  | History     |

### 5. § III — Host (`#host`)

- Label: § III / Host
- Title: "About the *host.*"
- Name display: "Mehdi / Nayebi" (large Fraunces serif)
- Role: "Host & Creator — Entrepreneur, operator, and public thinker."

**Bio (3 paragraphs):**

1. Background spanning Tehran, France, London finance (Deutsche Bank, Bank of America), then companies across Tehran, Dubai, and Toronto. Lifelong concern with what makes societies flourish or decay.

2. Co-founded Alopeyk (one of Iran's largest on-demand logistics platforms). Built inside a sanctioned authoritarian system, left Iran for safety reasons. Credible perspective on authoritarianism, institutional dysfunction, state failure. Knows what a closed society actually looks like.

3. Work at the intersection of geopolitics, institutions, technology, power, and civilizational renewal.

**Contact links:** Email, X/Twitter (@mehdinayebi), LinkedIn

### 6. § IV — Episodes (`#episodes`)

- Label: § IV / Episodes
- Title: "Episodes."

#### Featured Episode

| Field       | Value                                                                                                                              |
|-------------|------------------------------------------------------------------------------------------------------------------------------------|
| Number      | EP 01                                                                                                                              |
| Title       | What Keeps a Civilization *Open?*                                                                                                  |
| Description | The opening episode. A thesis-setting conversation on what actually sustains free, capable civilizations, and the warning signs when those conditions begin to erode. |
| Pillars     | Strength · Truth · Merit                                                                                                           |
| Runtime     | 64 min                                                                                                                             |
| Season      | Season One                                                                                                                         |
| Status      | Now Playing                                                                                                                        |
| CTA         | Listen Now →                                                                                                                       |

#### Upcoming Episodes

| #     | Title                                                  | Pillars              | Status   |
|-------|--------------------------------------------------------|----------------------|----------|
| EP 02 | How Civilizations *Decay*                              | Capacity · Freedom   | Upcoming |
| EP 03 | The Mechanics of *Weakness*                            | Strength · Capacity  | Upcoming |
| EP 04 | Propaganda *Laundering* in Open Societies              | Truth · Media        | Upcoming |
| EP 05 | Iran: A *Case Study* in Civilizational Capture         | Freedom · Borders    | Upcoming |
| EP 06 | The *Will* to Defend                                   | Strength · Freedom   | Upcoming |
| EP 07 | The *China* Question                                   | Capacity · Strength  | Upcoming |

**Schedule note:** "New episodes every week. Full archive available on all major podcast platforms."

### 7. § V — Guests (`#guest`)

- Label: § V / Guests
- Title: "Come on the *show.*"

**Guest lede:** "Open Civilization hosts dissidents, founders, investors, scientists, historians, generals, technologists, policymakers, exiles, journalists, educators, and builders. The show is not defined by sector. It is defined by a position, that free societies are rare, fragile, and worth defending, and by the conversations that position makes possible."

**The Governing Test:** "Does this person's work help us understand how free societies are built, how they decay, how they defend themselves, or how they renew themselves?"

**Fine print:** "If yes, you fit. The show is not defined by sector. It is defined by a deeper question. Pitch yourself or someone you know. Every inquiry is read."

**Pitch card:** Sticky card with "Guest Inquiry" eyebrow, "Pitch the show" title, instructions, and mailto CTA (contact@opencivilization.fm with subject pre-fill).

### 8. § VI — Listen (`#listen`)

| #  | Platform                           | URL                            | CTA         |
|----|------------------------------------|--------------------------------|-------------|
| 01 | Apple Podcasts                     | podcasts.apple.com             | Subscribe → |
| 02 | Spotify                            | open.spotify.com               | Follow →    |
| 03 | YouTube                            | youtube.com/@opencivilization  | Watch →     |
| 04 | RSS Feed                           | opencivilization.fm/rss        | Copy →      |
| 05 | Overcast · Pocket Casts · Fountain | Any podcast client via RSS     | Add →       |

### 9. § VII — Dispatch / Newsletter (`#dispatch`)

- Dark background section (`background: var(--ink)`)
- Eyebrow: "Dispatch · The newsletter"
- Headline: "A weekly *dispatch* for people who want a deeper map of the world."
- Description: "New episodes, show notes, and occasional dispatches on what the show is watching. No marketing noise. No list rentals. Leave any time."
- Form: email input + submit button → `POST /api/subscribe`
- Footer: "Weekly · Free · Unsubscribe in one click"

### 10. Footer

4-column colophon grid:

| Column    | Content                                                                                                              |
|-----------|----------------------------------------------------------------------------------------------------------------------|
| Brand     | "Open *Civilization*" wordmark + tagline: "How free civilizations endure, and how they decay."                        |
| About     | "A weekly podcast hosted by Mehdi Nayebi. Open Civilization is about what it takes to build, defend, and renew free societies — and why those societies have always been rare. New episodes every week." |
| Navigate  | The Premise, The Doctrine, Ten Principles, The Host, Episodes, Be a Guest, Listen, Newsletter                       |
| Contact   | contact@opencivilization.fm, X/Twitter, LinkedIn                                                                     |

Bottom bar: "© MMXXVI Open Civilization · All rights reserved" | contact@opencivilization.fm

---

## Serverless API

### `POST /api/subscribe`

Accepts newsletter signups. Stores emails in Neon Postgres.

| Field    | Details                                         |
|----------|-------------------------------------------------|
| Method   | POST only (405 otherwise)                       |
| Body     | `{ "email": "user@example.com" }`               |
| Validate | Presence check, regex format check              |
| Storage  | `INSERT INTO subscribers ... ON CONFLICT DO NOTHING` |
| Success  | `{ "ok": true }`                                |
| Error    | `{ "ok": false, "error": "..." }`               |
| Dupes    | Silently ignored (no error)                     |

### `GET /api/subscribers`

Returns all subscribers. Protected by `ADMIN_TOKEN` via Bearer auth.

| Field    | Details                                             |
|----------|-----------------------------------------------------|
| Method   | GET only                                            |
| Auth     | `Authorization: Bearer {ADMIN_TOKEN}`               |
| Success  | `{ "ok": true, "count": N, "subscribers": [...] }` |
| Unauth   | `401 { "error": "Unauthorized" }`                   |

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS subscribers (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

Hosted on Neon Postgres (`open-civilization` project, AWS US East 1).

---

## Animations & Motion

### Keyframe Animations

| Animation | Target                | Duration | Trigger    | Behavior                                    |
|-----------|-----------------------|----------|------------|---------------------------------------------|
| `riseIn`  | Hero title, promise, sub, CTAs | 1s | Page load  | Fade up from `translateY(30px)`. Staggered: 0.1s, 0.25s, 0.45s, 0.55s, 0.6s |
| `pulse`   | `.status-dot`         | 2.2s     | Page load  | Infinite red glow via box-shadow            |

### Scroll-Triggered Reveals

| System           | Mechanism            | Threshold | Behavior                                                    |
|------------------|----------------------|-----------|-------------------------------------------------------------|
| Section reveal   | IntersectionObserver | 0.15      | `.reveal` → `.is-visible`. Fade up over 0.9s. Runs once.   |
| Doctrine stagger | IntersectionObserver | 0.2       | `.doctrine-table` → `.is-revealed`. 10 rows stagger at 50ms intervals (0s–0.45s). |
| Masthead shrink  | Scroll + rAF         | Hero bottom - 100px | Padding/font shrinks. 0.3s transition.          |

### Hover Transitions

| Element               | Effect                                    | Duration |
|-----------------------|-------------------------------------------|----------|
| `.mast-link`          | Underline appears                         | 0.15s    |
| `.hero-cta.primary`   | Darkens red, slides right 4px             | 0.2s     |
| `.hero-cta.secondary` | Inverts to dark fill, slides right 4px    | 0.2s     |
| `.doctrine-row`       | Background highlight                      | 0.25s    |
| `.doctrine-link`      | Fills ink, slides right 4px               | 0.2s     |
| `.connect-row`        | Background + indent, arrow slides red     | 0.2s     |
| `.tx-row`             | Background + indent                       | 0.2s     |
| `.tx-featured`        | Background darkens, CTA darkens + slides  | 0.2s     |
| `.pitch-btn`          | Ink → red                                 | 0.2s     |
| `.platform-row`       | Background highlight                      | 0.2s     |
| `.dispatch-form button` | Paper → red                             | 0.2s     |
| Footer links          | Red + underline                           | 0.15s    |

### Accessibility

All scroll-triggered and transition-based animations respect `prefers-reduced-motion: reduce`:
- Masthead: `transition: none`
- Doctrine stagger: rows render at full opacity immediately
- Scroll reveal: all `.reveal` elements visible immediately
- IntersectionObserver fallback: adds `.is-visible` if API unavailable

---

## Responsive Breakpoints

### Homepage at 1000px

- Hero: padding reduced
- Sections: padding reduced
- Doctrine rows: 2-column stacked layout
- Host: single column, name clamped smaller
- Featured episode: single column
- Episode rows: 2-column stacked
- Guest pitch: single column, card loses sticky
- Platforms: 2-column stacked
- Dispatch: form stacks vertically
- Footer: 2-column colophon
- Masthead: smaller, horizontal scroll, spacer hidden
- Premise: tighter padding, smaller font

### Homepage at 600px

- Doctrine rows: narrower, smaller fonts
- Connect rows: single column, arrows hidden
- Footer: single column
- Premise: 18px font

### Principles page at 900px

- Masthead: smaller padding and font
- Hero: reduced padding
- Principles: narrower grid (60px number column)
- Closing: reduced padding
- Footer: column layout

### Principles page at 600px

- Principles: narrower grid (44px), smaller numbers

---

## Git History

### Branches

| Branch       | Purpose                                         |
|--------------|--------------------------------------------------|
| `master`     | Production (auto-deploys to Vercel)              |
| `v2-edits`   | Layout, typography, content restructuring        |
| `v3-edits`   | Motion/animation work                            |
| `v4-edits`   | Hero question hook, section I becomes Premise    |
| `v5-edits`   | Ten principles, /principles page, marquee removal|

### Tags

| Tag | Milestone                                       |
|-----|-------------------------------------------------|
| v1  | Initial approved design                         |
| v2  | Layout + type refinements                       |
| v3  | Scroll-reveal, doctrine stagger, masthead shrink|
| v4  | Hero question, Premise section, favicon, email collection |
| v5  | Ten principles, /principles page, marquee removed|

### Commit History (full)

```
4ed1f4d feat(motion): update doctrine stagger for ten rows
9efa977 refactor(footer): rewrite about blurb, add principles link
04e3986 refactor(host): add closed-society credibility sentence
7d22700 refactor(guests): update pitch lede and governing test copy
fb61b42 feat(principles): add /principles page with full statement
5534d1a feat(doctrine): replace seven pillars with ten principles
14ec7b8 refactor(layout): delete scrolling marquee
dbb68ea feat: add admin page to view subscribers at /admin.html
82f2ca1 chore: switch dev script to vercel dev for local API testing
cd3debe fix: add vercel.json routing and improve subscribe error logging
c8f5c04 feat: wire newsletter form to Neon Postgres via Vercel serverless
cbb3d35 fix: wire favicon into index.html and public/
e451483 feat: add placeholder OC monogram favicon
f0710de chore: add .vercel to gitignore
a62658e refactor(section-1): convert Question to Premise with thesis paragraph
5b6d8ad feat(hero): move central question into hero promise
85369ef chore: snapshot pre-v4-edits working state
d892534 fix: update audit comment to reflect removed hero-sub
cd4245d fix: remove leftover hero-sub responsive rule and long-form copy
53dbe99 feat(motion): shrink masthead on scroll past hero
7640fc3 feat(motion): stagger doctrine pillars on section entry
afee2c7 feat(motion): scroll-reveal sections on viewport entry
d7f7817 style(copy): remove em-dashes across the site
d647cde refactor(footer): remove set-in colophon row
4825dd5 refactor(episodes): rename to Episodes, simplify editor note
6950207 refactor(host): remove spine of the show line
57150cd refactor: delete section II what the show is and is not
7f05314 refactor(question): remove redundant section heading
71605ab refactor(hero): remove tagline, rewrite promise, fix copy
136c293 chore: audit existing animations before v3 work
66a090b refactor(layout): move doctrine marquee below question section
331ae93 feat(footer): editorial colophon with set-in credit
6cb5733 feat(episodes): feature EP 01 as hero block, upcoming divider
bf35d79 feat(host): asymmetric redesign, huge serif name, remove portrait
1aff269 feat(hero): add promise paragraph and primary/secondary CTAs
647fa42 feat(type): bump font scale across nav, body, ledgers, footer
b31e08a Initial site snapshot — approved design, pre-functionality
```

---

## UI/UX Testing Checklist

### Functional Tests

- [ ] All 6 masthead anchor links scroll to correct sections
- [ ] "Listen to EP 01" CTA links to `#episodes`
- [ ] "Subscribe" CTA links to `#listen`
- [ ] "Read the full statement →" links to `/principles.html`
- [ ] Email link opens mailto
- [ ] X/Twitter and LinkedIn links open in new tabs with `rel="noopener"`
- [ ] Guest pitch mailto link includes subject pre-fill
- [ ] All 5 platform links open in new tabs
- [ ] Newsletter form submits to `/api/subscribe` and shows "Subscribed" on success
- [ ] Newsletter form shows error state and resets after 3s on failure
- [ ] Newsletter form email input has `required` attribute
- [ ] Duplicate email submission handled gracefully (no error shown to user)
- [ ] `/admin.html` rejects invalid tokens with "Invalid token" message
- [ ] `/admin.html` shows subscriber table after valid token entry
- [ ] `/admin.html` remembers token in sessionStorage for session
- [ ] `/principles.html` "← Back to the show" links to homepage
- [ ] Footer "Ten Principles" link navigates to `/principles.html`
- [ ] Footer "The Premise" link navigates to `#question`

### Animation Tests

- [ ] Hero title lines animate in with staggered delays on page load
- [ ] Hero promise fades in after title (0.45s delay)
- [ ] Hero sub-line fades in at 0.55s
- [ ] Hero CTAs fade in at 0.6s
- [ ] Status dot pulses continuously
- [ ] Sections fade in and rise when scrolled into viewport
- [ ] Each section triggers only once (observer unobserves)
- [ ] Doctrine rows stagger in with 50ms intervals (10 rows, 0s–0.45s)
- [ ] Masthead shrinks after scrolling past hero
- [ ] Masthead restores when scrolling back up

### Hover State Tests

- [ ] Masthead links: underline
- [ ] Primary CTA: darkens, slides right
- [ ] Secondary CTA: inverts, slides right
- [ ] Doctrine rows: background highlight
- [ ] "Read the full statement" link: fills ink, slides right
- [ ] Host connect rows: indent + arrow slides red
- [ ] Episode rows: indent + background
- [ ] Featured episode: background darkens, CTA slides
- [ ] Guest pitch button: ink → red
- [ ] Platform rows: background highlight
- [ ] Newsletter submit button: paper → red
- [ ] Footer links: red + underline

### Accessibility Tests

- [ ] `prefers-reduced-motion: reduce` disables all animations
- [ ] Both pages have `lang="en"`
- [ ] Viewport meta tags present
- [ ] Meta descriptions present on both pages
- [ ] All external links have `rel="noopener"`
- [ ] Form input has `required`
- [ ] IntersectionObserver fallback works
- [ ] Admin page has `noindex, nofollow`

### Responsive Tests

- [ ] Homepage at 1000px: layouts collapse correctly
- [ ] Homepage at 600px: further narrowing
- [ ] Principles page at 900px: layouts adjust
- [ ] Principles page at 600px: narrow grid
- [ ] No horizontal overflow on any page at any width

### Performance Tests

- [ ] Fonts preconnected
- [ ] `font-display: swap` via Google Fonts
- [ ] Scroll listener uses `{ passive: true }`
- [ ] Scroll handler throttled via `requestAnimationFrame`
- [ ] `will-change: opacity, transform` on `.reveal`
- [ ] No external JavaScript dependencies (zero client-side JS libraries)
- [ ] No images (all visuals CSS/SVG)
- [ ] Paper grain uses inline SVG data URI
- [ ] API functions use HTTP-based Neon driver (no persistent connections)

---

## Known Gaps / Placeholder State

1. **Episode links:** Featured EP 01 and all upcoming rows point to `href="#"` — no audio or episode pages yet
2. **Platform links:** Apple Podcasts, Spotify, YouTube URLs may not resolve to real listings yet
3. **RSS feed:** `/rss` endpoint does not exist yet
4. **No analytics:** No tracking scripts or event logging
5. **No OG/social meta tags:** Missing Open Graph and Twitter Card tags
6. **No sitemap or robots.txt**
7. **Pitch card copy:** Still references "seven pillars" — should say "ten principles"
8. **Hero `riseIn` and `pulse` not disabled under `prefers-reduced-motion`:** Only scroll-triggered and transition animations are guarded
9. **Admin page has no pagination:** Will need updating if subscriber count grows large
10. **No email confirmation flow:** Emails are stored directly without double opt-in
