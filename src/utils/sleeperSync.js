// Live draft sync against Sleeper's public API.
//
// Sleeper's v1 API is read-only, needs no auth, and serves
// `access-control-allow-origin: *`, so the browser polls it directly — there is
// no backend or CORS proxy in this path. Their guidance is to stay under 1000
// calls/minute; a 3s poll is ~20/min.

export const SLEEPER_API = 'https://api.sleeper.app/v1';

// Sleeper's own abbreviations win, since both sides get normalized before they
// are compared. The board already uses Sleeper's codes, so these only cover
// stale abbreviations that could show up in older Sleeper pick metadata.
const TEAM_ALIASES = {
    JAC: 'JAX',
    WSH: 'WAS',
    LA: 'LAR',
    STL: 'LAR',
    OAK: 'LV',
    SD: 'LAC',
    ARZ: 'ARI',
};

const normalizeTeam = (team) => {
    const upper = String(team || '').toUpperCase();
    return TEAM_ALIASES[upper] || upper;
};

// Generational suffixes drift between sources (Sleeper drops most of them, our
// board keeps them) so they are stripped from both sides rather than matched.
const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);

// "A.J. Brown" / "De'Von Achane" / "Jaxon Smith-Njigba" all reduce to a bare
// alphanumeric key, which absorbs punctuation and spacing differences at once.
export const normalizeName = (name) => {
    const tokens = String(name || '')
        .toLowerCase()
        .replace(/[-.'’`]/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    while (tokens.length > 1 && NAME_SUFFIXES.has(tokens[tokens.length - 1])) {
        tokens.pop();
    }

    return tokens.join('');
};

// Most headshots are served from Sleeper's CDN, and the filename is the Sleeper
// player id — an exact key we get for free, no name matching required.
export const extractSleeperId = (photo) => {
    const match = String(photo || '').match(/sleepercdn\.com\/content\/nfl\/players\/thumb\/(\d+)\.jpg/);
    return match ? match[1] : null;
};

// Index the board once per player-list change so each poll is pure lookups.
// Three tiers of confidence: exact Sleeper id, then name+position, then name
// alone. Keys that would map to more than one player are dropped rather than
// guessed at — an ambiguous pick surfaces in the UI for a manual tap instead.
export const buildPlayerIndex = (players) => {
    const bySleeperId = new Map();
    const namePosBuckets = new Map();
    const nameBuckets = new Map();

    const push = (map, key, id) => {
        const existing = map.get(key);
        if (existing) {
            existing.push(id);
        } else {
            map.set(key, [id]);
        }
    };

    (players || []).forEach((player) => {
        if (!player?.id) return;

        const sleeperId = extractSleeperId(player.photo);
        if (sleeperId) bySleeperId.set(sleeperId, player.id);

        // Sleeper keys team defenses by team abbreviation instead of a number.
        if (player.position === 'DST' && player.team) {
            bySleeperId.set(normalizeTeam(player.team), player.id);
        }

        const key = normalizeName(player.name);
        if (!key) return;

        push(namePosBuckets, `${key}|${player.position}`, player.id);
        push(nameBuckets, key, player.id);
    });

    const unique = (buckets) => {
        const map = new Map();
        buckets.forEach((ids, key) => {
            if (ids.length === 1) map.set(key, ids[0]);
        });
        return map;
    };

    return {
        bySleeperId,
        byNamePos: unique(namePosBuckets),
        byName: unique(nameBuckets),
    };
};

const pickFullName = (pick) => {
    const meta = pick?.metadata || {};
    return `${meta.first_name || ''} ${meta.last_name || ''}`.trim();
};

// Resolve one Sleeper pick to a board player id, or null if we can't be sure.
// Team is deliberately not part of the match: the board carries 2026 landing
// spots that can differ from whatever Sleeper has cached for a player.
export const matchPick = (pick, index) => {
    if (!pick || !index) return null;

    const rawId = String(pick.player_id ?? '');
    const byId = index.bySleeperId.get(rawId) || index.bySleeperId.get(normalizeTeam(rawId));
    if (byId) return byId;

    const key = normalizeName(pickFullName(pick));
    if (!key) return null;

    const position = pick.metadata?.position === 'DEF' ? 'DST' : pick.metadata?.position;
    return index.byNamePos.get(`${key}|${position}`) || index.byName.get(key) || null;
};

// Human-readable label for picks we couldn't place, shown so the drafter can
// mark them by hand rather than silently losing them.
export const describePick = (pick) => {
    const name = pickFullName(pick) || `Player ${pick?.player_id ?? '?'}`;
    const position = pick?.metadata?.position === 'DEF' ? 'DST' : pick?.metadata?.position;
    const team = pick?.metadata?.team;
    const detail = [position, team].filter(Boolean).join(' · ');
    return detail ? `${name} (${detail})` : name;
};

// Accepts a bare draft id or any Sleeper draft URL, since the drafter already
// has the draft room open and can just paste the address bar.
export const parseDraftId = (input) => {
    const trimmed = String(input || '').trim();
    if (!trimmed) return null;

    const fromUrl = trimmed.match(/\/draft\/[a-z]+\/(\d+)/i);
    if (fromUrl) return fromUrl[1];

    const bare = trimmed.match(/^(\d{6,})$/);
    return bare ? bare[1] : null;
};

const request = async (path, { signal } = {}) => {
    let response;
    try {
        response = await fetch(`${SLEEPER_API}${path}`, { signal });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error('Could not reach Sleeper. Check your connection.');
    }

    if (response.status === 404) {
        throw new Error('Draft not found — double-check the draft ID or URL.');
    }
    if (response.status === 429) {
        throw new Error('Sleeper is rate limiting this connection. Retrying...');
    }
    if (!response.ok) {
        throw new Error(`Sleeper returned ${response.status}.`);
    }

    return response.json();
};

export const fetchDraft = (draftId, options) =>
    request(`/draft/${encodeURIComponent(draftId)}`, options);

export const fetchDraftPicks = async (draftId, options) => {
    const data = await request(`/draft/${encodeURIComponent(draftId)}/picks`, options);
    return Array.isArray(data) ? data : [];
};
