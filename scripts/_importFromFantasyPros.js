/*
 * One-time import: rebuilds scripts/rawTierList2026.txt from the FantasyPros
 * half-PPR export (FantasyPros/FP0807HPPR.csv), which is the app's default
 * scoring format. Cuts at TIERS <= 11 (377 players), matching the previous
 * board's depth almost exactly.
 *
 * Run: node scripts/_importFromFantasyPros.js
 * This is a throwaway script (prefixed with _), same pattern as _patch_gen.py.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'FantasyPros', 'FP0807HPPR.csv');
const RAW_FILE = path.join(ROOT, 'scripts', 'rawTierList2026.txt');

const TEAM_ALIASES = { JAC: 'JAX' };
const TIER_CUTOFF = 11;

// Parses one CSV line into fields, respecting double-quoted fields (some
// columns in the FantasyPros export are quoted, some aren't).
function parseCsvLine(line) {
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (ch === '"') { inQuotes = false; }
            else { cur += ch; }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            fields.push(cur);
            cur = '';
        } else {
            cur += ch;
        }
    }
    fields.push(cur);
    return fields;
}

function main() {
    const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/).filter(Boolean);
    const [header, ...rows] = lines;
    const cols = parseCsvLine(header);
    const idx = Object.fromEntries(cols.map((c, i) => [c.trim(), i]));

    const out = [
        '# Fantasy Football 2026 default draft board.',
        '# Scoring: Half PPR (app default) — ECR/ADP here are FantasyPros half-PPR',
        '# consensus, cut at their Tier 11 boundary (imported 2026-08-07). Standard,',
        '# PPR and Superflex-PPR rankings are cross-referenced from the other',
        '# FantasyPros/*.csv exports at generation time — see generatePlayerDatabase.js.',
        '# Format:  rank | Player Name (TEAM) | POSITION+RANK | BYE | ECR_VS_ADP',
        '# Tier boundaries are marked with "# Tier N". Blank ECR_VS_ADP means "no ADP data".',
        '# Edit this file and re-run `node scripts/generatePlayerDatabase.js` to regenerate the database.',
        '',
    ];

    let currentTier = null;
    let written = 0;

    for (const line of rows) {
        const f = parseCsvLine(line);
        const rk = parseInt(f[idx['RK']], 10);
        const tier = parseInt(f[idx['TIERS']], 10);
        if (!Number.isFinite(rk) || !Number.isFinite(tier)) continue;
        if (tier > TIER_CUTOFF) break; // rows are rank-ordered, safe to stop

        const name = f[idx['PLAYER NAME']].trim();
        let team = f[idx['TEAM']].trim().toUpperCase();
        team = TEAM_ALIASES[team] || team;
        const pos = f[idx['POS']].trim();
        const bye = f[idx['BYE WEEK']].trim();
        const ecrVsAdp = f[idx['ECR VS. ADP']].trim();

        if (tier !== currentTier) {
            out.push('', `# Tier ${tier}`, '');
            currentTier = tier;
        }

        const byeStr = /^\d+$/.test(bye) ? bye : '';
        const diffStr = (ecrVsAdp === '-' || ecrVsAdp === '') ? '' : ecrVsAdp;
        const diffPart = diffStr !== '' ? ` | ${diffStr}` : ' | ';

        out.push(`${rk} | ${name} (${team}) | ${pos} | ${byeStr}${diffPart}`);
        written++;
    }

    fs.writeFileSync(RAW_FILE, out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n', 'utf8');
    console.log(`Wrote ${written} players (tiers 1-${TIER_CUTOFF}) to ${path.relative(ROOT, RAW_FILE)}`);
}

main();
