import { getByeWeek, getOlineRank, getTeamLogo } from './teamData';
import { getAllPlayers } from './playerDatabase';
import { getInjury } from './injuryReport';
import { DEFAULT_SCORING_FORMAT } from './scoringFormats';

// Default board tier sizes: 12 (×2), 20 (×4), 36 (×4), then remainder in tier 11.
// Applied by rank position after sorting on the active format's ECR.
export const DEFAULT_TIER_STARTS = [1, 13, 25, 45, 65, 85, 105, 141, 177, 213, 249];

export const tierForRank = (rank) => {
    let tier = 1;
    for (let i = 0; i < DEFAULT_TIER_STARTS.length; i += 1) {
        if (rank >= DEFAULT_TIER_STARTS[i]) tier = i + 1;
    }
    return tier;
};

// A database player's ECR/ADP for a given scoring format. Falls back to the
// half-PPR numbers (the app default) if the requested format is somehow
// unrecognized — every player in playerDatabase carries all four formats
// under `rankings`, populated at generation time (see generatePlayerDatabase.js).
export const getRankingsForFormat = (databasePlayer, scoringFormat) => (
    databasePlayer?.rankings?.[scoringFormat] || databasePlayer?.rankings?.[DEFAULT_SCORING_FORMAT] || {
        ecr: databasePlayer?.ecr,
        adp: databasePlayer?.adp,
    }
);

// Player ids that changed after the database was generated, mapped old -> new.
// Saved boards, backups and share links all encode ids, so anything reading a
// persisted id runs it through migratePlayerId first or the entry is silently
// dropped as "no longer in the database".
const LEGACY_PLAYER_IDS = {
    'jac-dst': 'jax-dst', // Jacksonville standardised on JAX to match Sleeper
};

export const migratePlayerId = (id) => LEGACY_PLAYER_IDS[id] || id;

const enrichPlayer = (player) => ({
    ...player,
    drafted: false,
    draftedAt: null,
    byeWeek: getByeWeek(player.team),
    olineRank: getOlineRank(player.team),
    teamLogo: getTeamLogo(player.team),
    // Refreshed by scripts/updateInjuries.js, never persisted: the saved board
    // takes this from the database on every load so a stale localStorage copy
    // can't outlive the injury.
    injury: getInjury(player.id),
});

/** Default board for a scoring format: sorted by that format's ECR, tiers by rank. */
export const buildDefaultPlayers = (scoringFormat = DEFAULT_SCORING_FORMAT) => {
    const entries = getAllPlayers().map((player) => {
        const { ecr, adp } = getRankingsForFormat(player, scoringFormat);
        return {
            player,
            ecr,
            adp,
            sortEcr: ecr ?? Number.MAX_SAFE_INTEGER,
            sortAdp: adp ?? Number.MAX_SAFE_INTEGER,
        };
    });

    entries.sort((a, b) => {
        if (a.sortEcr !== b.sortEcr) return a.sortEcr - b.sortEcr;
        if (a.sortAdp !== b.sortAdp) return a.sortAdp - b.sortAdp;
        return a.player.name.localeCompare(b.player.name);
    });

    return entries.map(({ player, ecr, adp }, index) => ({
        ...enrichPlayer(player),
        ecr,
        adp,
        tier: tierForRank(index + 1),
    }));
};

export const initialPlayers = buildDefaultPlayers(DEFAULT_SCORING_FORMAT);

// One string per piece of news. The board remembers the last stamp it raised the
// injured flag for, so clearing the flag by hand sticks until ESPN files an
// update on that player.
export const injuryStampOf = (injury) => (injury ? `${injury.status}|${injury.newsDate}` : '');

// Helper function to get tier color
export const getTierColor = (tier) => {
    const colors = {
        1: 'bg-tier-1',
        2: 'bg-tier-2',
        3: 'bg-tier-3',
        4: 'bg-tier-4',
        5: 'bg-tier-5',
        6: 'bg-tier-6',
        7: 'bg-tier-7',
        8: 'bg-tier-8',
        9: 'bg-tier-9',
        10: 'bg-tier-10',
        11: 'bg-tier-11',
        12: 'bg-tier-12',
    };
    return colors[tier] || 'bg-gray-500';
};

// Helper function to get tier text color
export const getTierTextColor = (tier) => {
    const colors = {
        1: 'text-white',
        2: 'text-white',
        3: 'text-black',
        4: 'text-white',
        5: 'text-white',
        6: 'text-white',
        7: 'text-white',
        8: 'text-white',
        9: 'text-white',
        10: 'text-white',
        11: 'text-white',
        12: 'text-white'
    };
    return colors[tier] || 'text-white';
}; 