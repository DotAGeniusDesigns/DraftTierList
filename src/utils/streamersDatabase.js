// Streamers database with weekly streaming options
export const streamersDatabase = {
    week1: {
        QB: [
            {
                name: "Sam Howell",
                team: "WAS",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png",
                opponent: "ARI",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png",
                opponentPassDefRank: 28,
                opponentPassTDsAllowed: 2.1,
                opponentPassYardsAllowed: 265.3,
                homeAway: "Home",
                weather: "Clear, 72°F",
                streamingRank: 1,
                reason: "Arizona ranks 28th vs pass, allows 2.1 TDs/game"
            },
            {
                name: "Baker Mayfield",
                team: "TB",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
                opponent: "CHI",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",
                opponentPassDefRank: 25,
                opponentPassTDsAllowed: 1.9,
                opponentPassYardsAllowed: 248.7,
                homeAway: "Away",
                weather: "Partly cloudy, 68°F",
                streamingRank: 2,
                reason: "Chicago secondary struggling, 25th vs pass"
            },
            {
                name: "Gardner Minshew",
                team: "LV",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png",
                opponent: "LAC",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png",
                opponentPassDefRank: 27,
                opponentPassTDsAllowed: 2.0,
                opponentPassYardsAllowed: 252.1,
                homeAway: "Home",
                weather: "Dome",
                streamingRank: 3,
                reason: "Chargers pass defense vulnerable, 27th overall"
            }
        ],
        RB: [
            {
                name: "Zach Charbonnet",
                team: "SEA",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
                opponent: "CAR",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
                opponentRunDefRank: 31,
                opponentRushTDsAllowed: 1.4,
                opponentRushYardsAllowed: 142.8,
                defensiveLinePressure: "Low",
                streamingRank: 1,
                reason: "Carolina ranks 31st vs run, allows 142.8 rush yards/game"
            },
            {
                name: "Tyjae Spears",
                team: "TEN",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
                opponent: "CLE",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
                opponentRunDefRank: 29,
                opponentRushTDsAllowed: 1.3,
                opponentRushYardsAllowed: 138.2,
                defensiveLinePressure: "Medium",
                streamingRank: 2,
                reason: "Cleveland run defense struggling, 29th overall"
            },
            {
                name: "Chase Brown",
                team: "CIN",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png",
                opponent: "NE",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
                opponentRunDefRank: 26,
                opponentRushTDsAllowed: 1.2,
                opponentRushYardsAllowed: 135.5,
                defensiveLinePressure: "Low",
                streamingRank: 3,
                reason: "Patriots run defense below average, 26th rank"
            }
        ],
        WR: [
            {
                name: "Joshua Palmer",
                team: "LAC",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png",
                opponent: "LV",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png",
                opponentPassDefRank: 26,
                opponentWRvsCB: "Favorable",
                redZoneDefense: "Weak",
                secondaryDepth: "Thin",
                streamingRank: 1,
                reason: "Raiders secondary thin, 26th vs pass, weak red zone D"
            },
            {
                name: "Marvin Mims",
                team: "DEN",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png",
                opponent: "NYJ",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
                opponentPassDefRank: 24,
                opponentWRvsCB: "Very Favorable",
                redZoneDefense: "Average",
                secondaryDepth: "Injured",
                streamingRank: 2,
                reason: "Jets secondary banged up, 24th vs pass"
            },
            {
                name: "Jalen Tolbert",
                team: "DAL",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
                opponent: "NYG",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png",
                opponentPassDefRank: 28,
                opponentWRvsCB: "Favorable",
                redZoneDefense: "Weak",
                secondaryDepth: "Thin",
                streamingRank: 3,
                reason: "Giants secondary struggling, 28th vs pass, weak red zone"
            }
        ],
        TE: [
            {
                name: "Tyler Higbee",
                team: "LAR",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",
                opponent: "SF",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
                opponentTEDefRank: 27,
                redZoneDefense: "Weak",
                linebackerCoverage: "Poor",
                streamingRank: 1,
                reason: "49ers struggle vs TEs, 27th overall, poor LB coverage"
            },
            {
                name: "Jake Ferguson",
                team: "DAL",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
                opponent: "NYG",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png",
                opponentTEDefRank: 25,
                redZoneDefense: "Very Weak",
                linebackerCoverage: "Very Poor",
                streamingRank: 2,
                reason: "Giants terrible vs TEs, 25th rank, very weak red zone"
            },
            {
                name: "Cole Kmet",
                team: "CHI",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",
                opponent: "TB",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
                opponentTEDefRank: 26,
                redZoneDefense: "Weak",
                linebackerCoverage: "Poor",
                streamingRank: 3,
                reason: "Bucs struggle vs TEs, 26th rank, poor LB coverage"
            }
        ],
        DST: [
            {
                name: "Seattle Seahawks",
                team: "SEA",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
                opponent: "CAR",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
                opponentOffenseRank: 32,
                turnoversForced: 2.1,
                sacks: 2.8,
                homeAway: "Home",
                weather: "Clear, 72°F",
                streamingRank: 1,
                reason: "Carolina worst offense (32nd), Seattle at home, good pass rush"
            },
            {
                name: "Tennessee Titans",
                team: "TEN",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
                opponent: "CLE",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
                opponentOffenseRank: 28,
                turnoversForced: 1.8,
                sacks: 2.5,
                homeAway: "Away",
                weather: "Partly cloudy, 68°F",
                streamingRank: 2,
                reason: "Cleveland struggling on offense, 28th overall"
            },
            {
                name: "Arizona Cardinals",
                team: "ARI",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png",
                opponent: "WAS",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png",
                opponentOffenseRank: 29,
                turnoversForced: 1.6,
                sacks: 2.2,
                homeAway: "Away",
                weather: "Clear, 75°F",
                streamingRank: 3,
                reason: "Washington offense struggling, 29th rank, good matchup"
            }
        ],
        K: [
            {
                name: "Brandon McManus",
                team: "JAX",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png",
                opponent: "HOU",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png",
                opponentDefenseRank: 30,
                fieldGoalAttemptsAllowed: 2.4,
                weather: "Dome",
                streamingRank: 1,
                reason: "Houston defense weak (30th), dome conditions, high FG attempts"
            },
            {
                name: "Greg Zuerlein",
                team: "NYJ",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
                opponent: "DEN",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png",
                opponentDefenseRank: 27,
                fieldGoalAttemptsAllowed: 2.2,
                weather: "Clear, 75°F",
                streamingRank: 2,
                reason: "Denver defense struggling, good weather, decent FG opportunities"
            },
            {
                name: "Cameron Dicker",
                team: "LAC",
                teamLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png",
                opponent: "LV",
                opponentLogo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png",
                opponentDefenseRank: 25,
                fieldGoalAttemptsAllowed: 2.1,
                weather: "Dome",
                streamingRank: 3,
                reason: "Raiders defense below average, dome conditions, good FG opportunities"
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
