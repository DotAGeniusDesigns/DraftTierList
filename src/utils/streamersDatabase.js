// Streamers database with weekly streaming options
export const streamersDatabase = {
    week1: {
        QB: [
            {
                name: "Bryce Young",
                team: "CAR",
                opponent: "JAX",
                opponentFantasyPointsAllowed: 20.1,
                opponentPassTDsAllowed: 1.7,
                opponentPassYardsAllowed: 269.5,
                opponentQBRushYardsAllowed: 24.6,
                homeAway: "Away",
                streamingRank: 1
            },
            {
                name: "Trevor Lawrence",
                team: "JAX",
                opponent: "CAR",
                opponentFantasyPointsAllowed: 20.5,
                opponentPassTDsAllowed: 2.1,
                opponentPassYardsAllowed: 236.0,
                opponentQBRushYardsAllowed: 23.2,
                homeAway: "Home",
                streamingRank: 2
            },
            {
                name: "Michael Penix Jr.",
                team: "ATL",
                opponent: "TB",
                opponentFantasyPointsAllowed: 19.8,
                opponentPassTDsAllowed: 1.6,
                opponentPassYardsAllowed: 232.2,
                opponentQBRushYardsAllowed: 29.1,
                homeAway: "Home",
                streamingRank: 3
            }
        ],
        TE: [
            {
                name: "Brenton Strange",
                team: "JAX",
                opponent: "CAR",
                opponentFantasyPointsAllowed: 10.0,
                opponentRecYardsAllowed: 54.1,
                opponentRecTDsAllowed: 0.6,
                homeAway: "Home",
                streamingRank: 1
            },
            {
                name: "Hunter Henry",
                team: "NE",
                opponent: "LV",
                opponentFantasyPointsAllowed: 9.5,
                opponentRecYardsAllowed: 64.5,
                opponentRecTDsAllowed: 0.5,
                homeAway: "Home",
                streamingRank: 2
            },
            {
                name: "Dalton Schultz",
                team: "HOU",
                opponent: "LAR",
                opponentFantasyPointsAllowed: 9.4,
                opponentRecYardsAllowed: 64.8,
                opponentRecTDsAllowed: 0.4,
                homeAway: "Away",
                streamingRank: 3
            }
        ],
        DST: [
            {
                name: "Arizona Cardinals",
                team: "ARI",
                opponent: "NO",
                fantasyPointsPerGame: 5.9,
                homeAway: "Away",
                streamingRank: 1
            },
            {
                name: "Washington Commanders",
                team: "WAS",
                opponent: "NYG",
                fantasyPointsPerGame: 5.3,
                homeAway: "Home",
                streamingRank: 2
            },
            {
                name: "Minnesota Vikings",
                team: "MIN",
                opponent: "CHI",
                fantasyPointsPerGame: 9.5,
                homeAway: "Away",
                streamingRank: 3
            }
        ],
        K: [
            {
                name: "Chase McLaughlin",
                team: "TB",
                opponent: "ATL",
                fantasyPointsPerGame: 9.6,
                homeAway: "Away",
                streamingRank: 1
            },
            {
                name: "Jake Elliott",
                team: "PHI",
                opponent: "DAL",
                fantasyPointsPerGame: 8.3,
                homeAway: "Home",
                streamingRank: 2
            },
            {
                name: "Cam Little",
                team: "JAX",
                opponent: "CAR",
                fantasyPointsPerGame: 7.4,
                homeAway: "Home",
                streamingRank: 3
            }
        ]
    }
};

// Helper function to get streamers for a specific week
export const getStreamersForWeek = (week) => {
    const weekKey = `week${week}`;
    return streamersDatabase[weekKey] || null;
};

// Helper function to get all available weeks
export const getAvailableWeeks = () => {
    return Object.keys(streamersDatabase).map(key => parseInt(key.replace('week', '')));
};

// Helper function to get streamers for a specific position and week
export const getStreamersForPosition = (week, position) => {
    const weekData = getStreamersForWeek(week);
    return weekData ? weekData[position] || [] : [];
};