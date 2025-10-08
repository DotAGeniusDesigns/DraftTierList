// Streamers database with weekly streaming options
export const streamersDatabase = {
    QB: [
        {
            name: "Bryce Young",
            team: "CAR",
            opponent: "DAL",
            lastWeekPassYards: 198,
            lastWeekPassTDs: 2,
            lastWeekRushYards: 1,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 190.2,
            seasonAvgPassTDs: 1.4,
            seasonAvgRushYards: 10.8,
            seasonAvgRushTDs: 0.2,
            opponentFantasyPointsAllowed: 27.2,
            opponentPassTDsAllowed: 2.4,
            opponentPassYardsAllowed: 304.0,
            opponentQBRushYardsAllowed: 29.6,
            homeAway: "Home",
            streamingRank: 1,
            yahooOwnership: 19
        },
        {
            name: "Mac Jones",
            team: "SF",
            opponent: "TB",
            lastWeekPassYards: 342,
            lastWeekPassTDs: 2,
            lastWeekRushYards: 5,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 301.67,
            seasonAvgPassTDs: 2.0,
            seasonAvgRushYards: 3.33,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 20.1,
            opponentPassTDsAllowed: 2.0,
            opponentPassYardsAllowed: 234.6,
            opponentQBRushYardsAllowed: 31.6,
            homeAway: "Away",
            streamingRank: 2,
            yahooOwnership: 5
        },
        {
            name: "Sam Darnold",
            team: "SEA",
            opponent: "JAX",
            lastWeekPassYards: 341,
            lastWeekPassTDs: 4,
            lastWeekRushYards: 0,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 249.2,
            seasonAvgPassTDs: 1.8,
            seasonAvgRushYards: 7.6,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 17.5,
            opponentPassTDsAllowed: 1.6,
            opponentPassYardsAllowed: 260.4,
            opponentQBRushYardsAllowed: 27.2,
            homeAway: "Away",
            streamingRank: 3,
            yahooOwnership: 31
        },
    ],
    TE: [
        {
            name: "Evan Engram",
            team: "DEN",
            opponent: "NYJ",
            lastWeekTargets: 6,
            lastWeekReceptions: 4,
            lastWeekYards: 33,
            lastWeekTDs: 1,
            seasonAvgTargets: 4.75,
            seasonAvgReceptions: 3.0,
            seasonAvgYards: 23.75,
            seasonAvgTDs: 0.25,
            opponentFantasyPointsAllowed: 10.0,
            opponentRecYardsAllowed: 40.4,
            opponentRecTDsAllowed: 1.0,
            homeAway: "Away",
            streamingRank: 1,
            yahooOwnership: 49
        },
        {
            name: "Jake Tonges",
            team: "SF",
            opponent: "TB",
            lastWeekTargets: 11,
            lastWeekReceptions: 7,
            lastWeekYards: 41,
            lastWeekTDs: 1,
            seasonAvgTargets: 5.4,
            seasonAvgReceptions: 3.8,
            seasonAvgYards: 33.2,
            seasonAvgTDs: 0.6,
            opponentFantasyPointsAllowed: 9.2,
            opponentRecYardsAllowed: 44.4,
            opponentRecTDsAllowed: 0.8,
            homeAway: "Away",
            streamingRank: 2,
            yahooOwnership: 5
        },
        {
            name: "Colston Loveland",
            team: "CHI",
            opponent: "WAS",
            lastWeekTargets: 3,
            lastWeekReceptions: 1,
            lastWeekYards: 31,
            lastWeekTDs: 0,
            seasonAvgTargets: 2.0,
            seasonAvgReceptions: 1.0,
            seasonAvgYards: 14.33,
            seasonAvgTDs: 0.0,
            opponentFantasyPointsAllowed: 9.3,
            opponentRecYardsAllowed: 65.4,
            opponentRecTDsAllowed: 0.4,
            homeAway: "Away",
            streamingRank: 3,
            yahooOwnership: 27
        },
    ],
    DST: [
        {
            name: "Green Bay Packers",
            team: "GB",
            opponent: "CIN",
            fantasyPointsPerGame: 5.0,
            homeAway: "Home",
            streamingRank: 1,
            yahooOwnership: 52
        },
        {
            name: "Indianapolis Colts",
            team: "IND",
            opponent: "ARI",
            fantasyPointsPerGame: 10.2,
            homeAway: "Home",
            streamingRank: 2,
            yahooOwnership: 50
        },
        {
            name: "Los Angeles Rams",
            team: "LAR",
            opponent: "BAL",
            fantasyPointsPerGame: 6.6,
            homeAway: "Away",
            streamingRank: 3,
            yahooOwnership: 53
        }
    ],
    K: [
        {
            name: "Matt Prater",
            team: "BUF",
            opponent: "ATL",
            fantasyPointsPerGame: 10.0,
            homeAway: "Away",
            streamingRank: 1,
            yahooOwnership: 33
        },
        {
            name: "Brandon McManus",
            team: "GB",
            opponent: "CIN",
            fantasyPointsPerGame: 9.0,
            homeAway: "Home",
            streamingRank: 2,
            yahooOwnership: 14
        },
        {
            name: "Joshua Karty",
            team: "LAR",
            opponent: "BAL",
            fantasyPointsPerGame: 8.8,
            homeAway: "Away",
            streamingRank: 3,
            yahooOwnership: 36
        }
    ]
};

// Helper function to get streamers for a specific position
export const getStreamersForPosition = (position) => {
    return streamersDatabase[position] || [];
};