// Streamers database with weekly streaming options
export const streamersDatabase = {
    QB: [
        {
            name: "Bryce Young",
            team: "CAR",
            opponent: "MIA",
            lastWeekPassYards: 150,
            lastWeekPassTDs: 1,
            lastWeekRushYards: 3,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 188.25,
            seasonAvgPassTDs: 1.25,
            seasonAvgRushYards: 13.25,
            seasonAvgRushTDs: 0.25,
            opponentFantasyPointsAllowed: 26.5,
            opponentPassTDsAllowed: 1.75,
            opponentPassYardsAllowed: 235.25,
            opponentQBRushYardsAllowed: 40.75,
            homeAway: "Home",
            streamingRank: 1,
            yahooOwnership: 19
        },
        {
            name: "C.J. Stroud",
            team: "HOU",
            opponent: "BAL",
            lastWeekPassYards: 233,
            lastWeekPassTDs: 2,
            lastWeekRushYards: 11,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 208.0,
            seasonAvgPassTDs: 1.0,
            seasonAvgRushYards: 23.0,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 23.1,
            opponentPassTDsAllowed: 2.25,
            opponentPassYardsAllowed: 271.0,
            opponentQBRushYardsAllowed: 11.5,
            homeAway: "Away",
            streamingRank: 2,
            yahooOwnership: 55
        },
        {
            name: "Jaxson Dart",
            team: "NYG",
            opponent: "NO",
            lastWeekPassYards: 111,
            lastWeekPassTDs: 1,
            lastWeekRushYards: 54,
            lastWeekRushTDs: 1,
            seasonAvgPassYards: 111.0,
            seasonAvgPassTDs: 1.0,
            seasonAvgRushYards: 54.0,
            seasonAvgRushTDs: 1.0,
            opponentFantasyPointsAllowed: 20.6,
            opponentPassTDsAllowed: 2.25,
            opponentPassYardsAllowed: 221.0,
            opponentQBRushYardsAllowed: 22.75,
            homeAway: "Away",
            streamingRank: 3,
            yahooOwnership: 34
        },
    ],
    TE: [
        {
            name: "Cade Otton",
            team: "TB",
            opponent: "SEA",
            lastWeekTargets: 4,
            lastWeekReceptions: 3,
            lastWeekYards: 9,
            lastWeekTDs: 0,
            seasonAvgTargets: 3.67,
            seasonAvgReceptions: 2.0,
            seasonAvgYards: 11.33,
            seasonAvgTDs: 0.0,
            opponentFantasyPointsAllowed: 10.3,
            opponentRecYardsAllowed: 58.0,
            opponentRecTDsAllowed: 0.75,
            homeAway: "Away",
            streamingRank: 1,
            yahooOwnership: 5
        },
        {
            name: "Darren Waller",
            team: "MIA",
            opponent: "CAR",
            lastWeekTargets: 4,
            lastWeekReceptions: 3,
            lastWeekYards: 27,
            lastWeekTDs: 2,
            seasonAvgTargets: 4.0,
            seasonAvgReceptions: 3.0,
            seasonAvgYards: 27.0,
            seasonAvgTDs: 2.0,
            opponentFantasyPointsAllowed: 10.3,
            opponentRecYardsAllowed: 71.25,
            opponentRecTDsAllowed: 0.5,
            homeAway: "Away",
            streamingRank: 2,
            yahooOwnership: 54
        },
        {
            name: "Dalton Schultz",
            team: "HOU",
            opponent: "BAL",
            lastWeekTargets: 6,
            lastWeekReceptions: 5,
            lastWeekYards: 30,
            lastWeekTDs: 0,
            seasonAvgTargets: 5.25,
            seasonAvgReceptions: 4.0,
            seasonAvgYards: 31.5,
            seasonAvgTDs: 0.0,
            opponentFantasyPointsAllowed: 8.2,
            opponentRecYardsAllowed: 66.75,
            opponentRecTDsAllowed: 0.25,
            homeAway: "Away",
            streamingRank: 3,
            yahooOwnership: 19
        },
    ],
    DST: [
        {
            name: "Cleveland Browns",
            team: "CLE",
            opponent: "MIN",
            fantasyPointsPerGame: 4.25,
            homeAway: "Home",
            streamingRank: 1,
            yahooOwnership: 48
        },
        {
            name: "Los Angeles Rams",
            team: "LAR",
            opponent: "SF",
            fantasyPointsPerGame: 8.0,
            homeAway: "Home",
            streamingRank: 2,
            yahooOwnership: 45
        },
        {
            name: "Indianapolis Colts",
            team: "IND",
            opponent: "LV",
            fantasyPointsPerGame: 8.5,
            homeAway: "Home",
            streamingRank: 3,
            yahooOwnership: 40
        }
    ],
    K: [
        {
            name: "Matt Prater",
            team: "BUF",
            opponent: "NE",
            fantasyPointsPerGame: 10.25,
            homeAway: "Home",
            streamingRank: 1,
            yahooOwnership: 31
        },
        {
            name: "Joshua Karty",
            team: "LAR",
            opponent: "SF",
            fantasyPointsPerGame: 9.5,
            homeAway: "Home",
            streamingRank: 2,
            yahooOwnership: 33
        },
        {
            name: "Cam Little",
            team: "JAX",
            opponent: "KC",
            fantasyPointsPerGame: 9.75,
            homeAway: "Home",
            streamingRank: 3,
            yahooOwnership: 35
        }
    ]
};

// Helper function to get streamers for a specific position
export const getStreamersForPosition = (position) => {
    return streamersDatabase[position] || [];
};