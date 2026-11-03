# Portfolio website: plan

## Goal
A fast, single-page portfolio at **https://architsingh5.github.io** that tells a recruiter or engineer in
under 30 seconds: *backend engineer at Goldman Sachs who builds high-throughput Java/Kafka trade
systems, and also ships real side projects.*

## Audience
1. Recruiters and hiring managers: they skim, so the headline, numbers and a contact link need to be visible right away.
2. Engineers doing a deeper review: they want project depth, the tech stack and links to source.

## Content (from resume, Oct 2026, and public GitHub)
| Section | Content |
|---|---|
| Hero | Name, one-line positioning, location, CTA buttons (Get in touch → contact form, GitHub, LinkedIn) |
| Impact strip | 54% / 64% primary-host load cut · 75% faster dashboards · 7 → 1 day rule changes · 12% runtime cut |
| Follow a trade | Scroll story: one trade moves through the kind of pipeline I build (exchange → 3 striped hosts → Kafka → hydration → OLTP + Snowflake → DB2 controls → reports). Each stage reveals one real achievement |
| Experience | Goldman Sachs SDE1 (Jul 2023 – present), Intern (May – Jul 2022): the resume bullets grouped by theme |
| Projects | **Featured:** Market Data MCP Server, Water Reminder (Android), Fuzzy Traffic Control, MouseTrail. **Earlier work:** CartWeb, Majestic Holidays, Form Buddy, Selfie Hand/Voice, Selenium Collection |
| Problem solving | 1,000+ combined. **LeetCode:** 818 solved (Easy/Medium/Hard split), global rank, badges, solved by language, most-solved topics. Refreshed weekly by a GitHub Action. **GeeksforGeeks:** 213 solved, coding score 649, institute rank 1,002 (static, since GfG has no public API) |
| Skills | Languages, data, messaging, backend, core CS, AI tools |
| Education & achievements | MANIT Bhopal B.Tech CSE (8.08), 1,000+ problems, JEE ranks, C++ workshop for 240 freshmen |
| Certifications | Claude Code 101 (Anthropic), Mastering DS&A using C and C++ (Udemy, Feb 2021), linked to their credential pages |
| Contact | Contact form (Formspree form `xdeeyelp` relays messages, so no email address is published), GitHub, LinkedIn, LeetCode, GeeksforGeeks, X, Instagram |

Left out on purpose: phone number and email address (it's a public page; the form relays messages instead), private repos (realtime-aggregator, etc.).

## Research (Nov 2026)
- Award winners (Bruno Simon, Lusion, Active Theory, Stripe's homepage) share one idea: **the motion explains the work**.
  Stripe animates what happens behind a payment, and neal.fun's Deep Sea uses scrolling to show the descent. Generic effects don't stand out.
- Hiring managers care that the content is clear and the site loads fast. Recruiters spend seconds on it, so the wow
  must land quickly and never slow the page down.
- 2026 platform: scroll-driven animation and view transitions are native. Heavy libraries are optional.
- Decision (chosen by Archit): **"Follow a trade" scroll story, bold but fast**, in vanilla JS with no extra libraries.

## Design
- **Concept: "event stream".** The hero has a live canvas of messages flowing through three
  partitions (orders → executions → clearing), a nod to striping trade flow across three hosts.
  It pauses when `prefers-reduced-motion` is set.
- **Look:** a dark theme (ink background, warm amber accent) by default, plus a light theme with a toggle that follows
  the system setting. Space Grotesk for headings, Inter for body text, JetBrains Mono for numbers and labels.
- **Layout:** one page, sticky nav with section anchors, works from 360 px up.
- **Accessibility:** semantic landmarks, AA contrast in both themes, visible focus, skip link.

## Tech
- Plain HTML + CSS + a small vanilla JS file. No framework and no build step, so GitHub Pages serves the
  repo as it is and there is nothing to break or keep updated.
- `.nojekyll` so Pages serves the files without Jekyll processing.
- SEO: meta description, Open Graph tags, favicon (SVG).

## Deployment
1. Create an **empty public repo named exactly `architsingh5.github.io`** on GitHub (a user-site
   repo is served at the root domain).
2. Push `main`.
3. Repo → Settings → Pages → Source: *Deploy from a branch*, `main` / root (usually the default for user sites).
4. Site is live at https://architsingh5.github.io within a minute or two.

## Later (optional)
- 3D WebGL hero (Three.js), a terminal / ⌘K easter egg, micro-interactions (decoding headings, magnetic buttons).
- Downloadable resume PDF (a copy without the phone number).
- Custom domain (CNAME).
- Blog / write-ups (e.g. how the fuzzy controller compares with a fixed-time one).
