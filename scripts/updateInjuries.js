/*
 * Refreshes src/utils/injuryReport.js from ESPN's public NFL injury feed.
 *
 * Run: node scripts/updateInjuries.js [--dry-run] [--verbose]
 *
 * WHY THIS SOURCE
 * ---------------
 * Every "best injury news" site (RotoWire, Sharp Football, FantasyPros, the NFL's
 * own report) publishes HTML meant for human readers — scraping them is brittle
 * and against their terms. Two feeds are machine-readable and free:
 *
 *   Sleeper  /v1/players/nfl  — injury_status + body part, but no description
 *                               and no expected return. 2.5 MB gzipped.
 *   ESPN     /nfl/injuries    — status, body part, a one-line news blurb with
 *                               its reporter credited, AND details.returnDate.
 *                               425 KB gzipped, ~1s, no key required.
 *
 * ESPN is the only free feed carrying both halves of what the board's tooltip
 * needs, so it wins. It is the same undocumented endpoint that backs ESPN's own
 * scoreboard widgets: treat its shape as unstable, which is why parseFeed below
 * validates before anything is written.
 *
 * EFFICIENCY
 * ----------
 * One request per run. The feed sends no ETag (cache-control is max-age=9), so
 * there is nothing to revalidate against — instead the parsed result is compared
 * with the committed report and the file is only rewritten when something
 * actually moved. A run where nothing changed touches no files and prints one
 * line, so this is safe to put on a cron or run before every draft.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(ROOT, 'src', 'utils', 'playerDatabase.js');
const OUT_FILE = path.join(ROOT, 'src', 'utils', 'injuryReport.js');
const FEED_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries';
const FETCH_TIMEOUT_MS = 45000;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const VERBOSE = args.has('--verbose');

// "Active" is ESPN's word for a cleared player it is still tracking — the entry
// carries news but no designation, no body part and no return date. Only the
// designations below mean the player is actually unavailable or in doubt.
const REPORTABLE = new Set(['Questionable', 'Doubtful', 'Out', 'Injured Reserve', 'Suspension']);

// Kept in sync with generatePlayerDatabase.js so both scripts agree on what
// counts as the same human.
const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);
function normalizeName(name) {
    return String(name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[.'`]/g, '')
        .replace(/-/g, ' ')
        .split(/\s+/)
        .filter((token) => token && !SUFFIXES.has(token))
        .join(' ')
        .trim();
}

// ESPN's abbreviation for Washington differs from the board's; everything else
// lines up. Only used to break ties between same-named players.
const TEAM_ALIASES = { WSH: 'WAS', JAC: 'JAX' };
const normalizeTeam = (team) => TEAM_ALIASES[team] || team || '';

// Both the board and the generated report are ES modules in a CommonJS project,
// so they can't be require()d. Evaluating them with their `export` keywords
// stripped is enough — neither file imports anything.
function loadModule(file) {
    if (!fs.existsSync(file)) return null;
    const source = fs.readFileSync(file, 'utf8');
    const names = [...source.matchAll(/^export const (\w+)/gm)].map((m) => m[1]);
    const script = source.replace(/^export /gm, '') + `\nmodule.exports = { ${names.join(', ')} };`;
    const sandbox = { module: { exports: {} } };
    sandbox.exports = sandbox.module.exports;
    vm.runInNewContext(script, sandbox, { filename: file });
    return sandbox.module.exports;
}

function loadBoard() {
    const mod = loadModule(DB_FILE);
    if (!mod || !mod.playerDatabase) throw new Error(`Could not read the board from ${DB_FILE}`);
    return Object.values(mod.playerDatabase);
}

// Name is the only key both sides share. Team is a tiebreaker rather than a
// requirement: a player who changed teams since the board was generated should
// still pick up his injury.
function buildIndex(players) {
    const byName = new Map();
    for (const p of players) {
        const key = normalizeName(p.name);
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key).push(p);
    }
    return byName;
}

function matchPlayer(index, name, team) {
    const candidates = index.get(normalizeName(name));
    if (!candidates || candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    return candidates.find((p) => normalizeTeam(p.team) === normalizeTeam(team)) || null;
}

async function fetchFeed() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(FEED_URL, {
            signal: controller.signal,
            headers: { accept: 'application/json', 'user-agent': 'DraftList/injury-sync' },
        });
        if (!res.ok) throw new Error(`ESPN returned HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

// Trims the news blurb to something that reads in a tooltip without becoming a
// wall of text, cutting on a sentence boundary where one is available.
function briefly(text, max = 220) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max);
    const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
    return (stop > max * 0.5 ? cut.slice(0, stop + 1) : cut.trimEnd() + '…');
}

// ESPN's designations are roster jargon; the board says them in full.
const DESIGNATION_LABELS = {
    QUESTIONABLE: 'Questionable',
    DOUBTFUL: 'Doubtful',
    OUT: 'Out',
    IR: 'Injured reserve',
    'PUP-P': 'On PUP (preseason)',
    'PUP-R': 'On PUP (reserve)',
    'NFI-A': 'Non-football injury (active)',
    'NFI-R': 'Non-football injury (reserve)',
    'RESERVE-SUS': 'Suspended',
};

// Turns ESPN's details block into a body part a human would say out loud.
// ESPN splits the ligament off with a dash and keeps it capitalised, so
// { type: 'Knee - ACL', detail: 'Surgery', side: 'Left' } -> "Left knee (ACL, surgery)".
function bodyPart(details) {
    const raw = details.type && details.type !== 'Undisclosed' ? details.type : '';
    if (!raw) return '';
    const [type, qualifier] = raw.split(/\s+-\s+/);
    const side = details.side && details.side !== 'Not Specified' ? details.side : '';
    const detail = details.detail && details.detail !== 'Not Specified' ? details.detail : '';

    const base = side ? `${side} ${type.toLowerCase()}` : type;
    // Acronyms (ACL, MCL) keep their case; ordinary words like "Surgery" read
    // better lowercased inside the parenthetical.
    const notes = [qualifier, detail]
        .filter(Boolean)
        .map((n) => (n === n.toUpperCase() ? n : n.toLowerCase()));
    return notes.length ? `${base} (${notes.join(', ')})` : base;
}

function parseFeed(feed, index) {
    if (!feed || !Array.isArray(feed.injuries)) {
        throw new Error('Unexpected feed shape: no injuries array');
    }
    const report = {};
    let scanned = 0;
    const unmatched = [];

    for (const team of feed.injuries) {
        for (const entry of team.injuries || []) {
            scanned++;
            if (!REPORTABLE.has(entry.status)) continue;
            const athlete = entry.athlete || {};
            const espnTeam = (athlete.team || {}).abbreviation || '';
            const player = matchPlayer(index, athlete.displayName, espnTeam);
            if (!player) {
                unmatched.push(`${athlete.displayName} (${espnTeam})`);
                continue;
            }
            const details = entry.details || {};
            // Later news wins if ESPN ever lists a player twice.
            const existing = report[player.id];
            if (existing && existing.newsDate > (entry.date || '')) continue;
            const designation = (details.fantasyStatus || {}).abbreviation || '';
            report[player.id] = {
                name: player.name,
                status: entry.status,
                // What the badge says. Falls back to ESPN's own status wording
                // if they ever add a designation this script hasn't seen.
                label: DESIGNATION_LABELS[designation] || entry.status,
                designation: designation || entry.status,
                bodyPart: bodyPart(details),
                returnDate: details.returnDate || '',
                description: briefly(entry.shortComment),
                newsDate: entry.date || '',
            };
        }
    }
    if (scanned === 0) throw new Error('Feed carried no injury entries at all — refusing to wipe the report');
    return { report, scanned, unmatched };
}

// Ordering the file by player name keeps the git diff between runs readable —
// a status change shows up as one changed line rather than a reshuffle.
function serialize(report, fetchedAt) {
    const ids = Object.keys(report).sort((a, b) => report[a].name.localeCompare(report[b].name));
    const body = ids
        .map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(report[id])},`)
        .join('\n');
    return `// Auto-generated by scripts/updateInjuries.js — do not edit by hand.
// Source: ESPN public NFL injury feed, read ${fetchedAt}.
// Refresh with: node scripts/updateInjuries.js
//
// Keyed by player id, covering only players on the board who carry a real
// designation (Questionable / Doubtful / Out / IR / Suspension). returnDate is
// ESPN's estimate and is an ISO date; season-ending injuries come back as a
// date in the next calendar year.

export const INJURY_REPORT_UPDATED_AT = ${JSON.stringify(fetchedAt)};

export const injuryReport = {
${body}
};

export const getInjury = (playerId) => injuryReport[playerId] || null;
`;
}

function diff(before, after) {
    const added = [];
    const changed = [];
    const cleared = [];
    for (const [id, next] of Object.entries(after)) {
        const prev = before[id];
        if (!prev) {
            added.push(`${next.name} — ${next.designation}${next.bodyPart ? ` (${next.bodyPart})` : ''}`);
        } else if (prev.status !== next.status || prev.returnDate !== next.returnDate || prev.description !== next.description) {
            changed.push(`${next.name} — ${prev.status} → ${next.status}`);
        }
    }
    for (const [id, prev] of Object.entries(before)) {
        if (!after[id]) cleared.push(prev.name);
    }
    return { added, changed, cleared };
}

async function main() {
    const board = loadBoard();
    const index = buildIndex(board);

    const started = Date.now();
    let feed;
    try {
        feed = await fetchFeed();
    } catch (err) {
        console.error(`Could not reach the ESPN injury feed: ${err.message}`);
        console.error('The committed report was left untouched.');
        process.exit(1);
    }

    const { report, scanned, unmatched } = parseFeed(feed, index);
    const fetchedAt = feed.timestamp || new Date().toISOString();
    const previous = (loadModule(OUT_FILE) || {}).injuryReport || {};
    const { added, changed, cleared } = diff(previous, report);

    const count = Object.keys(report).length;
    console.log(
        `Read ${scanned} ESPN entries in ${((Date.now() - started) / 1000).toFixed(1)}s ` +
        `→ ${count} injured players on the ${board.length}-player board.`
    );

    if (!added.length && !changed.length && !cleared.length) {
        console.log('No change since the last run — nothing written.');
        if (VERBOSE) console.log(`Feed timestamp: ${fetchedAt}`);
        return;
    }

    added.forEach((line) => console.log(`  + ${line}`));
    changed.forEach((line) => console.log(`  ~ ${line}`));
    cleared.forEach((line) => console.log(`  - ${line} (cleared)`));

    if (DRY_RUN) {
        console.log(`\nDry run — ${OUT_FILE} not written.`);
        return;
    }
    fs.writeFileSync(OUT_FILE, serialize(report, fetchedAt));
    console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)} (${added.length} new, ${changed.length} updated, ${cleared.length} cleared).`);

    if (VERBOSE && unmatched.length) {
        console.log(`\n${unmatched.length} injured players are not on the board (ignored):`);
        unmatched.forEach((name) => console.log(`  · ${name}`));
    }
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
