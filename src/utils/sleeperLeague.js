// League Hub's read-only view of a Sleeper league: standings, weekly
// matchups, and the "fun stat" heuristics shown on the page.
//
// Same deal as src/utils/sleeperSync.js: Sleeper's v1 API is public, needs no
// auth, and allows all origins, so the browser calls it directly — no
// backend proxy in this path. This file reuses that module's base URL rather
// than redefining it.

import { SLEEPER_API } from './sleeperSync';

const request = async (path, { signal } = {}) => {
    let response;
    try {
        response = await fetch(`${SLEEPER_API}${path}`, { signal });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error('Could not reach Sleeper. Check your connection.');
    }

    if (response.status === 404) {
        throw new Error('That Sleeper league could not be found.');
    }
    if (response.status === 429) {
        throw new Error('Sleeper is rate limiting this connection. Retrying...');
    }
    if (!response.ok) {
        throw new Error(`Sleeper returned ${response.status}.`);
    }

    return response.json();
};

export const fetchLeague = (leagueId, options) =>
    request(`/league/${encodeURIComponent(leagueId)}`, options);

export const fetchLeagueRosters = (leagueId, options) =>
    request(`/league/${encodeURIComponent(leagueId)}/rosters`, options);

export const fetchLeagueUsers = (leagueId, options) =>
    request(`/league/${encodeURIComponent(leagueId)}/users`, options);

export const fetchMatchups = (leagueId, week, options) =>
    request(`/league/${encodeURIComponent(leagueId)}/matchups/${week}`, options);

export const fetchNflState = (options) => request('/state/nfl', options);

// Sleeper splits a points total into a whole part and a separate "decimal"
// part on roster season totals (e.g. { fpts: 1487, fpts_decimal: 32 } means
// 1487.32) — matchup-level `points` fields don't have this quirk.
const combinePoints = (whole, decimal) => Number(whole || 0) + Number(decimal || 0) / 100;

export const sleeperAvatarUrl = (avatarId) =>
    avatarId ? `https://sleepercdn.com/avatars/thumbs/${avatarId}` : null;

// Merges rosters (records, points) with users (display names, avatars) into
// one sortable standings table. Sleeper's roster.settings already carries
// the season's win/loss/points totals, so nothing here is recomputed from
// matchup history.
export const buildStandings = (rosters, users) => {
    const usersById = new Map((users || []).map((u) => [u.user_id, u]));

    const rows = (rosters || []).map((roster) => {
        const owner = usersById.get(roster.owner_id);
        const settings = roster.settings || {};
        return {
            rosterId: roster.roster_id,
            ownerId: roster.owner_id,
            teamName: owner?.metadata?.team_name || owner?.display_name || `Team ${roster.roster_id}`,
            managerName: owner?.display_name || null,
            avatarUrl: sleeperAvatarUrl(owner?.avatar),
            wins: settings.wins || 0,
            losses: settings.losses || 0,
            ties: settings.ties || 0,
            pointsFor: combinePoints(settings.fpts, settings.fpts_decimal),
            pointsAgainst: combinePoints(settings.fpts_against, settings.fpts_against_decimal),
        };
    });

    rows.sort((a, b) => (
        b.wins - a.wins
        || a.losses - b.losses
        || b.pointsFor - a.pointsFor
    ));

    return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};

export const mapStandingsByRosterId = (standings) =>
    new Map(standings.map((row) => [row.rosterId, row]));

// Sleeper returns one row per roster per week; this pairs up the two rosters
// sharing a matchup_id. A lone entry (odd team count / a bye) comes back
// with teamB: null rather than being dropped.
export const groupMatchups = (matchupsForWeek) => {
    const byMatchupId = new Map();
    (matchupsForWeek || []).forEach((entry) => {
        const id = entry.matchup_id;
        if (id === null || id === undefined) return;
        if (!byMatchupId.has(id)) byMatchupId.set(id, []);
        byMatchupId.get(id).push(entry);
    });

    return [...byMatchupId.entries()].map(([matchupId, entries]) => {
        const [teamA, teamB = null] = entries;
        const hasScores = teamA && teamB && (teamA.points > 0 || teamB.points > 0);
        return {
            matchupId,
            teamA,
            teamB,
            margin: hasScores ? Math.abs(teamA.points - teamB.points) : null,
            winnerRosterId: hasScores
                ? (teamA.points === teamB.points ? null : (teamA.points > teamB.points ? teamA.roster_id : teamB.roster_id))
                : null,
        };
    });
};

// A week is only worth computing outcome-based stats for once its games have
// actually been played. `nflState.week` is the CURRENT week, so anything
// before it is complete, the current week is still in progress (or hasn't
// started), and anything after it hasn't happened yet.
export const getWeekStatus = (week, nflState) => {
    if (!nflState) return 'unknown';
    if (week < nflState.week) return 'completed';
    if (week === nflState.week) return 'in_progress';
    return 'upcoming';
};

// For a completed (or far-enough-along) week: ranks every team's points that
// week league-wide, then cross-references who actually won or lost.
// - unluckiestLoser: scored top-3 in the league that week, still lost.
// - luckiestWinner: scored bottom-3 in the league that week, still won.
// - closestMatchup / biggestBlowout: smallest / largest final margin.
export const computeWeekStats = (pairedMatchups, standingsByRosterId) => {
    const decided = pairedMatchups.filter((m) => m.teamA && m.teamB && m.margin !== null);
    if (decided.length === 0) return null;

    const scored = [];
    decided.forEach((m) => {
        scored.push({ rosterId: m.teamA.roster_id, points: m.teamA.points, won: m.winnerRosterId === m.teamA.roster_id });
        scored.push({ rosterId: m.teamB.roster_id, points: m.teamB.points, won: m.winnerRosterId === m.teamB.roster_id });
    });
    scored.sort((a, b) => b.points - a.points);

    const withTeam = (entry) => entry && ({ ...entry, team: standingsByRosterId.get(entry.rosterId) || null });

    const topThreeIds = new Set(scored.slice(0, 3).map((e) => e.rosterId));
    const bottomThreeIds = new Set(scored.slice(-3).map((e) => e.rosterId));

    // `scored` is sorted highest points first, so searching top-down finds the
    // most extreme case for the loser (most points among top-3 losers) —
    // but the winner needs the opposite direction (fewest points among
    // bottom-3 winners), so that search runs over the reversed list.
    const unluckiestLoser = withTeam(scored.find((e) => !e.won && topThreeIds.has(e.rosterId)));
    const luckiestWinner = withTeam([...scored].reverse().find((e) => e.won && bottomThreeIds.has(e.rosterId)));

    const closest = decided.reduce((min, m) => (min === null || m.margin < min.margin ? m : min), null);
    const biggest = decided.reduce((max, m) => (max === null || m.margin > max.margin ? m : max), null);

    const withMatchupTeams = (m) => m && ({
        ...m,
        teamAInfo: standingsByRosterId.get(m.teamA.roster_id) || null,
        teamBInfo: standingsByRosterId.get(m.teamB.roster_id) || null,
    });

    return {
        unluckiestLoser: unluckiestLoser || null,
        luckiestWinner: luckiestWinner || null,
        closestMatchup: withMatchupTeams(closest),
        biggestBlowout: withMatchupTeams(biggest),
    };
};

// Pre-week heuristic — Sleeper's public API has no projections, only scores,
// so "Matchup to Watch" for a week that hasn't happened yet has to be based
// on standings rather than predicted points. Tries, in order: two unbeaten
// teams facing off, the league's #1 and #2 meeting, then falls back to
// whichever pairing has the smallest combined rank gap (i.e. two similarly
// strong teams).
export const pickMatchupToWatch = (pairedMatchups, standingsByRosterId) => {
    const withInfo = pairedMatchups
        .filter((m) => m.teamA && m.teamB)
        .map((m) => ({
            ...m,
            teamAInfo: standingsByRosterId.get(m.teamA.roster_id),
            teamBInfo: standingsByRosterId.get(m.teamB.roster_id),
        }))
        .filter((m) => m.teamAInfo && m.teamBInfo);

    if (withInfo.length === 0) return null;

    const bothUnbeaten = withInfo.find((m) => m.teamAInfo.losses === 0 && m.teamBInfo.losses === 0 && m.teamAInfo.ties === 0 && m.teamBInfo.ties === 0);
    if (bothUnbeaten) return { ...bothUnbeaten, reason: 'Both teams are unbeaten' };

    const topTwo = withInfo.find((m) => (
        (m.teamAInfo.rank === 1 && m.teamBInfo.rank === 2)
        || (m.teamAInfo.rank === 2 && m.teamBInfo.rank === 1)
    ));
    if (topTwo) return { ...topTwo, reason: 'The top two teams in the league face off' };

    const closestInStandings = withInfo.reduce((best, m) => {
        const gap = Math.abs(m.teamAInfo.rank - m.teamBInfo.rank);
        return best === null || gap < best.gap ? { ...m, gap } : best;
    }, null);

    return closestInStandings ? { ...closestInStandings, reason: 'Two closely-matched teams meet' } : null;
};
