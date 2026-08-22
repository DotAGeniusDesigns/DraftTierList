#!/usr/bin/env node
/*
 * Refresh half-PPR ECR/ADP in scripts/rawTierList2026.txt from a tab-separated
 * rankings file (rank, "Name (TEAM)", ADP-minus-ECR diff or "-" for no ADP).
 *
 * Usage: node scripts/updateHalfPprRankings.js [path-to-rankings.txt]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RAW_FILE = path.join(__dirname, 'rawTierList2026.txt');
const INPUT = process.argv[2] || path.join(__dirname, 'halfPprRankings2026-08-22.txt');

const TEAM_ALIASES = { JAC: 'JAX' };
// Default board tier sizes: 12 (×2), 20 (×4), 36 (×4), then remainder in tier 11.
// Ranks: 1–12, 13–24, 25–44, 45–64, 65–84, 85–104, 105–140, 141–176, 177–212, 213–248, 249+
const TIER_STARTS = [1, 13, 25, 45, 65, 85, 105, 141, 177, 213, 249];

const NEW_PLAYER_META = {
    'oscar delp|NO': { name: 'Oscar Delp', position: 'TE' },
    'eli stowers|PHI': { name: 'Eli Stowers', position: 'TE' },
    'elic ayomanor|TEN': { name: 'Elic Ayomanor', position: 'WR' },
    'malik davis|DAL': { name: 'Malik Davis', position: 'RB' },
    'phil mafah|DAL': { name: 'Phil Mafah', position: 'RB' },
    'malik benson|LV': { name: 'Malik Benson', position: 'WR' },
    'kevin coleman jr.|MIA': { name: 'Kevin Coleman Jr.', position: 'WR' },
    'zavion thomas|CHI': { name: 'Zavion Thomas', position: 'WR' },
    'joe milton iii|DAL': { name: 'Joe Milton III', position: 'QB' },
    'trey smack|GB': { name: 'Trey Smack', position: 'K' },
    'nick westbrook-ikhine|IND': { name: 'Nick Westbrook-Ikhine', position: 'WR' },
    'jordan whittington|LAR': { name: 'Jordan Whittington', position: 'WR' },
    'jam miller|NE': { name: 'Jam Miller', position: 'RB' },
    'zane gonzalez|FA': { name: 'Zane Gonzalez', position: 'K' },
    'darren waller|CAR': { name: 'Darren Waller', position: 'TE' },
    'charlie kolar|LAC': { name: 'Charlie Kolar', position: 'TE' },
    'tyler bass|BUF': { name: 'Tyler Bass', position: 'K' },
    'new york giants|NYG': { name: 'New York Giants', position: 'DST' },
    'roman wilson|PIT': { name: 'Roman Wilson', position: 'WR' },
    'tampa bay buccaneers|TB': { name: 'Tampa Bay Buccaneers', position: 'DST' },
    'kavontae turpin|DAL': { name: 'KaVontae Turpin', position: 'WR' },
    'cincinnati bengals|CIN': { name: 'Cincinnati Bengals', position: 'DST' },
    'joe flacco|CIN': { name: 'Joe Flacco', position: 'QB' },
    'tommy tremble|CAR': { name: 'Tommy Tremble', position: 'TE' },
    'austin ekeler|FA': { name: 'Austin Ekeler', position: 'RB' },
    'cj daniels|LAR': { name: 'CJ Daniels', position: 'WR' },
    'roschon johnson|CHI': { name: 'Roschon Johnson', position: 'RB' },
    'demarcus robinson|SF': { name: 'Demarcus Robinson', position: 'WR' },
};

const DST_NAME_HINTS = [
    'texans', 'broncos', 'seahawks', 'rams', 'eagles', 'jaguars', 'patriots',
    'steelers', 'chargers', 'vikings', 'ravens', 'chiefs', 'packers', 'lions',
    'bills', 'browns', 'falcons', '49ers', 'saints', 'colts', 'bears',
    'panthers', 'cowboys', 'giants', 'buccaneers', 'bengals',
];

const BYE = {
    ARI: 14, ATL: 11, BAL: 13, BUF: 7, CAR: 5, CHI: 10, CIN: 6,
    CLE: 11, DAL: 14, DEN: 10, DET: 6, GB: 11, HOU: 8, IND: 13,
    JAX: 7, KC: 5, LAR: 11, LAC: 7, LV: 13, MIA: 6, MIN: 6,
    NE: 11, NO: 8, NYG: 8, NYJ: 13, PHI: 10, PIT: 9, SF: 8,
    SEA: 11, TB: 10, TEN: 9, WAS: 7, FA: null,
};

function normName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function canonTeam(team) {
    const t = team.toUpperCase();
    return TEAM_ALIASES[t] || t;
}

function tierForRank(rank) {
    let tier = 1;
    for (let i = 0; i < TIER_STARTS.length; i++) {
        if (rank >= TIER_STARTS[i]) tier = i + 1;
    }
    return tier;
}

function loadExistingMeta() {
    const meta = new Map();
    const text = fs.readFileSync(RAW_FILE, 'utf8');
    for (const line of text.split(/\r?\n/)) {
        const s = line.trim();
        if (!s || s.startsWith('#')) continue;
        const parts = s.split('|').map((p) => p.trim());
        const m = parts[1].match(/^(.*?)\s*\(([A-Za-z]{2,3})\)$/);
        if (!m) continue;
        const name = m[1].trim();
        const team = canonTeam(m[2]);
        const posMatch = parts[2].match(/^([A-Za-z]+)/);
        const entry = { name, team, position: posMatch[1].toUpperCase() };
        meta.set(`${normName(name)}|${team}`, entry);
        if (!meta.has(`${normName(name)}|*`)) meta.set(`${normName(name)}|*`, entry);
    }
    return meta;
}

function parseInput(text) {
    const rows = [];
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        const parts = line.split('\t');
        if (parts.length < 3) throw new Error(`Bad line: ${line}`);
        const rank = parseInt(parts[0], 10);
        const nameTeam = parts[1].trim();
        const diffRaw = parts[2].trim();
        const m = nameTeam.match(/^(.+?)\s*\(([A-Za-z]{2,3})\)\s*$/);
        if (!m) throw new Error(`Cannot parse: ${nameTeam}`);
        rows.push({
            rank,
            rawName: m[1].trim(),
            team: canonTeam(m[2]),
            userDiff: diffRaw === '-' || diffRaw === '' ? null : parseInt(diffRaw, 10),
        });
    }
    return rows;
}

// ADP = ECR + (ADP − ECR diff from the input file).

function formatDiff(_ecr, adpMinusEcr) {
    if (adpMinusEcr === null || Number.isNaN(adpMinusEcr)) return '';
    if (adpMinusEcr === 0) return '0';
    return adpMinusEcr > 0 ? `+${adpMinusEcr}` : `${adpMinusEcr}`;
}

function resolveMeta(meta, rawName, team) {
    const key = `${normName(rawName)}|${team}`;
    if (NEW_PLAYER_META[key]) return NEW_PLAYER_META[key];
    if (meta.has(key)) {
        const e = meta.get(key);
        return { name: e.name, position: e.position };
    }
    const byName = meta.get(`${normName(rawName)}|*`);
    if (byName) return { name: rawName, position: byName.position };
    const lower = normName(rawName);
    if (DST_NAME_HINTS.some((hint) => lower.includes(hint))) {
        return { name: rawName, position: 'DST' };
    }
    return null;
}

function main() {
    const meta = loadExistingMeta();
    const rows = parseInput(fs.readFileSync(INPUT, 'utf8'));
    const posCounts = {};
    const lines = [
        '# Fantasy Football 2026 default draft board.',
        '# Scoring: Half PPR (app default) — ECR/ADP here are half-PPR consensus.',
        '# Format:  rank | Player Name (TEAM) | POSITION+RANK | BYE | ECR_VS_ADP',
        '# Tier boundaries are marked with "# Tier N". Blank ECR_VS_ADP means "no ADP data".',
        '# Edit this file and re-run `node scripts/generatePlayerDatabase.js` to regenerate the database.',
        '',
    ];

    let currentTier = null;
    const missing = [];

    for (const row of rows) {
        const resolved = resolveMeta(meta, row.rawName, row.team);
        if (!resolved) {
            missing.push(`${row.rank}. ${row.rawName} (${row.team})`);
            continue;
        }

        const { name, position } = resolved;
        posCounts[position] = (posCounts[position] || 0) + 1;
        const posRank = `${position}${posCounts[position]}`;
        const bye = BYE[row.team];
        const byeStr = bye == null ? '' : String(bye);
        const diff = formatDiff(row.rank, row.userDiff);
        const tier = tierForRank(row.rank);

        if (tier !== currentTier) {
            lines.push('', `# Tier ${tier}`, '');
            currentTier = tier;
        }

        lines.push(`${row.rank} | ${name} (${row.team}) | ${posRank} | ${byeStr} | ${diff}`.replace(/ \| $/, ' | '));
    }

    if (missing.length) {
        console.error('Missing metadata for:');
        missing.forEach((m) => console.error('  ' + m));
        process.exit(1);
    }

    fs.writeFileSync(RAW_FILE, lines.join('\n').replace(/\n+$/, '\n'), 'utf8');
    console.log(`Wrote ${rows.length} players to ${RAW_FILE}`);
}

main();
