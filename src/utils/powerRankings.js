// Power rankings for NFL teams
export const offenseRankings = {
    'DET': 1,
    'CIN': 2,
    'PHI': 3,
    'TB': 4,
    'BAL': 5,
    'BUF': 6,
    'KC': 7,
    'SF': 8,
    'CHI': 9,
    'MIN': 10,
    'LAR': 11,
    'MIA': 12,
    'ARI': 13,
    'JAX': 14,
    'DAL': 15,
    'LAC': 16,
    'GB': 17,
    'HOU': 18,
    'ATL': 19,
    'DEN': 20,
    'WAS': 21,
    'LV': 22,
    'IND': 23,
    'NE': 24,
    'SEA': 25,
    'NYJ': 26,
    'CAR': 27,
    'TEN': 28,
    'NO': 29,
    'PIT': 30,
    'NYG': 31,
    'CLE': 32
};

export const defenseRankings = {
    'DEN': 1,
    'HOU': 2,
    'SEA': 3,
    'MIN': 4,
    'GB': 5,
    'BAL': 6,
    'LAC': 7,
    'DET': 8,
    'PHI': 9,
    'CHI': 10,
    'PIT': 11,
    'CLE': 12,
    'NYG': 13,
    'BUF': 14,
    'IND': 15,
    'LV': 16,
    'ATL': 17,
    'NE': 18,
    'KC': 19,
    'ARI': 20,
    'MIA': 21,
    'TB': 22,
    'LAR': 23,
    'NYJ': 24,
    'WAS': 25,
    'SF': 26,
    'NO': 27,
    'TEN': 28,
    'JAX': 29,
    'CAR': 30,
    'DAL': 31,
    'CIN': 32
};

// Helper function to get offense ranking
export const getOffenseRanking = (teamAbbr) => {
    return offenseRankings[teamAbbr] || null;
};

// Helper function to get defense ranking
export const getDefenseRanking = (teamAbbr) => {
    return defenseRankings[teamAbbr] || null;
};
