/*
 * Generates src/utils/playerDatabase.js from scripts/rawTierList2026.txt.
 *
 * The raw file is a human-editable list of the default draft board. This script
 * turns each line into a player record, reusing existing player headshots from
 * the previous database whenever a name matches so returning players keep their
 * photos. Run it with:  node scripts/generatePlayerDatabase.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RAW_FILE = path.join(__dirname, 'rawTierList2026.txt');
const DB_FILE = path.join(ROOT, 'src', 'utils', 'playerDatabase.js');

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

function loadExistingPhotos() {
    const photos = {};
    if (!fs.existsSync(DB_FILE)) return photos;
    const text = fs.readFileSync(DB_FILE, 'utf8');
    // Match both quoted ("name":) and unquoted (name:) styles, capturing only
    // photos that are real string literals (placeholders use a variable and are
    // intentionally skipped).
    const re = /(?:"?name"?):\s*"([^"]+)"[\s\S]*?(?:"?photo"?):\s*"([^"]+)"/g;
    let match;
    while ((match = re.exec(text)) !== null) {
        const key = normalizeName(match[1]);
        if (key && !photos[key]) photos[key] = match[2];
    }
    return photos;
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

function buildRecords(players, existingPhotos) {
    const usedIds = new Set();
    const records = [];

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
            const reused = existingPhotos[normalizeName(p.name)];
            photoExpr = reused ? JSON.stringify(reused) : 'PLACEHOLDER_PHOTO';
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
        records.push(record);
    }

    return records;
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
            return prefix + '    ' + JSON.stringify(r.id) + ': { ' + fields.join(', ') + ' },';
        })
        .join('\n');

    return (
        '// Auto-generated from scripts/rawTierList2026.txt (2026 season default board).\n' +
        '// To regenerate after editing the raw file, run: node scripts/generatePlayerDatabase.js\n' +
        '// Headshots fall back to initials in the UI when a photo is missing.\n' +
        '\n' +
        'const PLACEHOLDER_PHOTO =\n' +
        '    ' + JSON.stringify(PLACEHOLDER_PHOTO) + ';\n' +
        '\n' +
        'const dstLogo = (team) => `https://a.espncdn.com/i/teamlogos/nfl/500/${team === "jac" ? "jax" : team}.png`;\n' +
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
    const existingPhotos = loadExistingPhotos();
    const players = parseRaw(raw);
    const records = buildRecords(players, existingPhotos);
    const output = serialize(records);
    fs.writeFileSync(DB_FILE, output, 'utf8');

    const reusedCount = records.filter(
        (r) => r.photoExpr !== 'PLACEHOLDER_PHOTO' && r.position !== 'DST'
    ).length;

    console.log('Players written: ' + records.length);
    console.log('Photos reused:   ' + reusedCount);
    console.log('Tiers:           ' + new Set(records.map((r) => r.tier)).size);
}

main();
