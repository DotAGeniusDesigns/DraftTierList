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

Two in-season tools — `/streamers` and `/interesting-players` — are stubbed with
`ComingSoonPage` and intentionally left out of the navbar until they have real data.
They still resolve by URL. Re-add them to `NAV_ROUTES` in `src/utils/routes.js` when ready.

## Tech stack

- **React 18** with functional components and hooks
- **react-router-dom v6** for routing (with redirects for legacy `#hash` URLs)
- **Tailwind CSS** — shared class helpers live in `src/utils/uiTheme.js`
- **matter-js** for the draft lottery physics
- **lz-string** for compressed board export codes and share links
- **localStorage** for all persistence (no backend, no accounts)
- Native HTML5 drag and drop — no DnD library

## Getting started

```bash
npm install
npm start          # dev server on http://localhost:3000
npm run build      # production build into build/
```

Node version is pinned in `.nvmrc` (20).

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
except `/_vercel/*`, which must stay reachable for Web Analytics.

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
