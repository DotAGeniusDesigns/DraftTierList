/*
 * Builds src/utils/playerStats.js — historical NFL / fantasy production for
 * every player on the board.
 *
 * Run: node scripts/updateStats.js [--dry-run] [--verbose] [--from=2015]
 *                                  [--no-advanced] [--refresh]
 *
 * WHY THESE SOURCES
 * -----------------
 * Two free, machine-readable feeds cover what a draft kit needs, and they are
 * complementary:
 *
 *   Sleeper  /v1/stats/nfl/regular/{season}
 *       Season totals keyed by Sleeper player id — the SAME id already embedded
 *       in playerDatabase photo URLs, so the join is exact rather than fuzzy.
 *       Carries fantasy points pre-scored in all three formats the board uses
 *       (pts_std / pts_half_ppr / pts_ppr) plus opportunity stats that matter
 *       more than raw yardage: rec_tgt, rec_rz_tgt, rush_rz_att, off_snp and
 *       tm_off_snp. Data runs back to 2009; coverage is thin before ~2015
 *       (458 players scored in 2009 vs ~1,350 from 2015 on).
 *
 *   nflverse stats_player_week_{season}.csv
 *       Adds the market-share and efficiency metrics Sleeper has no equivalent
 *       for — target_share, air_yards_share, wopr, racr and EPA — plus the
 *       per-season team, which Sleeper's season endpoint omits entirely.
 *       Weekly rows only (there is no season-level asset in that release), so
 *       they are aggregated here. ~8MB per season, hence the disk cache.
 *
 * Neither feed requires a key. Both are cached under .cache/nflstats/ so a
 * rerun costs nothing; pass --refresh to force a re-download.
 *
 * MATCHING
 * --------
 * Name matching alone is unsafe — Sleeper carries two "Josh Allen" records and
 * the retired guard sorts first. Players are resolved in priority order:
 *   1. Sleeper id parsed straight out of the photo URL   (exact)
 *   2. DST -> Sleeper's team-abbreviation id             (exact)
 *   3. ESPN id from the photo URL -> Sleeper espn_id     (exact, ~55% populated)
 *   4. normalized name + position, active players first  (fuzzy, last resort)
 * Anything still unresolved is listed at the end of the run so it can be added
 * to SLEEPER_ID_OVERRIDES rather than silently shipping a player with no stats.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(ROOT, 'src', 'utils', 'playerDatabase.js');
const OUT_FILE = path.join(ROOT, 'src', 'utils', 'playerStats.js');
const CACHE_DIR = path.join(ROOT, '.cache', 'nflstats');

const SLEEPER_PLAYERS_URL = 'https://api.sleeper.app/v1/players/nfl';
const SLEEPER_STATS_URL = (season) => `https://api.sleeper.app/v1/stats/nfl/regular/${season}`;
const NFLVERSE_WEEK_URL = (season) =>
    `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${season}.csv`;
// Draft capital is the only usable signal for a player with no NFL snaps yet —
// it predicts rookie fantasy PPG at R^2 0.34-0.46 depending on position.
const NFLVERSE_DRAFT_URL =
    'https://github.com/nflverse/nflverse-data/releases/download/draft_picks/draft_picks.csv';
// NGS rushing yards over expected per attempt — the one RB card driver that
// isn't a Sleeper or stats_player_week field. One file, every season, with a
// season-level row per player (week 0) already aggregated; nflverse only
// publishes this one pre-gzipped with no plain-.csv sibling, hence
// cachedPreGzipped below instead of the usual cached().
const NFLVERSE_NGS_RUSHING_URL =
    'https://github.com/nflverse/nflverse-data/releases/download/nextgen_stats/ngs_rushing.csv.gz';
// NGS yards-after-catch over expectation — the TE card's fourth driver. Same
// release and same shape as the rushing file above (one file, all seasons,
// season-level rows at week 0, pre-gzipped only).
const NFLVERSE_NGS_RECEIVING_URL =
    'https://github.com/nflverse/nflverse-data/releases/download/nextgen_stats/ngs_receiving.csv.gz';

const FETCH_TIMEOUT_MS = 120000;

// Sleeper's earliest season with usable fantasy scoring, and the last completed
// one. The NFL season starts in September, so before then the current calendar
// year has no regular-season stats to read.
const EARLIEST_SEASON = 2009;
const now = new Date();
const LATEST_SEASON = now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;

// Advanced metrics are only fetched from this season on by default: target_share
// and EPA exist earlier, but 8MB/season of weekly rows for players who retired a
// decade ago is a poor trade. Override with --from=.
const DEFAULT_ADVANCED_FROM = 2015;

// RACR is only a meaningful efficiency signal for players targeted downfield.
const RACR_POSITIONS = new Set(['WR', 'TE']);
const RACR_MIN_AIR_YARDS = 50;

// Board players Sleeper cannot resolve automatically. id -> Sleeper player id.
// Both entries here are nickname cases: the board uses the name the player is
// listed under everywhere else in fantasy, Sleeper uses the legal one, so the
// name guard in buildResolver correctly refuses to trust the automatic match.
const SLEEPER_ID_OVERRIDES = {
    'hollywood-brown': '5848', // Marquise "Hollywood" Brown, WR
    'bam-knight': '8122',      // Zonovan "Bam" Knight, RB
};

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const flagValue = (name) => {
    const hit = args.find((a) => a.startsWith(`${name}=`));
    return hit ? hit.slice(name.length + 1) : null;
};

const DRY_RUN = hasFlag('--dry-run');
const VERBOSE = hasFlag('--verbose');
const REFRESH = hasFlag('--refresh');
const WITH_ADVANCED = !hasFlag('--no-advanced');
const ADVANCED_FROM = Number(flagValue('--from')) || DEFAULT_ADVANCED_FROM;

const log = (...m) => console.log(...m);
const vlog = (...m) => { if (VERBOSE) console.log(...m); };

/* ---------------------------------------------------------------- utilities */

// Reads an ES-module source file from src/utils without a bundler, the same way
// updateInjuries.js and updateOffseason.js do.
function loadModule(file) {
    if (!fs.existsSync(file)) return null;
    const source = fs.readFileSync(file, 'utf8');
    const names = [...source.matchAll(/^export const (\w+)/gm)].map((m) => m[1]);
    const script = source.replace(/^export /gm, '') + `\nmodule.exports = { ${names.join(', ')} };`;
    const sandbox = { module: { exports: {} } };
    vm.createContext(sandbox);
    new vm.Script(script).runInContext(sandbox);
    return sandbox.module.exports;
}

async function fetchWithTimeout(url, asBuffer = false) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
        return asBuffer ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } finally {
        clearTimeout(timer);
    }
}

// Downloads through a gzip-on-disk cache. Feeds this large are slow enough that
// re-fetching them on every tweak of the emit step is the main cost of a rerun.
async function cached(name, url, asBuffer = false) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const file = path.join(CACHE_DIR, `${name}.gz`);
    if (!REFRESH && fs.existsSync(file)) {
        vlog(`  cache hit  ${name}`);
        const buf = zlib.gunzipSync(fs.readFileSync(file));
        return asBuffer ? buf : buf.toString('utf8');
    }
    vlog(`  fetching   ${name}`);
    const body = await fetchWithTimeout(url, asBuffer);
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
    fs.writeFileSync(file, zlib.gzipSync(buf));
    return asBuffer ? buf : buf.toString('utf8');
}

// Same on-disk cache as cached(), for the one feed whose only asset is already
// gzip-compressed at the source (no plain .csv sibling): decompresses once on
// fetch so the cache file stays single-gzipped like every other entry here,
// instead of gzip-on-top-of-gzip.
async function cachedPreGzipped(name, url) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const file = path.join(CACHE_DIR, `${name}.gz`);
    if (!REFRESH && fs.existsSync(file)) {
        vlog(`  cache hit  ${name}`);
        return zlib.gunzipSync(fs.readFileSync(file)).toString('utf8');
    }
    vlog(`  fetching   ${name}`);
    const gz = await fetchWithTimeout(url, true);
    const text = zlib.gunzipSync(gz).toString('utf8');
    fs.writeFileSync(file, zlib.gzipSync(Buffer.from(text, 'utf8')));
    return text;
}

// Age on Sept 1 of a given season — the reference date the projection model was
// fitted against. Returns undefined when Sleeper has no birth date on file.
const ageOn = (birthDate, season) => {
    if (!birthDate) return undefined;
    const born = new Date(`${birthDate}T00:00:00Z`);
    if (Number.isNaN(born.getTime())) return undefined;
    const ref = Date.UTC(season, 8, 1);
    return round((ref - born.getTime()) / (365.25 * 24 * 3600 * 1000), 1);
};

const NAME_SUFFIXES = /\b(jr|sr|ii|iii|iv|v)\b/g;
// Mirrors the shape of Sleeper's own search_full_name ("Ja'Marr Chase" ->
// "jamarrchase") so both sides of a fuzzy match normalize identically.
const normalizeName = (name, dropSuffix = true) => {
    let s = String(name || '').toLowerCase().replace(/[.'’]/g, '');
    s = s.replace(/[^a-z0-9\s-]/g, ' ');
    if (dropSuffix) s = s.replace(NAME_SUFFIXES, ' ');
    return s.replace(/[\s-]+/g, '');
};

const round = (n, places = 3) => {
    if (n === null || n === undefined || !Number.isFinite(n)) return undefined;
    const f = 10 ** places;
    return Math.round(n * f) / f;
};

// Sleeper reports every counting stat as a float. Drop zeros and nulls so the
// emitted module carries only what a player actually did.
const num = (v) => {
    if (v === null || v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) return undefined;
    return round(n, 2);
};

// Strips undefined values, then the object itself if nothing survived.
const compact = (obj) => {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            const inner = compact(v);
            if (inner) out[k] = inner;
            continue;
        }
        out[k] = v;
    }
    return Object.keys(out).length ? out : undefined;
};

/* ---------------------------------------------------------------- csv parse */

// Minimal RFC4180 reader — enough for nflverse exports, which quote any field
// containing a comma (player names such as "Smith, Jr.") and use \n line ends.
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const c = text[i];
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
            } else field += c;
            continue;
        }
        if (c === '"') { quoted = true; continue; }
        if (c === ',') { row.push(field); field = ''; continue; }
        if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
        if (c === '\r') continue;
        field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    const header = rows[0];
    return rows.slice(1)
        .filter((r) => r.length === header.length)
        .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const csvNum = (v) => {
    if (v === undefined || v === '' || v === 'NA') return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

/* ------------------------------------------------------------- id resolution */

function buildResolver(sleeperPlayers) {
    const byEspnId = new Map();
    const byNamePos = new Map();

    const push = (map, key, value) => {
        if (!key) return;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(value);
    };

    for (const [id, p] of Object.entries(sleeperPlayers)) {
        if (p.espn_id) push(byEspnId, String(p.espn_id), id);
        const pos = p.position || '';
        for (const nameKey of new Set([
            p.search_full_name,
            normalizeName(p.full_name),
            normalizeName(p.full_name, false),
        ].filter(Boolean))) {
            push(byNamePos, `${nameKey}|${pos}`, id);
        }
    }

    // Prefers a currently-active player, then the most experienced — this is
    // what separates QB Josh Allen (4984) from the retired guard (2212).
    const best = (ids) => {
        if (!ids || !ids.length) return null;
        const sorted = [...ids].sort((a, b) => {
            const pa = sleeperPlayers[a];
            const pb = sleeperPlayers[b];
            const activeDelta = Number(Boolean(pb.active)) - Number(Boolean(pa.active));
            if (activeDelta) return activeDelta;
            const teamDelta = Number(Boolean(pb.team)) - Number(Boolean(pa.team));
            if (teamDelta) return teamDelta;
            return (pb.years_exp || 0) - (pa.years_exp || 0);
        });
        return sorted[0];
    };

    // A candidate is only accepted when BOTH the position and the normalized name
    // line up. This is not paranoia: several photo URLs in playerDatabase carry
    // an ESPN id belonging to a different player of the same name (Kenneth
    // Walker III points at a retired WR, Kaleb Johnson at a retired guard).
    // Without this guard those resolve to a real-but-wrong Sleeper record and
    // ship someone else's career as if it were theirs.
    const agrees = (sleeperId, player) => {
        const sp = sleeperPlayers[sleeperId];
        if (!sp) return false;
        const positions = new Set([sp.position, ...(sp.fantasy_positions || [])].filter(Boolean));
        if (!positions.has(player.position)) return false;
        return normalizeName(sp.full_name) === normalizeName(player.name);
    };

    return (player, onReject) => {
        if (SLEEPER_ID_OVERRIDES[player.id]) {
            return { sleeperId: SLEEPER_ID_OVERRIDES[player.id], how: 'override' };
        }
        // Team defenses are keyed by bare team abbreviation in both feeds.
        if (player.position === 'DST') {
            return { sleeperId: String(player.team || '').toUpperCase(), how: 'dst' };
        }

        const photo = player.photo || '';
        const candidates = [];
        const sleeperPhoto = photo.match(/sleepercdn\.com\/content\/nfl\/players\/(?:thumb\/)?(\d+)/);
        if (sleeperPhoto) candidates.push(['photo', sleeperPhoto[1]]);

        const espnPhoto = photo.match(/espncdn\.com\/i\/headshots\/nfl\/players\/full\/(\d+)/);
        if (espnPhoto) {
            const hit = best(byEspnId.get(espnPhoto[1]));
            if (hit) candidates.push(['espn', hit]);
        }
        for (const key of [
            `${normalizeName(player.name)}|${player.position}`,
            `${normalizeName(player.name, false)}|${player.position}`,
        ]) {
            const hit = best(byNamePos.get(key));
            if (hit) candidates.push(['name', hit]);
        }

        for (const [how, sleeperId] of candidates) {
            if (agrees(sleeperId, player)) return { sleeperId, how };
            const sp = sleeperPlayers[sleeperId];
            onReject?.({
                player,
                how,
                sleeperId,
                sawName: sp?.full_name,
                sawPosition: sp?.position,
            });
        }
        return { sleeperId: null, how: 'unmatched' };
    };
}

/* ------------------------------------------------------------ season shaping */

// Curated projection of Sleeper's ~60 season fields. Everything kept here is
// either scoring output or an opportunity/efficiency input a draft model would
// actually use; snap counts, red-zone looks and targets survive, box-score trivia
// (longest run, 40+ yard TDs, IDP) does not.
function shapeSleeperSeason(season, raw) {
    const gp = num(raw.gp);
    const perGame = (total) => (gp && Number.isFinite(total) ? round(total / gp, 2) : undefined);

    const ptsStd = num(raw.pts_std);
    const ptsHalf = num(raw.pts_half_ppr);
    const ptsPpr = num(raw.pts_ppr);

    const offSnp = num(raw.off_snp);
    const tmOffSnp = num(raw.tm_off_snp);

    return compact({
        season,
        gp,
        gs: num(raw.gs),
        snapPct: offSnp && tmOffSnp ? round((offSnp / tmOffSnp) * 100, 1) : undefined,
        offSnp,
        pts: { std: ptsStd, half: ptsHalf, ppr: ptsPpr },
        ppg: {
            std: perGame(ptsStd),
            half: perGame(ptsHalf),
            ppr: perGame(ptsPpr),
        },
        posRank: {
            std: num(raw.pos_rank_std),
            half: num(raw.pos_rank_half_ppr),
            ppr: num(raw.pos_rank_ppr),
        },
        pass: {
            att: num(raw.pass_att),
            cmp: num(raw.pass_cmp),
            cmpPct: num(raw.cmp_pct),
            yd: num(raw.pass_yd),
            td: num(raw.pass_td),
            int: num(raw.pass_int),
            rzAtt: num(raw.pass_rz_att),
            sack: num(raw.pass_sack),
            airYd: num(raw.pass_air_yd),
            ypa: num(raw.pass_ypa),
            rtg: num(raw.pass_rtg),
        },
        rush: {
            att: num(raw.rush_att),
            yd: num(raw.rush_yd),
            td: num(raw.rush_td),
            rzAtt: num(raw.rush_rz_att),
            fd: num(raw.rush_fd),
            ypa: num(raw.rush_ypa),
            btkl: num(raw.rush_btkl),
            yac: num(raw.rush_yac),
        },
        rec: {
            tgt: num(raw.rec_tgt),
            rec: num(raw.rec),
            yd: num(raw.rec_yd),
            td: num(raw.rec_td),
            rzTgt: num(raw.rec_rz_tgt),
            fd: num(raw.rec_fd),
            airYd: num(raw.rec_air_yd),
            yac: num(raw.rec_yar),
            drop: num(raw.rec_drop),
            ypr: num(raw.rec_ypr),
            ypt: num(raw.rec_ypt),
        },
        fumLost: num(raw.fum_lost),
        anytimeTds: num(raw.anytime_tds),
    });
}

/* --------------------------------------------------------- nflverse advanced */

// Aggregates weekly rows to a season line. Market shares are recomputed from
// summed team totals rather than averaged across weeks — averaging weekly shares
// silently over-weights a game the player barely played in.
function aggregateAdvanced(rows) {
    const teamTotals = new Map();
    for (const r of rows) {
        const key = `${r.team}|${r.week}`;
        const t = teamTotals.get(key) || { targets: 0, airYards: 0, carries: 0 };
        t.targets += csvNum(r.targets);
        t.airYards += csvNum(r.receiving_air_yards);
        t.carries += csvNum(r.carries);
        teamTotals.set(key, t);
    }

    const byPlayer = new Map();
    for (const r of rows) {
        const id = r.player_id;
        if (!id) continue;
        const acc = byPlayer.get(id) || {
            name: r.player_display_name || r.player_name,
            position: r.position,
            teams: new Map(),
            weeks: 0,
            targets: 0,
            airYards: 0,
            recYards: 0,
            carries: 0,
            teamTargets: 0,
            teamAirYards: 0,
            teamCarries: 0,
            recEpa: 0,
            rushEpa: 0,
            passEpa: 0,
            cpoeWeighted: 0,
            passAttempts: 0,
            weekPts: [],
        };
        acc.weeks += 1;
        if (r.team) acc.teams.set(r.team, (acc.teams.get(r.team) || 0) + 1);
        acc.targets += csvNum(r.targets);
        acc.airYards += csvNum(r.receiving_air_yards);
        acc.recYards += csvNum(r.receiving_yards);
        acc.carries += csvNum(r.carries);
        const tt = teamTotals.get(`${r.team}|${r.week}`) || { targets: 0, airYards: 0, carries: 0 };
        acc.teamTargets += tt.targets;
        acc.teamAirYards += tt.airYards;
        acc.teamCarries += tt.carries;
        acc.recEpa += csvNum(r.receiving_epa);
        acc.rushEpa += csvNum(r.rushing_epa);
        acc.passEpa += csvNum(r.passing_epa);
        const att = csvNum(r.attempts);
        acc.cpoeWeighted += csvNum(r.passing_cpoe) * att;
        acc.passAttempts += att;
        byPlayer.set(id, acc);
    }

    const out = new Map();
    for (const [id, a] of byPlayer) {
        a.position = a.position || '';
        const targetShare = a.teamTargets ? a.targets / a.teamTargets : 0;
        const airYardsShare = a.teamAirYards ? a.airYards / a.teamAirYards : 0;
        const rushShare = a.teamCarries ? a.carries / a.teamCarries : 0;
        // Team the player logged the most weeks for — handles in-season trades.
        const team = [...a.teams.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
        out.set(id, {
            name: a.name,
            position: a.position,
            team,
            adv: compact({
                targetShare: targetShare ? round(targetShare * 100, 1) : undefined,
                airYardsShare: airYardsShare ? round(airYardsShare * 100, 1) : undefined,
                rushShare: rushShare ? round(rushShare * 100, 1) : undefined,
                // Standard WOPR weighting (Josh Hermsmeyer): 1.5x target share
                // plus 0.7x air-yards share.
                wopr: targetShare || airYardsShare
                    ? round(1.5 * targetShare + 0.7 * airYardsShare, 3)
                    : undefined,
                // Receiver Air Conversion Ratio — yards earned per air yard.
                // Deliberately restricted to WR/TE with a real air-yards sample.
                // Backs are targeted at or behind the line, so their denominator
                // is tiny or negative and the ratio degenerates: De'Von Achane
                // and Jahmyr Gibbs post RACRs of 11-40 on a handful of air
                // yards, which is not efficiency, it is a divide-by-almost-zero.
                racr: RACR_POSITIONS.has(a.position) && a.airYards >= RACR_MIN_AIR_YARDS
                    ? round(a.recYards / a.airYards, 3)
                    : undefined,
                recEpa: a.recEpa ? round(a.recEpa, 1) : undefined,
                rushEpa: a.rushEpa ? round(a.rushEpa, 1) : undefined,
                passEpa: a.passEpa ? round(a.passEpa, 1) : undefined,
                cpoe: a.passAttempts ? round(a.cpoeWeighted / a.passAttempts, 2) : undefined,
            }),
        });
    }
    return out;
}

/* -------------------------------------------------------------------- main */

async function main() {
    const db = loadModule(DB_FILE);
    if (!db || !db.playerDatabase) throw new Error(`Could not read playerDatabase from ${DB_FILE}`);
    const board = Object.values(db.playerDatabase);
    log(`Board: ${board.length} players`);

    log('Loading Sleeper player index…');
    const sleeperPlayers = JSON.parse(await cached('sleeper-players', SLEEPER_PLAYERS_URL));
    const resolve = buildResolver(sleeperPlayers);

    const resolved = new Map();
    const unmatched = [];
    const rejected = [];
    const howCounts = {};
    for (const player of board) {
        const { sleeperId, how } = resolve(player, (r) => rejected.push(r));
        howCounts[how] = (howCounts[how] || 0) + 1;
        if (!sleeperId) { unmatched.push(player); continue; }
        resolved.set(player.id, sleeperId);
    }
    log(`Resolved ids: ${Object.entries(howCounts).map(([k, v]) => `${k}=${v}`).join(' ')}`);
    if (rejected.length) {
        log('');
        log(`Rejected ${rejected.length} mismatched candidate id(s) — the board's photo id points at`);
        log('a different player. The headshot on the site is wrong too, worth fixing there:');
        for (const r of rejected) {
            log(`  ${r.player.id.padEnd(24)} ${r.player.position} ${r.player.name}`);
            log(`    via ${r.how} -> sleeper ${r.sleeperId} = ${r.sawPosition} ${r.sawName}`);
        }
    }

    const seasons = [];
    for (let s = EARLIEST_SEASON; s <= LATEST_SEASON; s += 1) seasons.push(s);

    log(`Loading Sleeper season stats ${EARLIEST_SEASON}–${LATEST_SEASON}…`);
    const stats = {};           // boardId -> { [season]: shapedSeason }
    const seasonsSeen = new Set();
    for (const season of seasons) {
        const raw = JSON.parse(await cached(`sleeper-stats-${season}`, SLEEPER_STATS_URL(season)));
        for (const [boardId, sleeperId] of resolved) {
            const row = raw[sleeperId];
            if (!row || typeof row !== 'object') continue;
            // A row with no games played is a roster placeholder, not a season.
            if (!num(row.gp)) continue;
            const shaped = shapeSleeperSeason(season, row);
            if (!shaped) continue;
            // Age during that season, not today's age: a 2019 line belongs to a
            // 24-year-old even if the player is 31 now.
            const age = ageOn(sleeperPlayers[sleeperId]?.birth_date, season);
            if (age !== undefined) shaped.age = age;
            (stats[boardId] ||= {})[season] = shaped;
            seasonsSeen.add(season);
        }
    }

    // ---- draft capital, for players with no NFL production to model ----
    log('Loading draft picks…');
    const draftByKey = new Map();
    try {
        const picks = parseCsv(await cached('draft-picks', NFLVERSE_DRAFT_URL));
        for (const row of picks) {
            const season = Number(row.season);
            const pick = Number(row.pick);
            if (!season || !pick || !row.position) continue;
            const key = `${normalizeName(row.pfr_player_name)}|${row.position}`;
            const prev = draftByKey.get(key);
            // Keep the most recent draft for a repeated name.
            if (!prev || season > prev.year) {
                draftByKey.set(key, { year: season, round: Number(row.round) || undefined, pick });
            }
        }
        log(`  ${draftByKey.size} drafted players indexed`);
    } catch (err) {
        log(`  ! draft picks unavailable: ${err.message}`);
    }

    const vacatedWrTargets = {};
    let advancedSeasons = 0;
    if (WITH_ADVANCED) {
        log(`Loading nflverse advanced metrics ${ADVANCED_FROM}–${LATEST_SEASON}…`);
        // nflverse keys on gsis_id, which Sleeper populates inconsistently, so the
        // join runs on normalized name + position within a single season.
        // Keyed on BOTH the board's name and the resolved Sleeper record's legal
        // name, because nflverse uses legal names: the board's "Hollywood Brown"
        // is "Marquise Brown" there and would otherwise pick up no advanced
        // metrics at all.
        const boardByNamePos = new Map();
        for (const player of board) {
            if (player.position === 'DST') continue;
            const sleeperName = sleeperPlayers[resolved.get(player.id)]?.full_name;
            for (const name of new Set([player.name, sleeperName].filter(Boolean))) {
                boardByNamePos.set(`${normalizeName(name)}|${player.position}`, player.id);
            }
        }

        for (let season = ADVANCED_FROM; season <= LATEST_SEASON; season += 1) {
            let text;
            try {
                text = await cached(`nflverse-week-${season}`, NFLVERSE_WEEK_URL(season));
            } catch (err) {
                log(`  ! skipping nflverse ${season}: ${err.message}`);
                continue;
            }
            const rows = parseCsv(text).filter((r) => r.season_type === 'REG');
            const agg = aggregateAdvanced(rows);
            let hits = 0;
            for (const entry of agg.values()) {
                const key = `${normalizeName(entry.name)}|${entry.position}`;
                const boardId = boardByNamePos.get(key);
                if (!boardId) continue;
                const target = stats[boardId]?.[season];
                if (!target) continue;
                if (entry.team) target.team = entry.team;
                if (entry.adv) { target.adv = entry.adv; hits += 1; }
            }
            advancedSeasons += 1;
            vlog(`  ${season}: ${hits} board players enriched`);
        }

        // ---- RB rushing yards over expected, from NGS -----------------------
        // One file, every season, one row per player-season already (week '0').
        // NGS didn't compute an expectation before 2018, so earlier seasons have
        // no rush_yards_over_expected_per_att and are skipped rather than zeroed.
        try {
            const text = await cachedPreGzipped('nflverse-ngs-rushing', NFLVERSE_NGS_RUSHING_URL);
            const rows = parseCsv(text).filter((r) => r.season_type === 'REG'
                && r.week === '0' && r.player_position === 'RB');
            let ryoeHits = 0;
            for (const row of rows) {
                const season = Number(row.season);
                const yoeAtt = Number(row.rush_yards_over_expected_per_att);
                if (!season || !row.rush_yards_over_expected_per_att || !Number.isFinite(yoeAtt)) continue;
                const boardId = boardByNamePos.get(`${normalizeName(row.player_display_name)}|RB`);
                const target = boardId ? stats[boardId]?.[season] : null;
                if (!target) continue;
                target.rush = target.rush || {};
                target.rush.yoeAtt = round(yoeAtt, 3);
                ryoeHits += 1;
            }
            vlog(`  NGS rushing: ${ryoeHits} board RB-seasons enriched`);
        } catch (err) {
            log(`  ! NGS rushing unavailable: ${err.message}`);
        }

        // ---- vacated WR target share, for the rookie landing-spot term ------
        // Share of each team's most recent WR targets held by receivers who are
        // no longer on that roster. Rookie WRs are the one case where vacated
        // opportunity predicts anything (see fit_wide.py) — a veteran's own
        // stat line already describes his role, a rookie has no line at all.
        //
        // Computed over EVERY receiver in the weekly feed rather than the ~400
        // on the board, because a departed WR2 who never made the board still
        // vacated his targets. Current team comes from Sleeper, which carries
        // one for every player in the league.
        try {
            const text = await cached(`nflverse-week-${LATEST_SEASON}`,
                NFLVERSE_WEEK_URL(LATEST_SEASON));
            const teamNow = new Map();
            for (const p of Object.values(sleeperPlayers)) {
                if (p.position === 'WR' && p.full_name) {
                    teamNow.set(normalizeName(p.full_name), p.team || null);
                }
            }
            const byTeam = new Map();
            for (const row of parseCsv(text)) {
                if (row.season_type !== 'REG' || row.position !== 'WR' || !row.team) continue;
                const tgt = csvNum(row.targets);
                if (!tgt) continue;
                const acc = byTeam.get(row.team) || { total: 0, gone: 0 };
                acc.total += tgt;
                const now = teamNow.get(normalizeName(row.player_display_name || row.player_name));
                // undefined = not in Sleeper's index at all, which for a player
                // who logged targets last season means he is out of the league.
                if (now !== row.team) acc.gone += tgt;
                byTeam.set(row.team, acc);
            }
            for (const [team, acc] of byTeam) {
                if (acc.total > 20) vacatedWrTargets[team] = round(acc.gone / acc.total * 100, 1);
            }
            vlog(`  vacated WR targets: ${Object.keys(vacatedWrTargets).length} teams`);
        } catch (err) {
            log(`  ! vacated WR targets unavailable: ${err.message}`);
        }

        // ---- TE yards-after-catch over expectation, from NGS ----------------
        // Same shape as the rushing file. Only TE uses this: it measured
        // negative for WR, so it is deliberately not attached there.
        try {
            const text = await cachedPreGzipped('nflverse-ngs-receiving', NFLVERSE_NGS_RECEIVING_URL);
            const rows = parseCsv(text).filter((r) => r.season_type === 'REG'
                && r.week === '0' && r.player_position === 'TE');
            let yacHits = 0;
            for (const row of rows) {
                const season = Number(row.season);
                const yacOe = Number(row.avg_yac_above_expectation);
                if (!season || !row.avg_yac_above_expectation || !Number.isFinite(yacOe)) continue;
                const boardId = boardByNamePos.get(`${normalizeName(row.player_display_name)}|TE`);
                const target = boardId ? stats[boardId]?.[season] : null;
                if (!target) continue;
                target.rec = target.rec || {};
                target.rec.yacOe = round(yacOe, 3);
                yacHits += 1;
            }
            vlog(`  NGS receiving: ${yacHits} board TE-seasons enriched`);
        } catch (err) {
            log(`  ! NGS receiving unavailable: ${err.message}`);
        }
    }

    /* ------------------------------------------------------------- emit */

    const withStats = Object.keys(stats).length;
    const sortedSeasons = [...seasonsSeen].sort((a, b) => a - b);

    // Players with no NFL season are still emitted: an incoming rookie has no
    // stat line but does have draft capital, which is what the rookie model runs
    // on. Only a player with neither is left out entirely.
    const entries = board
        .map((p) => {
            const bySeason = stats[p.id] || {};
            const years = Object.keys(bySeason).map(Number).sort((a, b) => b - a);
            const sleeperId = resolved.get(p.id);
            const upcomingAge = ageOn(sleeperPlayers[sleeperId]?.birth_date, LATEST_SEASON + 1);
            const draft = p.position === 'DST'
                ? undefined
                : draftByKey.get(`${normalizeName(p.name)}|${p.position}`);
            if (!years.length && !draft) return null;
            const payload = {
                sleeperId,
                ...(upcomingAge !== undefined ? { age: upcomingAge } : {}),
                ...(draft ? { draft } : {}),
                seasons: years.map((y) => bySeason[y]),
            };
            return `    ${JSON.stringify(p.id)}: ${JSON.stringify(payload)},`;
        })
        .filter(Boolean);

    const header = `// Auto-generated by scripts/updateStats.js — do not edit by hand.
// Sources: Sleeper season stats (${EARLIEST_SEASON}–${LATEST_SEASON}) and nflverse
// weekly player stats${WITH_ADVANCED ? ` (${ADVANCED_FROM}–${LATEST_SEASON}, aggregated to seasons)` : ' (skipped)'}.
// Read ${new Date().toISOString()}.
// Refresh with: node scripts/updateStats.js
//
// Keyed by board player id. \`seasons\` is ordered most-recent-first, and every
// season carries only the fields that player actually produced — a WR has no
// \`pass\` block, a 2025 rookie has one season. Fantasy points are pre-scored by
// Sleeper in all three formats (std / half / ppr); \`ppg\` divides by games
// played, not games active, so a player who missed time is not penalised twice.
// A player with an empty \`seasons\` array is an incoming rookie: no NFL snaps yet,
// but \`draft\` carries the capital the rookie model projects from.
// \`age\` on a player is their age on Sept 1 of the UPCOMING season; \`age\` inside a
// season is how old they were that year. Age is the strongest single predictor of
// year-over-year change at every skill position, so it is stored, not derived.
// \`adv\` (targetShare, airYardsShare, rushShare, wopr, racr, EPA, cpoe) comes from nflverse
// and is absent for seasons before ${ADVANCED_FROM} and for team defenses.
//
// Shares are percentages (targetShare: 28.4 means 28.4%). snapPct is offensive
// snaps over team offensive snaps.
`;

    const body = `${header}
export const PLAYER_STATS_UPDATED_AT = ${JSON.stringify(new Date().toISOString())};

export const PLAYER_STATS_SEASONS = ${JSON.stringify(sortedSeasons)};

export const ADVANCED_METRICS_FROM = ${ADVANCED_FROM};

// Share of each team's ${LATEST_SEASON} WR targets held by receivers no longer on
// that roster. Feeds the rookie WR landing-spot term in draftScore.js — the one
// place vacated opportunity carries signal, because a rookie has no stat line
// of his own to describe the role he will get.
export const VACATED_WR_TARGETS = ${JSON.stringify(vacatedWrTargets, null, 4)};

export const playerStats = {
${entries.join('\n')}
};

/** Draft capital ({ year, round, pick }) when known — drives the rookie model. */
export const getDraftCapital = (playerId) => playerStats[playerId]?.draft;

/** Age on Sept 1 of the upcoming season, or undefined if unknown. */
export const getPlayerAge = (playerId) => playerStats[playerId]?.age;

/** Every season on record for a board player, most recent first. */
export const getPlayerStats = (playerId) => playerStats[playerId]?.seasons || [];

/** One specific season, or undefined if the player has no line for it. */
export const getSeasonStats = (playerId, season) =>
    getPlayerStats(playerId).find((s) => s.season === season);

/** The n most recent seasons on record, most recent first. */
export const getRecentSeasons = (playerId, n = 3) => getPlayerStats(playerId).slice(0, n);

/** Most recent season on record, or undefined for a player with no NFL snaps. */
export const getLastSeason = (playerId) => getPlayerStats(playerId)[0];

/** True when the player has never recorded an NFL season (incoming rookies). */
export const isRookie = (playerId) => getPlayerStats(playerId).length === 0;
`;

    const previous = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
    const stripStamp = (s) => s.replace(/^\/\/ Read .*$/m, '').replace(/^export const PLAYER_STATS_UPDATED_AT.*$/m, '');
    const changed = stripStamp(previous) !== stripStamp(body);

    log('');
    log(`Players with stats : ${withStats} / ${board.length}`);
    log(`Seasons covered    : ${sortedSeasons[0]}–${sortedSeasons[sortedSeasons.length - 1]}`);
    if (WITH_ADVANCED) log(`Advanced seasons   : ${advancedSeasons}`);
    log(`Output size        : ${(Buffer.byteLength(body) / 1024).toFixed(0)} KB`);

    if (unmatched.length) {
        log('');
        log(`Unresolved (${unmatched.length}) — add to SLEEPER_ID_OVERRIDES if these should have stats:`);
        for (const p of unmatched) log(`  ${p.id.padEnd(28)} ${p.position.padEnd(4)} ${p.name}`);
    }

    const noStats = board.filter((p) => resolved.has(p.id) && !stats[p.id]);
    if (noStats.length) {
        log('');
        log(`Matched but no NFL season on record (${noStats.length}) — expected for rookies:`);
        for (const p of noStats) vlog(`  ${p.id.padEnd(28)} ${p.position.padEnd(4)} ${p.name}`);
        if (!VERBOSE) log('  (run with --verbose to list)');
    }

    if (DRY_RUN) { log('\n--dry-run: nothing written.'); return; }
    if (!changed) { log('\nNo change — file left alone.'); return; }
    fs.writeFileSync(OUT_FILE, body);
    log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
