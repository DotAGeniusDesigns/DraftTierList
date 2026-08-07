/*
 * Generates src/utils/playerDatabase.js from scripts/rawTierList2026.txt.
 *
 * The raw file is a human-editable list of the default draft board (its ECR/ADP
 * and tiers are half-PPR, the app's default scoring format). This script also
 * cross-references FantasyPros/FP0807{Standard,PPR,SFPPR}.csv — if present — to
 * attach each player's Standard, PPR and Superflex-PPR ECR/ADP under a
 * `rankings` object, so the scoring-format dropdown has real per-format data.
 * Matching is by normalized name (+ team when it disambiguates); a player not
 * found in one of those files falls back to the half-PPR numbers for that
 * format (logged as a warning) rather than being left without a value.
 *
 * Loads headshots from scripts/playerPhotoMap.json (normalized name lookup).
 * Run it with:  node scripts/generatePlayerDatabase.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RAW_FILE = path.join(__dirname, 'rawTierList2026.txt');
const DB_FILE = path.join(ROOT, 'src', 'utils', 'playerDatabase.js');
const PHOTO_MAP_FILE = path.join(__dirname, 'playerPhotoMap.json');
const PHOTO_OVERRIDES_FILE = path.join(__dirname, 'photoOverrides.json');
const FANTASYPROS_DIR = path.join(ROOT, 'FantasyPros');
const FANTASYPROS_FILES = {
    standard: 'FP0807Standard.csv',
    ppr: 'FP0807PPR.csv',
    'superflex-ppr': 'FP0807SFPPR.csv',
};
const TEAM_ALIASES = { JAC: 'JAX' };

const PLACEHOLDER_PHOTO =
    'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg';

// Build a lookup of existing headshots keyed by a normalized player name so we
// can carry photos over from season to season even if ids/suffixes change.
const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/[.'`]/g, '')
        .replace(/-/g, ' ')
        .split(/\s+/)
        .filter((token) => token && !SUFFIXES.has(token))
        .join(' ')
        .trim();
}

function loadPhotoOverrides() {
    if (!fs.existsSync(PHOTO_OVERRIDES_FILE)) return {};
    const raw = JSON.parse(fs.readFileSync(PHOTO_OVERRIDES_FILE, 'utf8'));
    const map = {};
    for (const [key, url] of Object.entries(raw)) {
        if (typeof url === 'string' && url) map[key.toLowerCase()] = url;
    }
    return map;
}

function resolvePhoto(p, photoMap, photoOverrides) {
    // photoOverrides keys are lowercased wholesale (position included) when
    // loaded, so the lookup key must match that case here.
    const overrideKey = `${normalizeName(p.name)}|${p.position.toLowerCase()}`;
    if (photoOverrides[overrideKey]) return photoOverrides[overrideKey];
    return photoMap[normalizeName(p.name)] || null;
}

function loadPhotoMap() {
    if (!fs.existsSync(PHOTO_MAP_FILE)) return {};
    const raw = JSON.parse(fs.readFileSync(PHOTO_MAP_FILE, 'utf8'));
    const map = {};
    for (const [key, url] of Object.entries(raw)) {
        if (typeof url === 'string' && url) map[normalizeName(key)] = url;
    }
    return map;
}

// Same quote-aware split used to import the raw file from FantasyPros CSVs
// in the first place — kept here so re-running this script stays self-contained.
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

// Loads one FantasyPros export into { byNameTeam: Map, byName: Map } of
// { ecr, adp }, keyed by normalizeName() (+ team for disambiguation).
function loadFantasyProsFormat(fileName) {
    const filePath = path.join(FANTASYPROS_DIR, fileName);
    if (!fs.existsSync(filePath)) return null;

    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
    const [header, ...rows] = lines;
    const cols = parseCsvLine(header);
    const idx = Object.fromEntries(cols.map((c, i) => [c.trim(), i]));

    const byNameTeam = new Map();
    const byName = new Map();

    for (const line of rows) {
        const f = parseCsvLine(line);
        const rk = parseInt(f[idx['RK']], 10);
        if (!Number.isFinite(rk)) continue;

        const name = f[idx['PLAYER NAME']].trim();
        let team = f[idx['TEAM']].trim().toUpperCase();
        team = TEAM_ALIASES[team] || team;
        const diffStr = f[idx['ECR VS. ADP']].trim();
        const diff = (diffStr === '-' || diffStr === '') ? null : parseInt(diffStr, 10);
        const entry = { ecr: rk, adp: diff === null || Number.isNaN(diff) ? undefined : rk + diff };

        const key = normalizeName(name);
        byNameTeam.set(`${key}|${team}`, entry);
        // First occurrence wins for the name-only fallback index (rare
        // duplicate names in the same file are not worth disambiguating here).
        if (!byName.has(key)) byName.set(key, entry);
    }

    return { byNameTeam, byName };
}

function loadFantasyProsFormats() {
    const formats = {};
    for (const [formatId, fileName] of Object.entries(FANTASYPROS_FILES)) {
        formats[formatId] = loadFantasyProsFormat(fileName);
    }
    return formats;
}

// Looks up a player's {ecr, adp} in one loaded FantasyPros format, falling
// back from team-qualified match to name-only match.
function lookupFantasyPros(format, name, team) {
    if (!format) return null;
    const key = normalizeName(name);
    return format.byNameTeam.get(`${key}|${team}`) || format.byName.get(key) || null;
}

function slugify(name) {
    return name
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[.'`]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function parseRaw(text) {
    const lines = text.split(/\r?\n/);
    let tier = 1;
    const players = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const tierMatch = line.match(/^#\s*Tier\s+(\d+)/i);
        if (tierMatch) {
            tier = parseInt(tierMatch[1], 10);
            continue;
        }
        if (line.startsWith('#')) continue; // comment / header

        const parts = line.split('|').map((p) => p.trim());
        if (parts.length < 4) {
            throw new Error('Malformed line: ' + rawLine);
        }

        const [rankStr, nameTeam, posRank, byeStr, ecrVsAdpStr] = parts;

        const nameMatch = nameTeam.match(/^(.*?)\s*\(([A-Za-z]{2,3})\)$/);
        if (!nameMatch) throw new Error('Cannot parse name/team: ' + nameTeam);
        const name = nameMatch[1].trim();
        const team = nameMatch[2].toUpperCase();

        const posMatch = posRank.match(/^([A-Za-z]+?)(\d+)$/);
        if (!posMatch) throw new Error('Cannot parse position: ' + posRank);
        const position = posMatch[1].toUpperCase();

        const ecr = parseInt(rankStr, 10);
        const ecrVsAdp =
            ecrVsAdpStr === undefined || ecrVsAdpStr === '' ? null : parseInt(ecrVsAdpStr, 10);

        players.push({ tier, name, team, position, ecr, ecrVsAdp, byeStr });
    }

    return players;
}

function buildRecords(players, photoMap, photoOverrides, fantasyProsFormats) {
    const usedIds = new Set();
    const records = [];
    const fallbackCounts = {};

    for (const p of players) {
        let id;
        if (p.position === 'DST') {
            id = p.team.toLowerCase() + '-dst';
        } else {
            id = slugify(p.name);
            if (usedIds.has(id)) id = id + '-' + p.team.toLowerCase();
        }
        // Final collision guard.
        let unique = id;
        let n = 2;
        while (usedIds.has(unique)) unique = id + '-' + n++;
        usedIds.add(unique);

        // photoExpr is emitted verbatim as JS: a helper call, a variable, or a
        // quoted string literal for a reused headshot.
        let photoExpr;
        if (p.position === 'DST') {
            photoExpr = 'dstLogo(' + JSON.stringify(p.team.toLowerCase()) + ')';
        } else {
            const mapped = resolvePhoto(p, photoMap, photoOverrides);
            photoExpr = mapped ? JSON.stringify(mapped) : 'PLACEHOLDER_PHOTO';
        }

        const record = {
            id: unique,
            name: p.name,
            position: p.position,
            team: p.team,
            photoExpr,
            tier: p.tier,
            ecr: p.ecr,
        };
        // "ECR vs ADP" is the differential between expert rank and average draft
        // position, so ADP = ECR + differential (positive = drafted later/value).
        if (p.ecrVsAdp !== null && !Number.isNaN(p.ecrVsAdp)) {
            record.adp = p.ecr + p.ecrVsAdp;
        }

        // Half-PPR is this raw file's own numbers; the other three formats are
        // cross-referenced from their FantasyPros exports, falling back to the
        // half-PPR values (and counting it) when a player isn't found there.
        record.rankings = {
            'half-ppr': { ecr: record.ecr, ...(record.adp !== undefined ? { adp: record.adp } : {}) },
        };
        for (const formatId of Object.keys(FANTASYPROS_FILES)) {
            const found = lookupFantasyPros(fantasyProsFormats[formatId], p.name, p.team);
            if (found) {
                record.rankings[formatId] = {
                    ecr: found.ecr,
                    ...(found.adp !== undefined ? { adp: found.adp } : {}),
                };
            } else {
                record.rankings[formatId] = { ...record.rankings['half-ppr'] };
                fallbackCounts[formatId] = (fallbackCounts[formatId] || 0) + 1;
                if (fantasyProsFormats[formatId]) {
                    console.warn(`  no ${formatId} match for ${p.name} (${p.team}) — using half-PPR values`);
                }
            }
        }

        records.push(record);
    }

    return { records, fallbackCounts };
}

function serialize(records) {
    let lastTier = null;
    const entries = records
        .map((r) => {
            const prefix = lastTier !== null && r.tier !== lastTier ? '\n' : '';
            lastTier = r.tier;
            const fields = [
                'id: ' + JSON.stringify(r.id),
                'name: ' + JSON.stringify(r.name),
                'position: ' + JSON.stringify(r.position),
                'team: ' + JSON.stringify(r.team),
                'photo: ' + r.photoExpr,
                'tier: ' + r.tier,
                'ecr: ' + r.ecr,
            ];
            if (r.adp !== undefined) fields.push('adp: ' + r.adp);

            const rankingsFields = Object.entries(r.rankings)
                .map(([formatId, { ecr, adp }]) => (
                    JSON.stringify(formatId) + ': { ecr: ' + ecr + (adp !== undefined ? ', adp: ' + adp : '') + ' }'
                ))
                .join(', ');
            fields.push('rankings: { ' + rankingsFields + ' }');

            return prefix + '    ' + JSON.stringify(r.id) + ': { ' + fields.join(', ') + ' },';
        })
        .join('\n');

    // Only declared when actually referenced below — CRA's build fails on an
    // unused const, and a fully-photographed run has nothing to fall back to.
    const usesPlaceholder = records.some((r) => r.photoExpr === 'PLACEHOLDER_PHOTO');

    return (
        '// Auto-generated from scripts/rawTierList2026.txt (2026 season default board).\n' +
        '// Top-level ecr/adp are half-PPR (the app default); `rankings` carries all\n' +
        '// four scoring formats (standard / half-ppr / ppr / superflex-ppr) — see\n' +
        '// src/utils/scoringFormats.js and src/utils/playerData.js#getRankingsForFormat.\n' +
        '// Standard/PPR/Superflex-PPR are cross-referenced from FantasyPros/*.csv at\n' +
        '// generation time (2026-08-07 snapshot); a player missing from one of those\n' +
        '// falls back to half-PPR values for that format.\n' +
        '// To regenerate after editing the raw file, run: node scripts/generatePlayerDatabase.js\n' +
        '// Headshots fall back to initials in the UI when a photo is missing.\n' +
        '\n' +
        (usesPlaceholder
            ? 'const PLACEHOLDER_PHOTO =\n    ' + JSON.stringify(PLACEHOLDER_PHOTO) + ';\n\n'
            : '') +
        'const dstLogo = (team) => `https://a.espncdn.com/i/teamlogos/nfl/500/${team}.png`;\n' +
        '\n' +
        'export const playerDatabase = {\n' +
        entries +
        '\n};\n' +
        '\n' +
        '// Helper function to get all players as an array\n' +
        'export const getAllPlayers = () => {\n' +
        '    return Object.values(playerDatabase);\n' +
        '};\n'
    );
}

function main() {
    const raw = fs.readFileSync(RAW_FILE, 'utf8');
    const photoMap = loadPhotoMap();
    const photoOverrides = loadPhotoOverrides();
    const fantasyProsFormats = loadFantasyProsFormats();
    const players = parseRaw(raw);
    const { records, fallbackCounts } = buildRecords(players, photoMap, photoOverrides, fantasyProsFormats);
    const output = serialize(records);
    fs.writeFileSync(DB_FILE, output, 'utf8');

    const withPhotoCount = records.filter(
        (r) => r.photoExpr !== 'PLACEHOLDER_PHOTO' && r.position !== 'DST'
    ).length;
    const placeholderCount = records.filter(
        (r) => r.photoExpr === 'PLACEHOLDER_PHOTO' && r.position !== 'DST'
    ).length;

    console.log('Players written: ' + records.length);
    console.log('Photos from map: ' + withPhotoCount);
    console.log('Placeholders:    ' + placeholderCount);
    console.log('Tiers:           ' + new Set(records.map((r) => r.tier)).size);
    for (const formatId of Object.keys(FANTASYPROS_FILES)) {
        const source = fantasyProsFormats[formatId] ? 'FantasyPros' : 'MISSING FILE — used half-PPR for all';
        console.log(`${formatId} fallbacks: ${fallbackCounts[formatId] || 0} (source: ${source})`);
    }
}

main();
