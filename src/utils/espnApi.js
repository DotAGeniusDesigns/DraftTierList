// ESPN API utilities for fetching player photos and team logos

// ESPN Player Photo API
export const getPlayerPhotoUrl = (playerId) => {
    return `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${playerId}.png`;
};

// ESPN Team Logo API
export const getTeamLogoUrl = (teamAbbr) => {
    return `https://a.espncdn.com/i/teamlogos/nfl/500/${teamAbbr.toLowerCase()}.png`;
};

// ESPN Player Search API (to find player IDs)
export const searchPlayer = async (playerName) => {
    try {
        // ESPN's search API endpoint
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/search?q=${encodeURIComponent(playerName)}`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Look for players in the results
            const players = data.results.filter(result =>
                result.type === 'player' &&
                result.sport &&
                result.sport.name === 'Football'
            );

            if (players.length > 0) {
                return {
                    id: players[0].id,
                    name: players[0].name,
                    team: players[0].team?.abbreviation,
                    position: players[0].position?.abbreviation,
                    photoUrl: getPlayerPhotoUrl(players[0].id)
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Error searching for player:', error);
        return null;
    }
};

// ESPN Team Info API
export const getTeamInfo = async (teamAbbr) => {
    try {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamAbbr.toLowerCase()}`);
        const data = await response.json();

        if (data.team) {
            return {
                id: data.team.id,
                name: data.team.name,
                abbreviation: data.team.abbreviation,
                logoUrl: getTeamLogoUrl(teamAbbr),
                conference: data.team.conference?.name,
                division: data.team.division?.name
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching team info:', error);
        return null;
    }
};

// ESPN Player Stats API (for additional player info)
export const getPlayerStats = async (playerId) => {
    try {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/${playerId}/stats`);
        const data = await response.json();

        if (data.athlete) {
            return {
                id: data.athlete.id,
                name: data.athlete.fullName,
                team: data.athlete.team?.abbreviation,
                position: data.athlete.position?.abbreviation,
                photoUrl: getPlayerPhotoUrl(playerId),
                stats: data.stats
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching player stats:', error);
        return null;
    }
};

// Batch search for multiple players
export const searchMultiplePlayers = async (playerNames) => {
    const results = [];

    for (const name of playerNames) {
        try {
            const player = await searchPlayer(name);
            if (player) {
                results.push(player);
            }
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Error searching for ${name}:`, error);
        }
    }

    return results;
};

// Get all NFL teams from ESPN
export const getAllNFLTeams = async () => {
    try {
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');
        const data = await response.json();

        if (data.sports && data.sports[0] && data.sports[0].leagues) {
            const teams = data.sports[0].leagues[0].teams.map(team => ({
                id: team.team.id,
                name: team.team.name,
                abbreviation: team.team.abbreviation,
                logoUrl: getTeamLogoUrl(team.team.abbreviation),
                conference: team.team.conference?.name,
                division: team.team.division?.name
            }));

            return teams;
        }

        return [];
    } catch (error) {
        console.error('Error fetching NFL teams:', error);
        return [];
    }
}; 