# Fantasy Toolkit

A React app of fantasy football draft-prep tools for the 2026 season, built around a
drag-and-drop tier list draft board. Live at [fantasy-toolkit.com](https://fantasy-toolkit.com).

## Tools

| Route | What it does |
| --- | --- |
| `/draft-board` | Drag-and-drop tier list of ~377 players. Mark picks drafted, flag risky/injured/handcuff, rename tiers, search and jump to a player. |
| `/draft-range` | Given your league size and pick slot, estimates which players are still likely on the board each round, with variance widening by round. |
| `/offseason` | Per-team 2026 offseason breakdowns: coaching changes, additions, departures, rookies, and fantasy-relevant takeaways. |
| `/draft-lottery` | Settles draft order with a physics-driven marble race (matter-js) and exports a shareable branded results card. |
| `/login`, `/signup`, `/forgot-password` | Account access. Optional — every tool above works signed out. |
| `/profile` | Account settings: username, email, password, saved boards, sign out everywhere, delete account. |
| `/privacy`, `/terms` | Privacy Policy and Terms of Service. |

Two in-season tools — `/streamers` and `/interesting-players` — are stubbed with
`ComingSoonPage` and intentionally left out of the navbar until they have real data.
They still resolve by URL. Re-add them to `NAV_ROUTES` in `src/utils/routes.js` when ready.

## Tech stack

- **React 18** with functional components and hooks
- **react-router-dom v6** for routing (with redirects for legacy `#hash` URLs)
- **Tailwind CSS** — shared class helpers live in `src/utils/uiTheme.js`
- **matter-js** for the draft lottery physics
- **lz-string** for compressed board export codes and share links
- **localStorage** as the primary store — the board works signed out and survives connection interruptions after loading
- **Vercel Functions + Neon Postgres** under `/api` for accounts and cloud-saved boards
- **Resend** for transactional password-reset, email-confirmation and recovery messages
- Native HTML5 drag and drop — no DnD library

## Getting started

```bash
npm install
npm start          # frontend only, http://localhost:3000 — no /api
vercel dev         # frontend + API functions together
npm run build      # production build into build/
```

`npm start` is fine for anything that doesn't touch accounts. The `/api` routes
only exist under `vercel dev` (`npm i -g vercel`, then `vercel link` once); with
plain `npm start` the app detects the missing API and hides the account UI
entirely rather than offering a sign-in that cannot work.

Node version is pinned in `.nvmrc` (20).

## Accounts

Optional by design. The draft board, share links and every other tool work
without one; an account only adds boards saved server-side.

**Setup:** copy `.env.example` to `.env.local` and fill in `DATABASE_URL`
(a free [Neon](https://neon.tech) project), `SESSION_SECRET`, and
`RESEND_API_KEY`. Production also requires `EMAIL_FROM` on a verified Resend
domain; set `PUBLIC_SITE_URL` to the canonical site. Set the same variables in
Vercel's project settings. There is no migration step — `server/lib/db.js` creates
its schema on the first request and the DDL is idempotent.

### How it works

- **Sessions** are JWTs in an httpOnly, SameSite=Lax cookie (30 days). There is
  no session table; `users.token_version` is bumped on password change and on
  "sign out everywhere", which invalidates every token issued before that moment.
- **Passwords** are bcrypt at cost 12. Rules live in `server/lib/validate.js`, with
  a browser-side mirror in `src/utils/accountRules.js` — change both together.
- **Password reset** emails a temporary password valid for 60 minutes. It is
  stored in `temp_password_hash`, *alongside* the real password rather than
  replacing it, so spamming the reset form can't lock anyone out. Signing in with
  it burns it, revokes existing sessions and issues a 15-minute reset-only
  session; signing in with the real password clears it.
- **Email changes** are staged until the new address confirms a one-hour link.
  The previous address receives a 24-hour recovery link that restores it,
  revokes sessions and requires a new password.
- **Rate limiting** is a `rate_limits` table, not in-memory counters, because
  each serverless instance would otherwise keep its own useless tally. Sign-in is
  capped per IP *and* per account.
- **Enumeration:** sign-in and password reset return identical responses whether
  or not the account exists.

### Cloud boards

Saved boards reuse the share-link codec from `exportImport.js` rather than a
second format: a row is a few KB instead of a few hundred, and loading one
rebuilds photos, ADP, byes and injuries from the current player database, so a
board saved in July isn't stale in September. Saving is always explicit — there
is no autosave that could quietly overwrite an hour of work.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/signup`, `login`, `logout` · `GET /api/auth/me` | Session lifecycle |
| `POST /api/auth/forgot-password` | Emails a temporary password |
| `POST /api/account/profile`, `confirm-email`, `recover-email`, `password`, `sessions`, `delete` | Account settings |
| `GET/POST /api/boards` · `GET/PUT/DELETE /api/boards/:id` | Saved boards |

## Data model

`src/utils/playerDatabase.js` is the source of truth for the player pool and is
**auto-generated** — don't hand-edit it. Update `scripts/rawTierList2026.txt`, then:

```bash
node scripts/generatePlayerDatabase.js      # rebuild the database
node scripts/buildPhotoMapFromSleeper.js    # refresh headshot lookups
```

`src/utils/playerData.js` derives `initialPlayers` from that database, joining in
bye weeks, O-line ranks, and team logos from `src/utils/teamData.js`.

On every mount, `App.jsx` merges the database into the user's saved board: scouting
fields (team, ADP, ECR, bye, photo) are refreshed from the database, user-controlled
fields (tier, drafted, flags) are preserved, players dropped from the database are
removed, and newly added players are appended. This is what lets a returning user keep
their board across data updates.

Other data lives in `src/utils/offseasonData.js` (team narratives),
`teamData.js` (logos, byes, O-line and defense ranks), and `powerRankings.js`.

## Sharing a board

Two mechanisms, both in `src/utils/exportImport.js`:

- **Share link** — `/draft-board?board=<code>` carries only player IDs, tier order,
  custom tier names, and flags; everything else is rebuilt from the local database, which
  keeps URLs around 4–5KB. Opening one shows a banner offering to adopt the board, and
  backs up the visitor's existing board before replacing it. Never applied silently.
- **Export code** — a larger self-contained blob (`v1.0`) for backup/restore, pasted
  in and out via the Export/Import modal.

## Regenerating brand assets

`public/og-image.png`, `favicon.ico`, and `apple-touch-icon.png` are generated:

```bash
python3 scripts/generateOgAssets.py
```

`public/favicon.svg` is hand-maintained and mirrors `src/components/BrandLogo.jsx`.

## Deployment

Deploys to Vercel via `vercel.json` — SPA rewrites send everything to `index.html`
except `/api/*` (the serverless functions) and `/_vercel/*`, which must stay
reachable for Web Analytics. Both exclusions are load-bearing: dropping `api/`
from that negative lookahead makes every endpoint silently return the HTML shell.

Web Analytics is the `<Analytics />` component from `@vercel/analytics/react`, mounted
inside the router in `src/index.js` so client-side route changes count as pageviews.
Enable **Web Analytics** in the Vercel project settings for it to report. Don't also add
the `/_vercel/insights/script.js` tag to `public/index.html` — that double-counts.

`.npmrc` sets `legacy-peer-deps=true` and must stay committed. `@vercel/analytics`
declares an optional peer on `@sveltejs/kit`, which npm tries to resolve even here;
SvelteKit then wants TypeScript 5 while react-scripts 5 pins TypeScript 4. Without the
flag, `npm install` fails with ERESOLVE — locally and on Vercel's build.

## Safety nets

- `src/components/ErrorBoundary.jsx` catches render errors and offers a "Reset my
  board" escape hatch that clears board localStorage keys but preserves backups.
- `src/utils/backupSystem.js` snapshots the board automatically and before
  destructive actions; restore from the Backups modal.
