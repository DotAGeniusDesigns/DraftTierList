// Streamers database with weekly streaming options
export const streamersDatabase = {
    QB: [
        {
            name: "Tua Tagovailoa",
            team: "MIA",
            opponent: "BUF",
            lastWeekPassYards: 315,
            lastWeekPassTDs: 2,
            lastWeekRushYards: 0,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 214.5,
            seasonAvgPassTDs: 1.5,
            seasonAvgRushYards: 0.0,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 20.8,
            opponentPassTDsAllowed: 3.0,
            opponentPassYardsAllowed: 292.0,
            opponentQBRushYardsAllowed: 140.0,
            homeAway: "Away",
            streamingRank: 1
        },
        {
            name: "Sam Darnold",
            team: "SEA",
            opponent: "NO",
            lastWeekPassYards: 295,
            lastWeekPassTDs: 2,
            lastWeekRushYards: 0,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 222.5,
            seasonAvgPassTDs: 1.0,
            seasonAvgRushYards: 7.0,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 20.0,
            opponentPassTDsAllowed: 5.0,
            opponentPassYardsAllowed: 442.0,
            opponentQBRushYardsAllowed: 44.0,
            homeAway: "Home",
            streamingRank: 2
        },
        {
            name: "Russell Wilson",
            team: "NYG",
            opponent: "KC",
            lastWeekPassYards: 450,
            lastWeekPassTDs: 3,
            lastWeekRushYards: 23,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 309.0,
            seasonAvgPassTDs: 1.5,
            seasonAvgRushYards: 33.5,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 19.7,
            opponentPassTDsAllowed: 3.0,
            opponentPassYardsAllowed: 419.0,
            opponentQBRushYardsAllowed: 47.0,
            homeAway: "Home",
            streamingRank: 3
        }
    ],
    TE: [
        {
            name: "Harold Fannin Jr.",
            team: "CLE",
            opponent: "GB",
            lastWeekTargets: 5,
            lastWeekReceptions: 5,
            lastWeekYards: 48,
            lastWeekTDs: 0,
            seasonAvgTargets: 7.0,
            seasonAvgReceptions: 6.0,
            seasonAvgYards: 55.5,
            seasonAvgTDs: 0.0,
            opponentFantasyPointsAllowed: 10.5,
            opponentRecYardsAllowed: 150.0,
            opponentRecTDsAllowed: 1.0,
            homeAway: "Home",
            streamingRank: 1
        },
        {
            name: "Cade Otton",
            team: "TB",
            opponent: "NYJ",
            lastWeekTargets: 4,
            lastWeekReceptions: 3,
            lastWeekYards: 25,
            lastWeekTDs: 0,
            seasonAvgTargets: 3.5,
            seasonAvgReceptions: 1.5,
            seasonAvgYards: 12.5,
            seasonAvgTDs: 0.0,
            opponentFantasyPointsAllowed: 8.2,
            opponentRecYardsAllowed: 104.0,
            opponentRecTDsAllowed: 1.0,
            homeAway: "Home",
            streamingRank: 2
        },
        {
            name: "Jake Tonges",
            team: "SF",
            opponent: "ARI",
            lastWeekTargets: 5,
            lastWeekReceptions: 4,
            lastWeekYards: 31,
            lastWeekTDs: 0,
            seasonAvgTargets: 4.0,
            seasonAvgReceptions: 3.5,
            seasonAvgYards: 23.0,
            seasonAvgTDs: 0.5,
            opponentFantasyPointsAllowed: 8.0,
            opponentRecYardsAllowed: 159.0,
            opponentRecTDsAllowed: 0.0,
            homeAway: "Home",
            streamingRank: 3
        }
    ],
    DST: [
        {
            name: "Seattle Seahawks",
            team: "SEA",
            opponent: "NO",
            fantasyPointsPerGame: 11.0,
            homeAway: "Home",
            streamingRank: 1
        },
        {
            name: "Atlanta Falcons",
            team: "ATL",
            opponent: "CAR",
            fantasyPointsPerGame: 11.0,
            homeAway: "Away",
            streamingRank: 2
        },
        {
            name: "Jacksonville Jaguars",
            team: "JAX",
            opponent: "HOU",
            fantasyPointsPerGame: 9.5,
            homeAway: "Home",
            streamingRank: 3
        }
    ],
    K: [
        {
            name: "Matt Prater",
            team: "BUF",
            opponent: "MIA",
            fantasyPointsPerGame: 13.0,
            homeAway: "Home",
            streamingRank: 1
        },
        {
            name: "Cam Little",
            team: "JAX",
            opponent: "HOU",
            fantasyPointsPerGame: 12.5,
            homeAway: "Home",
            streamingRank: 2
        },
        {
            name: "Spencer Shrader",
            team: "IND",
            opponent: "TEN",
            fantasyPointsPerGame: 17.0,
            homeAway: "Away",
            streamingRank: 3
        }
    ]
};

// Helper function to get streamers for a specific position
export const getStreamersForPosition = (position) => {
    return streamersDatabase[position] || [];
};