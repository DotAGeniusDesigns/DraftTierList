import { getByeWeek, getOlineRank, getTeamLogo } from './teamData';
import { getAllPlayers } from './playerDatabase';
import { getInjury } from './injuryReport';

// Player ids that changed after the database was generated, mapped old -> new.
// Saved boards, backups and share links all encode ids, so anything reading a
// persisted id runs it through migratePlayerId first or the entry is silently
// dropped as "no longer in the database".
const LEGACY_PLAYER_IDS = {
    'jac-dst': 'jax-dst', // Jacksonville standardised on JAX to match Sleeper
};

export const migratePlayerId = (id) => LEGACY_PLAYER_IDS[id] || id;

export const initialPlayers = getAllPlayers().map(player => ({
    ...player,
    drafted: false,
    byeWeek: getByeWeek(player.team),
    olineRank: getOlineRank(player.team),
    teamLogo: getTeamLogo(player.team),
    // Refreshed by scripts/updateInjuries.js, never persisted: the saved board
    // takes this from the database on every load so a stale localStorage copy
    // can't outlive the injury.
    injury: getInjury(player.id),
}));

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