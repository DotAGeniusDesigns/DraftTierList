// Streamers database with weekly streaming options
export const streamersDatabase = {
    QB: [
        {
            name: "Tyrod Taylor",
            team: "NYJ",
            opponent: "MIA",
            lastWeekPassYards: 197,
            lastWeekPassTDs: 2,
            lastWeekRushYards: 48,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 202.4,
            seasonAvgPassTDs: 2.4,
            seasonAvgRushYards: 55.2,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 26.3,
            opponentPassTDsAllowed: 2.0,
            opponentPassYardsAllowed: 238.3,
            opponentQBRushYardsAllowed: 27.3,
            homeAway: "Away",
            streamingRank: 1,
            yahooOwnership: 1
        },
        {
            name: "Geno Smith",
            team: "LV",
            opponent: "CHI",
            lastWeekPassYards: 289,
            lastWeekPassTDs: 3,
            lastWeekRushYards: 5,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 277.0,
            seasonAvgPassTDs: 1.33,
            seasonAvgRushYards: 11.67,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 22.6,
            opponentPassTDsAllowed: 2.67,
            opponentPassYardsAllowed: 256.3,
            opponentQBRushYardsAllowed: 10.3,
            homeAway: "Home",
            streamingRank: 2,
            yahooOwnership: 44
        },
        {
            name: "Carson Wentz",
            team: "MIN",
            opponent: "PIT",
            lastWeekPassYards: 173,
            lastWeekPassTDs: 2,
            lastWeekRushYards: 4,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 173.0,
            seasonAvgPassTDs: 2.0,
            seasonAvgRushYards: 4.0,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 21.5,
            opponentPassTDsAllowed: 1.67,
            opponentPassYardsAllowed: 260.3,
            opponentQBRushYardsAllowed: 31.0,
            homeAway: "Away",
            streamingRank: 3,
            yahooOwnership: 7
        }
    ],
    TE: [
        {
            name: "Harold Fannin Jr.",
            team: "CLE",
            opponent: "DET",
            lastWeekTargets: 4,
            lastWeekReceptions: 3,
            lastWeekYards: 25,
            lastWeekTDs: 0,
            seasonAvgTargets: 6.0,
            seasonAvgReceptions: 5.0,
            seasonAvgYards: 45.33,
            seasonAvgTDs: 0.0,
            opponentFantasyPointsAllowed: 11.57,
            opponentRecYardsAllowed: 54.67,
            opponentRecTDsAllowed: 1.0,
            homeAway: "Away",
            streamingRank: 1,
            yahooOwnership: 40
        },
        {
            name: "Mason Taylor",
            team: "NYJ",
            opponent: "MIA",
            lastWeekTargets: 6,
            lastWeekReceptions: 4,
            lastWeekYards: 18,
            lastWeekTDs: 0,
            seasonAvgTargets: 3.0,
            seasonAvgReceptions: 2.0,
            seasonAvgYards: 14.33,
            seasonAvgTDs: 0.0,
            opponentFantasyPointsAllowed: 11.23,
            opponentRecYardsAllowed: 71.33,
            opponentRecTDsAllowed: 0.67,
            homeAway: "Away",
            streamingRank: 2,
            yahooOwnership: 6
        },
        {
            name: "Brenton Strange",
            team: "JAX",
            opponent: "SF",
            lastWeekTargets: 7,
            lastWeekReceptions: 6,
            lastWeekYards: 61,
            lastWeekTDs: 0,
            seasonAvgTargets: 5.33,
            seasonAvgReceptions: 4.33,
            seasonAvgYards: 45.67,
            seasonAvgTDs: 0.0,
            opponentFantasyPointsAllowed: 7.87,
            opponentRecYardsAllowed: 38.0,
            opponentRecTDsAllowed: 0.67,
            homeAway: "Away",
            streamingRank: 3,
            yahooOwnership: 27
        }
    ],
    DST: [
        {
            name: "New England Patriots",
            team: "NE",
            opponent: "CAR",
            fantasyPointsPerGame: 7.33,
            homeAway: "Home",
            streamingRank: 1,
            yahooOwnership: 29
        },
        {
            name: "San Francisco 49ers",
            team: "SF",
            opponent: "JAX",
            fantasyPointsPerGame: 6.33,
            homeAway: "Home",
            streamingRank: 2,
            yahooOwnership: 33
        },
        {
            name: "Washington Commanders",
            team: "WAS",
            opponent: "ATL",
            fantasyPointsPerGame: 7.33,
            homeAway: "Away",
            streamingRank: 3,
            yahooOwnership: 19
        }
    ],
    K: [
        {
            name: "Spencer Shrader",
            team: "IND",
            opponent: "LAR",
            fantasyPointsPerGame: 15.0,
            homeAway: "Away",
            streamingRank: 1,
            yahooOwnership: 38
        },
        {
            name: "Jason Myers",
            team: "SEA",
            opponent: "ARI",
            fantasyPointsPerGame: 11.33,
            homeAway: "Away",
            streamingRank: 2,
            yahooOwnership: 4
        },
        {
            name: "Will Reichard",
            team: "MIN",
            opponent: "PIT",
            fantasyPointsPerGame: 10.33,
            homeAway: "Away",
            streamingRank: 3,
            yahooOwnership: 9
        }
    ]
};

// Helper function to get streamers for a specific position
export const getStreamersForPosition = (position) => {
    return streamersDatabase[position] || [];
};