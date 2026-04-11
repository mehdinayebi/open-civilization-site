# Open Civilization — Product Overview

## Project Summary

**Open Civilization** is a single-page marketing website for a podcast hosted by Mehdi Nayebi. The podcast explores the forces that make civilizations strong, the forces that hollow them out, and the serious people working on either side of that line.

- **Domain:** opencivilization.fm
- **Contact:** contact@opencivilization.fm
- **Host social:** [@mehdinayebi](https://x.com/mehdinayebi) (X), [LinkedIn](https://linkedin.com/in/mehdinayebi)

---

## Tech Stack

| Layer        | Choice                                      |
|--------------|---------------------------------------------|
| Markup       | Single HTML file (`public/index.html`)       |
| Styling      | Inline `<style>` block (no external CSS)     |
| JavaScript   | Vanilla JS at bottom of `<body>` (no framework) |
| Fonts        | Google Fonts — Fraunces (serif), IBM Plex Mono |
| Dev server   | `npx serve public -l 3000`                   |
| Build step   | None — static HTML served directly           |
| Package mgr  | npm (package.json present, no lockfile)      |

### npm Scripts

| Script     | Command                                    | Purpose                  |
|------------|--------------------------------------------|--------------------------|
| `dev`      | `npx serve public -l 3000`                 | Local dev server         |
| `start`    | `npx serve public -l 3000`                 | Production-like serve    |
| `validate` | `npx html-validate public/index.html`      | HTML validation          |
| `links`    | `npx linkinator public/index.html --silent` | Broken link checking    |

---

## Git History

| Branch       | Purpose                                         |
|--------------|--------------------------------------------------|
| `master`     | Initial approved design baseline                 |
| `v2-edits`   | Layout, typography, and content restructuring    |
| `v3-edits`   | Motion/animation work (current branch, clean)    |

Tags: `v1`, `v2`

### Commit History (chronological, oldest first)

1. `b31e08a` — Initial site snapshot — approved design, pre-functionality
2. `647fa42` — feat(type): bump font scale across nav, body, ledgers, footer
3. `1aff269` — feat(hero): add promise paragraph and primary/secondary CTAs
4. `bf35d79` — feat(host): asymmetric redesign, huge serif name, remove portrait
5. `6cb5733` — feat(episodes): feature EP 01 as hero block, upcoming divider
6. `331ae93` — feat(footer): editorial colophon with set-in credit
7. `66a090b` — refactor(layout): move doctrine marquee below question section
8. `7f05314` — refactor(question): remove redundant section heading
9. `57150cd` — refactor: delete section II what the show is and is not
10. `6950207` — refactor(host): remove spine of the show line
11. `4825dd5` — refactor(episodes): rename to Episodes, simplify editor note
12. `d647cde` — refactor(footer): remove set-in colophon row
13. `d7f7817` — style(copy): remove em-dashes across the site
14. `afee2c7` — feat(motion): scroll-reveal sections on viewport entry
15. `7640fc3` — feat(motion): stagger doctrine pillars on section entry
16. `53dbe99` — feat(motion): shrink masthead on scroll past hero
17. `136c293` — chore: audit existing animations before v3 work
18. `cd4245d` — fix: remove leftover hero-sub responsive rule and long-form copy
19. `d892534` — fix: update audit comment to reflect removed hero-sub

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
| `--red-ink` | `#7a1a12` | Hover state for red elements, italic emphasis |
| `--rule`    | `#0e0e0e` | Border/rule color (same as ink)        |

### Typography

| Token      | Family                                          | Role             |
|------------|--------------------------------------------------|------------------|
| `--serif`  | Fraunces, Times New Roman, Georgia, serif        | Headings, names, titles, large display text |
| `--mono`   | IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace | Body, labels, buttons, UI text |

**Font features enabled:** `ss01`, `ss02`, `cv01`, `cv02`

**Fraunces variable axis settings:** `"SOFT" 0, "WONK" 1, "opsz" 144`

#### Type Scale (key sizes)

| Element              | Size                          | Weight     |
|----------------------|-------------------------------|------------|
| Hero title           | `clamp(72px, 14vw, 220px)`   | 400 / 300 italic |
| Hero promise         | `clamp(20px, 2.4vw, 28px)`   | 400        |
| Section titles       | `clamp(32px, 4.5vw, 56px)`   | 400        |
| Host name display    | `clamp(72px, 12vw, 180px)`   | 400 / 300 italic |
| Featured ep title    | `clamp(36px, 5vw, 62px)`     | 500        |
| Doctrine names       | `26px`                        | 500        |
| Body text            | `16px–17px`                   | 400        |
| UI labels / tags     | `10px–12px`                   | 500–700    |
| CTA buttons          | `13px`                        | 600–700    |

### Visual Texture

A fixed paper-grain overlay is applied via `body::before` using an inline SVG filter (`feTurbulence` fractal noise), at `opacity: 0.35` with `mix-blend-mode: multiply`. It covers the entire viewport and is non-interactive (`pointer-events: none`).

---

## Site Architecture — Sections

### 1. Masthead Bar

- Sticky top navigation (`position: sticky; top: 0; z-index: 100`)
- Contains: brand name, Roman numeral date (MMXXVI), separator, spacer, 6 anchor links
- Shrinks on scroll (see Animations below)
- Links: Question, Doctrine, Host, Episodes, Guests, Dispatch

### 2. Hero

- Large two-line Fraunces title: "Open" / "Civilization."
- Promise paragraph (serif, max-width 820px)
- Two CTAs: "Listen to EP 01" (red primary) and "Subscribe" (outlined secondary)
- Animated entry (see Animations below)

### 3. § I — The Question (`#question`)

- Single large-format question in Fraunces serif
- Keywords in italic red-ink for emphasis
- Section number label: `§ I / Question`

### 4. Marquee — Doctrine Keywords

- Full-width dark band (`background: var(--ink)`)
- Horizontally scrolling text with 7 doctrine phrases, duplicated for seamless loop
- Red star dividers (`✦`) between phrases
- Infinite linear scroll animation

### 5. § II — Doctrine (`#doctrine`)

- Section header: "The Seven Pillars"
- 7-row table layout with columns: number, name, gloss, tag
- Each row: hover background change, staggered reveal on scroll (see Animations)

**The Seven Pillars:**

| # | Pillar | Gloss | Tag |
|---|--------|-------|-----|
| 01 | Strength over Appeasement | Deterrence, hard power, and the will to defend a free civilization | Power · Will |
| 02 | Truth over Propaganda | Epistemic integrity, media accountability, narrative warfare, and resistance to information capture | Truth · Media |
| 03 | Merit over Mediocrity | Competence, standards, excellence, and institutional seriousness as survival requirements | Standards |
| 04 | Capacity over Drift | State capacity, execution, infrastructure, and the ability to build, maintain, and govern | State · Build |
| 05 | Borders with Legitimacy | Managed migration, civic coherence, democratic consent, and the conditions of durable belonging | Consent |
| 06 | Freedom with Seriousness | Freedom that remains self-respecting, self-defending, and resistant to its own internal hollowing out | Freedom |
| 07 | Renewal through Builders | Founders, scientists, institutions, educators, reformers, and individuals rebuilding what has decayed | Renewal |

### 6. § III — Host (`#host`)

- Large serif name display: "Mehdi" / "Nayebi" (italic)
- Two-column sub-grid: role label + bio paragraphs
- Contact rows: Email, X/Twitter, LinkedIn — each with hover slide and arrow animation

### 7. § IV — Episodes (`#episodes`)

- **Featured block (EP 01):** "What Keeps a Civilization Open?" — large card with title, description, meta (pillars, runtime, season), "Listen Now" CTA
- **Upcoming divider** label
- **6 upcoming episodes** (EP 02–07) in table rows: number, title, pillar tags, status badge

| Episode | Title | Pillars |
|---------|-------|---------|
| EP 01 | What Keeps a Civilization Open? | Strength · Truth · Merit |
| EP 02 | How Civilizations Decay | Capacity · Freedom |
| EP 03 | The Mechanics of Weakness | Strength · Capacity |
| EP 04 | Propaganda Laundering in Open Societies | Truth · Media |
| EP 05 | Iran: A Case Study in Civilizational Capture | Freedom · Borders |
| EP 06 | The Will to Defend | Strength · Freedom |
| EP 07 | The China Question | Capacity · Strength |

- **Schedule note:** "New episodes every week. Full archive available on all major podcast platforms."

### 8. § V — Guests (`#guest`)

- Two-column layout: pitch lede + sticky pitch card
- Left side: long-form guest description, "The Governing Test" blockquote, fine print
- Right side: sticky card with eyebrow, title, body, and mailto CTA button

### 9. § VI — Listen (`#listen`)

- 5-row platform table:
  1. Apple Podcasts → `podcasts.apple.com`
  2. Spotify → `open.spotify.com`
  3. YouTube → `youtube.com/@opencivilization`
  4. RSS Feed → `opencivilization.fm/rss`
  5. Overcast · Pocket Casts · Fountain → via RSS

### 10. § VII — Dispatch (`#dispatch`)

- Dark background section (`background: var(--ink)`)
- Newsletter signup: eyebrow, headline, description paragraph
- Inline email form with submit button
- Footer note: "Weekly · Free · Unsubscribe in one click"

### 11. Footer

- 4-column colophon grid: brand wordmark, about paragraph, navigation links, contact links
- Bottom bar: copyright line (MMXXVI) + email link

---

## Animations & Motion

### Keyframe Animations

| Animation | Target | Duration | Timing | Trigger | Behavior |
|-----------|--------|----------|--------|---------|----------|
| `riseIn` | `.hero-title .line`, `.hero-promise`, `.hero-ctas` | 1s | `cubic-bezier(.2,.7,.2,1)` | Page load | Runs once. Elements start at `opacity: 0; translateY(30px)` and animate to visible/origin. Staggered delays: line 1 at 0.1s, line 2 at 0.25s, promise at 0.45s, CTAs at 0.6s. |
| `pulse` | `.status-dot` | 2.2s | `ease-out` | Page load | Infinite loop. Red dot glows outward via `box-shadow` expansion then fades. |
| `slide` | `.marquee-track` | 45s | `linear` | Page load | Infinite loop. Translates from `0` to `-50%` for seamless horizontal scroll. Content is duplicated so the loop appears continuous. |

### Scroll-Triggered Reveals

| System | CSS Class | JS Mechanism | Threshold | Behavior |
|--------|-----------|-------------|-----------|----------|
| Section reveal | `.reveal` → `.is-visible` | IntersectionObserver | `threshold: 0.15`, `rootMargin: '0px 0px -10% 0px'` | Sections fade in and rise (`opacity 0→1`, `translateY(24px)→0`) over 0.9s. Observer unobserves after triggering (runs once per element). |
| Doctrine stagger | `.doctrine-table` → `.is-revealed` | IntersectionObserver | `threshold: 0.2` | When the doctrine table enters the viewport, all 7 rows animate in with staggered delays (0s, 0.07s, 0.14s ... 0.42s). Each row: `opacity 0→1`, `translateY(20px)→0` over 0.7s. Observer unobserves after triggering. |
| Masthead shrink | `.masthead-bar` → `.is-scrolled` | Scroll listener + `requestAnimationFrame` | Scroll position > hero bottom - 100px | Padding shrinks from `14px 40px` to `10px 40px`, font-size from `12px` to `11px`, border thickens to `2px`. Transition: 0.3s cubic-bezier. Recalculates hero bottom on resize. Uses passive scroll listener. |

### Hover Transitions

| Element | Properties Animated | Duration | Effect |
|---------|---------------------|----------|--------|
| `.mast-link` | `border-color` | 0.15s | Underline appears on hover |
| `.hero-cta.primary` | `background`, `border-color`, `transform` | 0.2s | Darkens red, slides right 4px |
| `.hero-cta.secondary` | `background`, `color`, `transform` | 0.2s | Inverts to dark fill, slides right 4px |
| `.doctrine-row` | `background` | 0.25s | Fades to `--paper-2` |
| `.connect-row` | `background`, `padding` | 0.2s / 0.25s | Background highlight, padding indent; arrow slides right and turns red |
| `.tx-row` | `background`, `padding` | 0.2s / 0.25s | Background highlight, left padding indent |
| `.tx-featured` | `background` | 0.2s | Background darkens to `#e0dac8`; CTA darkens and slides right |
| `.tx-featured-cta` | `background`, `transform` | 0.2s | Darkens red, slides right 4px |
| `.pitch-btn` | `background`, `color` | 0.2s | Switches from ink to red |
| `.platform-row` | `background` | 0.2s | Fades to `--paper-2` |
| `.dispatch-form button` | `background`, `color` | 0.2s | Button becomes red with paper text |
| `.colophon-nav a`, `.colophon-contact a` | `border-color`, `color` | 0.15s | Text turns red, underline appears |
| `.footer-bottom a` | `color`, `border-color` | — | Text turns red, underline appears |

### Accessibility: Reduced Motion

All three animation systems respect `prefers-reduced-motion: reduce`:

- **Masthead shrink:** `transition: none` — state changes are instant
- **Doctrine stagger:** Rows render at full opacity with no transform or transition
- **Scroll reveal:** All `.reveal` elements render at full opacity with no transform or transition
- **Keyframe animations (`riseIn`, `pulse`, `slide`):** Not explicitly disabled via media query (noted as preserved in audit comment)

---

## Interactive Behavior (JavaScript)

### 1. Scroll-Reveal Observer

```
Target: all .reveal elements (6 sections)
API: IntersectionObserver
Threshold: 0.15
Root margin: 0px 0px -10% 0px
Behavior: Adds .is-visible class once, then unobserves
Fallback: If IntersectionObserver is unavailable, all elements get .is-visible immediately
```

### 2. Doctrine Stagger Observer

```
Target: .doctrine-table (single element)
API: IntersectionObserver
Threshold: 0.2
Behavior: Adds .is-revealed class once, then unobserves
Result: 7 child rows animate in with 0.07s stagger between each
```

### 3. Masthead Shrink on Scroll

```
Target: .masthead-bar
Trigger: scroll past hero section bottom - 100px
API: scroll event listener (passive) + requestAnimationFrame
Behavior: Toggles .is-scrolled class
Updates: Recalculates hero bottom on window resize
```

### 4. Newsletter Form Handler

```
Target: .dispatch-form
Trigger: form submit
Behavior: Prevents default submission, changes button text to "Subscribed ✦"
Note: No actual backend integration — purely cosmetic feedback
```

---

## Responsive Breakpoints

### At 1000px and below

| Component | Change |
|-----------|--------|
| Hero | Padding reduced to `70px 24px 50px` |
| Sections | Padding reduced to `60px 24px` |
| Section heads | Single column, reduced gap and margin |
| Doctrine rows | 2-column layout (`60px 1fr`), gloss and tag stack below |
| Host sub-grid | Single column |
| Host name | Clamped smaller (`56px–120px`) |
| Connect rows | 3-column narrower layout |
| Featured episode | Single column, smaller padding |
| Episode rows | 2-column (`60px 1fr`), pillar/status stack below |
| Guest pitch | Single column, pitch card loses sticky |
| Platform rows | 2-column (`30px 1fr`), URL/status stack below |
| Dispatch | Reduced padding, form stacks vertically |
| Footer colophon | 2-column grid |
| Footer bottom | Column layout |
| Masthead | Smaller padding/font, horizontal scroll, spacer hidden |
| Masthead (scrolled) | Even tighter padding (`8px 20px`), `10px` font |

### At 600px and below

| Component | Change |
|-----------|--------|
| Doctrine rows | Narrower number column (`50px`), smaller num/name fonts |
| Connect rows | Single column, arrow hidden |
| Footer colophon | Single column |

---

## UI/UX Testing Checklist

### Functional Tests

- [ ] All 6 masthead anchor links (`#question`, `#doctrine`, `#host`, `#episodes`, `#guest`, `#dispatch`) scroll to correct sections
- [ ] "Listen to EP 01" CTA links to `#episodes`
- [ ] "Subscribe" CTA links to `#listen`
- [ ] Featured episode "Listen Now" link is functional (currently `href="#"`)
- [ ] All upcoming episode row links are functional (currently `href="#"`)
- [ ] Email link (`contact@opencivilization.fm`) opens mailto
- [ ] X/Twitter link opens in new tab with `rel="noopener"`
- [ ] LinkedIn link opens in new tab with `rel="noopener"`
- [ ] Guest pitch mailto link includes subject line pre-fill
- [ ] All 5 platform links open in new tabs with `rel="noopener"`
- [ ] Newsletter form prevents default submission
- [ ] Newsletter form button text changes to "Subscribed ✦" on submit
- [ ] Newsletter form email input has `required` attribute and validates

### Animation Tests

- [ ] Hero title lines animate in with staggered delays on page load
- [ ] Hero promise paragraph fades in after title
- [ ] Hero CTAs fade in last in the sequence
- [ ] Status dot pulses continuously with red glow
- [ ] Marquee scrolls horizontally in an infinite seamless loop
- [ ] Sections fade in and rise when scrolled into viewport (15% threshold)
- [ ] Each section triggers only once (observer unobserves)
- [ ] Doctrine rows stagger in with 0.07s intervals when table enters viewport
- [ ] Masthead shrinks (padding, font, border) after scrolling past hero
- [ ] Masthead restores to full size when scrolling back up above hero
- [ ] Masthead shrink recalculates correctly after window resize

### Hover State Tests

- [ ] Masthead links show underline on hover
- [ ] Primary CTA darkens and slides right on hover
- [ ] Secondary CTA inverts colors and slides right on hover
- [ ] Doctrine rows get subtle background highlight on hover
- [ ] Host connect rows indent with background change, arrow slides right and turns red
- [ ] Episode rows indent with background highlight on hover
- [ ] Featured episode card darkens background, CTA darkens and slides on hover
- [ ] Guest pitch button switches from dark to red on hover
- [ ] Platform rows get background highlight on hover
- [ ] Newsletter submit button turns red on hover
- [ ] Footer navigation and contact links turn red with underline on hover
- [ ] Footer bottom links turn red with underline on hover

### Accessibility Tests

- [ ] `prefers-reduced-motion: reduce` disables masthead transition
- [ ] `prefers-reduced-motion: reduce` disables doctrine stagger (rows visible immediately)
- [ ] `prefers-reduced-motion: reduce` disables scroll-reveal transitions (sections visible immediately)
- [ ] Page has `lang="en"` attribute
- [ ] Viewport meta tag is present and correct
- [ ] Meta description is present and descriptive
- [ ] All external links have `rel="noopener"`
- [ ] Form input has `required` attribute
- [ ] IntersectionObserver fallback works (all reveals shown if API unavailable)

### Responsive Tests

- [ ] At 1000px: layout collapses to mobile-friendly grids
- [ ] At 1000px: masthead scrolls horizontally, spacer hidden
- [ ] At 1000px: doctrine table switches to 2-column stacked layout
- [ ] At 1000px: host section goes single column
- [ ] At 1000px: featured episode stacks vertically
- [ ] At 1000px: guest pitch card loses sticky positioning
- [ ] At 1000px: newsletter form stacks vertically
- [ ] At 1000px: footer colophon goes to 2 columns
- [ ] At 600px: doctrine rows narrow further
- [ ] At 600px: connect rows go single column, arrows hidden
- [ ] At 600px: footer colophon goes to single column
- [ ] No horizontal overflow at any viewport width (`overflow-x: hidden` on body)

### Performance Tests

- [ ] Fonts preconnected to `fonts.googleapis.com` and `fonts.gstatic.com`
- [ ] `font-display: swap` set via Google Fonts URL
- [ ] Scroll listener uses `{ passive: true }` flag
- [ ] Scroll handler throttled via `requestAnimationFrame`
- [ ] `will-change: opacity, transform` set on `.reveal` elements
- [ ] No external JavaScript dependencies
- [ ] No images (all visuals are CSS/SVG-based)
- [ ] Paper grain overlay uses inline SVG data URI (no network request)

### Cross-Browser Tests

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Safari on iOS
- [ ] Chrome on Android
- [ ] IntersectionObserver polyfill/fallback works on older browsers

---

## Known Gaps / Placeholder State

1. **Episode links:** Featured EP 01 and all upcoming episode rows point to `href="#"` — no actual audio or episode pages exist yet
2. **Newsletter backend:** Form submission is cosmetic only — no email collection service is integrated
3. **Platform links:** Apple Podcasts, Spotify, YouTube, and RSS URLs are placeholder paths — may not resolve to real podcast listings yet
4. **No analytics:** No tracking scripts, no event logging
5. **No favicon:** No favicon or social/OG meta tags (beyond basic description)
6. **No sitemap or robots.txt**
7. **Keyframe animations (`riseIn`, `pulse`, `slide`) not disabled under `prefers-reduced-motion`** — only the scroll-triggered and transition-based animations respect the media query
