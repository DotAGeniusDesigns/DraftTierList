// Power rankings for NFL teams
export const offenseRankings = {
    'IND': 1,
    'DET': 2,
    'BUF': 3,
    'BAL': 4,
    'TB': 5,
    'KC': 6,
    'WAS': 7,
    'GB': 8,
    'DAL': 9,
    'ARI': 10,
    'LAC': 11,
    'PHI': 12,
    'LAR': 13,
    'SF': 14,
    'JAX': 15,
    'CHI': 16,
    'NE': 17,
    'SEA': 18,
    'MIA': 19,
    'DEN': 20,
    'PIT': 21,
    'NYJ': 22,
    'CAR': 23,
    'LV': 24,
    'NO': 25,
    'NYG': 26,
    'ATL': 27,
    'HOU': 28,
    'MIN': 29,
    'CLE': 30,
    'TEN': 31,
    'CIN': 32
};

export const defenseRankings = {
    'CLE': 1,
    'ATL': 2,
    'GB': 3,
    'SF': 4,
    'LAR': 5,
    'MIN': 6,
    'IND': 7,
    'LAC': 8,
    'BUF': 9,
    'JAX': 10,
    'KC': 11,
    'TB': 12,
    'DET': 13,
    'SEA': 14,
    'NO': 15,
    'HOU': 16,
    'NE': 17,
    'PHI': 18,
    'DEN': 19,
    'WAS': 20,
    'CAR': 21,
    'NYJ': 22,
    'ARI': 23,
    'LV': 24,
    'CIN': 25,
    'MIA': 26,
    'TEN': 27,
    'PIT': 28,
    'CHI': 29,
    'DAL': 30,
    'NYG': 31,
    'BAL': 32
};

// Helper function to get offense ranking
export const getOffenseRanking = (teamAbbr) => {
    return offenseRankings[teamAbbr] || null;
};

// Helper function to get defense ranking
export const getDefenseRanking = (teamAbbr) => {
    return defenseRankings[teamAbbr] || null;
};
