const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);

export function normalizeSearchText(text) {
    return text
        .toLowerCase()
        .replace(/[.'`]/g, '')
        .replace(/-/g, ' ')
        .split(/\s+/)
        .filter((token) => token && !SUFFIXES.has(token))
        .join(' ')
        .trim();
}

export function findPlayers(query, players, limit = 8) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return [];

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return players
        .map((player) => {
            const normalizedName = normalizeSearchText(player.name);
            const matchesAllTokens = tokens.every((token) => normalizedName.includes(token));
            if (!matchesAllTokens) return null;

            const startsWith = normalizedName.startsWith(tokens[0]) ? 0 : 1;
            const exact = normalizedName === normalizedQuery ? 0 : 1;
            const rank = player.ecr ?? 9999;

            return { player, score: exact * 1000 + startsWith * 100 + rank };
        })
        .filter(Boolean)
        .sort((a, b) => a.score - b.score)
        .slice(0, limit)
        .map((entry) => entry.player);
}
