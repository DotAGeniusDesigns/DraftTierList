import LZString from 'lz-string';
import { initialPlayers, migratePlayerId } from './playerData';
import { DEFAULT_SCORING_FORMAT, normalizeScoringFormat } from './scoringFormats';

// ---------------------------------------------------------------------------
// Shareable board links
//
// The v1.0 export blob below embeds photo and logo URLs for every player, which
// is far too large to survive in a URL. A share link instead stores only what
// the recipient cannot derive: which tier each player sits in, their order
// within it, custom tier names, and the user-set flags. Everything else is
// rebuilt from the local player database, so links stay short.
// ---------------------------------------------------------------------------

export const SHARE_PARAM = 'board';
const SHARE_VERSION = 3;

const FLAG_DRAFTED = 1;
const FLAG_RISKY = 2;
const FLAG_UPSIDE = 4;
const FLAG_HANDCUFF = 8;

// Links much longer than this get mangled by some chat clients.
const SHARE_LENGTH_WARNING = 6000;

export const encodeBoardForShare = (players, tierNames = {}, scoringFormat = DEFAULT_SCORING_FORMAT) => {
    const byTier = new Map();
    const flags = {};

    players.forEach((player) => {
        if (!player?.id) return;
        const tier = Number(player.tier) || 1;
        if (!byTier.has(tier)) byTier.set(tier, []);
        byTier.get(tier).push(player.id);

        let mask = 0;
        if (player.drafted) mask |= FLAG_DRAFTED;
        if (player.isRisky) mask |= FLAG_RISKY;
        if (player.isUpside) mask |= FLAG_UPSIDE;
        if (player.isHandcuff) mask |= FLAG_HANDCUFF;
        if (mask) flags[player.id] = mask;
    });

    const payload = {
        v: SHARE_VERSION,
        ts: Math.floor(Date.now() / 1000),
        // [tier, "id,id,id"] — joining ids compresses better than nested arrays
        b: [...byTier.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([tier, ids]) => [tier, ids.join(',')]),
    };

    const namedTiers = Object.entries(tierNames || {}).filter(([, name]) => name);
    if (namedTiers.length) payload.tn = Object.fromEntries(namedTiers);
    if (Object.keys(flags).length) payload.f = flags;
    payload.sf = normalizeScoringFormat(scoringFormat);

    return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
};

// Builds the full https URL for the current board.
export const buildShareUrl = (players, tierNames = {}, scoringFormat = DEFAULT_SCORING_FORMAT) => {
    const code = encodeBoardForShare(players, tierNames, scoringFormat);
    const url = `${window.location.origin}/draft-board?${SHARE_PARAM}=${code}`;
    return { url, isLong: url.length > SHARE_LENGTH_WARNING };
};

// Rebuilds a full board from a share code. Players added to the database after
// the link was created are appended at their default tier so a returning
// visitor never ends up with a board that is missing this season's new names.
export const decodeSharedBoard = (code) => {
    const jsonString = LZString.decompressFromEncodedURIComponent(code);
    if (!jsonString) {
        throw new Error('This share link is invalid or incomplete.');
    }

    const data = JSON.parse(jsonString);
    if (data.v !== SHARE_VERSION || !Array.isArray(data.b)) {
        throw new Error('This share link was made by a different version of the site.');
    }

    const databaseById = new Map(initialPlayers.map((player) => [player.id, player]));
    const players = [];
    const seen = new Set();
    let missing = 0;

    data.b.forEach(([tier, idString]) => {
        String(idString)
            .split(',')
            .filter(Boolean)
            .forEach((rawId) => {
                // Links made before an id was renamed still carry the old one.
                const id = migratePlayerId(rawId);
                if (seen.has(id)) return;
                const base = databaseById.get(id);
                if (!base) {
                    missing += 1;
                    return;
                }
                seen.add(id);
                const mask = data.f?.[rawId] || data.f?.[id] || 0;
                players.push({
                    ...base,
                    tier: Number(tier) || 1,
                    drafted: Boolean(mask & FLAG_DRAFTED),
                    isRisky: Boolean(mask & FLAG_RISKY),
                    isUpside: Boolean(mask & FLAG_UPSIDE),
                    isHandcuff: Boolean(mask & FLAG_HANDCUFF),
                });
            });
    });

    if (!players.length) {
        throw new Error('This share link does not contain any known players.');
    }

    initialPlayers.forEach((player) => {
        if (!seen.has(player.id)) players.push({ ...player });
    });

    return {
        players,
        tierNames: data.tn || {},
        scoringFormat: normalizeScoringFormat(data.sf),
        sharedAt: data.ts ? new Date(data.ts * 1000) : null,
        sharedCount: seen.size,
        addedCount: players.length - seen.size,
        missingCount: missing,
        // A taste of the board so the visitor can decide before overwriting theirs.
        preview: players.slice(0, 5).map((player) => player.name),
    };
};

// Export tier list data to a compressed string
export const exportTierList = (players, scoringFormat = DEFAULT_SCORING_FORMAT) => {
    try {
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            scoringFormat: normalizeScoringFormat(scoringFormat),
            players: players.map(player => ({
                id: player.id,
                name: player.name,
                position: player.position,
                team: player.team,
                tier: player.tier,
                drafted: player.drafted,
                photo: player.photo,
                teamLogo: player.teamLogo,
                byeWeek: player.byeWeek
            }))
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(exportData);

        // Compress using LZ-string
        const compressed = LZString.compressToEncodedURIComponent(jsonString);

        return compressed;
    } catch (error) {
        console.error('Export failed:', error);
        throw new Error('Failed to export tier list');
    }
};

// Import tier list data from a compressed string
export const importTierList = (compressedString) => {
    try {
        // Decompress the string
        const jsonString = LZString.decompressFromEncodedURIComponent(compressedString);

        if (!jsonString) {
            throw new Error('Invalid import code');
        }

        // Parse the JSON
        const importData = JSON.parse(jsonString);

        // Validate the data structure
        if (!importData.version || !importData.players || !Array.isArray(importData.players)) {
            throw new Error('Invalid tier list format');
        }

        // Validate each player has required fields
        const validPlayers = importData.players.filter(player =>
            player.id && player.name && player.position && player.team &&
            typeof player.tier === 'number' && typeof player.drafted === 'boolean'
        );

        if (validPlayers.length === 0) {
            throw new Error('No valid players found in import');
        }

        return {
            players: validPlayers,
            scoringFormat: importData.scoringFormat
                ? normalizeScoringFormat(importData.scoringFormat)
                : null,
        };
    } catch (error) {
        console.error('Import failed:', error);
        throw new Error('Failed to import tier list: ' + error.message);
    }
};

// Validate import code without importing
export const validateImportCode = (compressedString) => {
    try {
        const jsonString = LZString.decompressFromEncodedURIComponent(compressedString);
        if (!jsonString) return false;

        const importData = JSON.parse(jsonString);
        return importData.version && importData.players && Array.isArray(importData.players);
    } catch (error) {
        return false;
    }
};

// Get import info (player count, timestamp, etc.)
export const getImportInfo = (compressedString) => {
    try {
        const jsonString = LZString.decompressFromEncodedURIComponent(compressedString);
        if (!jsonString) return null;

        const importData = JSON.parse(jsonString);
        return {
            playerCount: importData.players?.length || 0,
            timestamp: importData.timestamp,
            version: importData.version,
            scoringFormat: importData.scoringFormat || null,
        };
    } catch (error) {
        return null;
    }
}; 