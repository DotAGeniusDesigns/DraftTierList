import { getTeamLogo, getByeWeek } from './teamData';
import { getTeamLogoUrl } from './espnApi';
import { getAllPlayers } from './playerDatabase';

// Get all players from the local database
const databasePlayers = getAllPlayers();

// Initial player data structure using local database
export const initialPlayers = databasePlayers.map(player => ({
    ...player,
    drafted: false,
    teamLogo: getTeamLogoUrl(player.team),
    byeWeek: getByeWeek(player.team)
}));

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
        8: 'bg-tier-8'
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
        8: 'text-white'
    };
    return colors[tier] || 'text-white';
}; 