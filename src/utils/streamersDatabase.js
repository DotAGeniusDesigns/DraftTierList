// Streamers database with weekly streaming options
export const streamersDatabase = {
    QB: [
        {
            name: "Michael Penix Jr.",
            team: "ATL",
            opponent: "MIN",
            lastWeekPassYards: 298,
            lastWeekPassTDs: 1,
            lastWeekRushYards: 21,
            lastWeekRushTDs: 1,
            seasonAvgPassYards: 298.0,
            seasonAvgPassTDs: 1.0,
            seasonAvgRushYards: 21.0,
            seasonAvgRushTDs: 1.0,
            opponentFantasyPointsAllowed: 15.2,
            opponentPassTDsAllowed: 1.0,
            opponentPassYardsAllowed: 198.0,
            opponentQBRushYardsAllowed: 58.0,
            homeAway: "Away",
            streamingRank: 1
        },
        {
            name: "Geno Smith",
            team: "LV",
            opponent: "LAC",
            lastWeekPassYards: 362,
            lastWeekPassTDs: 1,
            lastWeekRushYards: 10,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 362.0,
            seasonAvgPassTDs: 1.0,
            seasonAvgRushYards: 10.0,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 16.0,
            opponentPassTDsAllowed: 1.0,
            opponentPassYardsAllowed: 249.0,
            opponentQBRushYardsAllowed: 57.0,
            homeAway: "Home",
            streamingRank: 2
        },
        {
            name: "Aaron Rodgers",
            team: "PIT",
            opponent: "SEA",
            lastWeekPassYards: 244,
            lastWeekPassTDs: 4,
            lastWeekRushYards: -1,
            lastWeekRushTDs: 0,
            seasonAvgPassYards: 244.0,
            seasonAvgPassTDs: 4.0,
            seasonAvgRushYards: -1.0,
            seasonAvgRushTDs: 0.0,
            opponentFantasyPointsAllowed: 18.0,
            opponentPassTDsAllowed: 2.0,
            opponentPassYardsAllowed: 265.0,
            opponentQBRushYardsAllowed: 17.0,
            homeAway: "Home",
            streamingRank: 3
        }
    ],
    TE: [
        {
            name: "Jonnu Smith",
            team: "PIT",
            opponent: "SEA",
            lastWeekTargets: 6,
            lastWeekReceptions: 5,
            lastWeekYards: 15,
            lastWeekTDs: 1,
            seasonAvgTargets: 6.0,
            seasonAvgReceptions: 5.0,
            seasonAvgYards: 15.0,
            seasonAvgTDs: 1.0,
            opponentFantasyPointsAllowed: 16.4,
            opponentRecYardsAllowed: 44.0,
            opponentRecTDsAllowed: 2.0,
            homeAway: "Home",
            streamingRank: 1
        },
        {
            name: "Harold Fannin Jr.",
            team: "CLE",
            opponent: "BAL",
            lastWeekTargets: 9,
            lastWeekReceptions: 7,
            lastWeekYards: 63,
            lastWeekTDs: 0,
            seasonAvgTargets: 9.0,
            seasonAvgReceptions: 7.0,
            seasonAvgYards: 63.0,
            seasonAvgTDs: 0.0,
            opponentFantasyPointsAllowed: 15.7,
            opponentRecYardsAllowed: 97.0,
            opponentRecTDsAllowed: 1.0,
            homeAway: "Away",
            streamingRank: 2
        },
        {
            name: "Brenton Strange",
            team: "JAX",
            opponent: "CIN",
            lastWeekTargets: 4,
            lastWeekReceptions: 4,
            lastWeekYards: 59,
            lastWeekTDs: 0,
            seasonAvgTargets: 4.0,
            seasonAvgReceptions: 4.0,
            seasonAvgYards: 59.0,
            seasonAvgTDs: 0.0,
            opponentFantasyPointsAllowed: 10.3,
            opponentRecYardsAllowed: 100.0,
            opponentRecTDsAllowed: 0.0,
            homeAway: "Away",
            streamingRank: 3
        }
    ],
    DST: [
        {
            name: "Arizona Cardinals",
            team: "ARI",
            opponent: "CAR",
            fantasyPointsPerGame: 5.0,
            homeAway: "Home",
            streamingRank: 1
        },
        {
            name: "New England Patriots",
            team: "NE",
            opponent: "MIA",
            fantasyPointsPerGame: 7.0,
            homeAway: "Away",
            streamingRank: 2
        },
        {
            name: "Dallas Cowboys",
            team: "DAL",
            opponent: "NYG",
            fantasyPointsPerGame: 1.0,
            homeAway: "Home",
            streamingRank: 3
        }
    ],
    K: [
        {
            name: "Tyler Loop",
            team: "BAL",
            opponent: "CLE",
            fantasyPointsPerGame: 13.0,
            homeAway: "Home",
            streamingRank: 1
        },
        {
            name: "Cam Little",
            team: "JAX",
            opponent: "CIN",
            fantasyPointsPerGame: 15.0,
            homeAway: "Away",
            streamingRank: 2
        },
        {
            name: "Matt Prater",
            team: "BUF",
            opponent: "NYJ",
            fantasyPointsPerGame: 12.0,
            homeAway: "Away",
            streamingRank: 3
        }
    ]
};

// Helper function to get streamers for a specific position
export const getStreamersForPosition = (position) => {
    return streamersDatabase[position] || [];
};