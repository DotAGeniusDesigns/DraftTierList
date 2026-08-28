// Draft grader: turns a roster into an expected points-per-week number and
// grades it against what an average team in the same league would score.
//
// Everything here runs on the Draft Kit's projections, so it inherits their
// scope: half-PPR only, and a projected points-per-game rather than a week-by-
// week forecast. What IS week-by-week is availability — byes come off the real
// schedule and injuries off their return date — which is where most of the
// difference between two similar-looking rosters actually comes from.

import { SEASON } from './projectionModel';
import { injuryReport } from './injuryReport';
import { playerStats } from './playerStats';
import { buildProjections, REPLACEMENT_RANK } from './draftScore';

// How far a matchup can move a player, in points per game either way — measured
// per position rather than assumed, and NOT the same number for each.
//
// This was one flat 3 for every position, on the reasoning that the signal is
// thin so the swing should be held tight. The reasoning was right and the number
// was not: 3 is between three and fifteen times too large.
//
// `scripts/analysis/defense.py` measures it directly. For every player-week
// 2016-2025 it takes the player's deviation from his own season mean (so a
// defence cannot look good merely for having faced weak offences) against the
// opponent's PRIOR-season rank versus that position — prior season being what is
// knowable when a schedule is set. The regression slope from softest to stiffest
// defence IS the swing, in points, and half of it is the plus-or-minus:
//
//     QB  slope +2.02  (p=6e-08, n=4,874)   ->  ±1.01
//     RB  slope +1.16  (p=2e-10, n=12,910)  ->  ±0.58
//     TE  slope +0.43  (p=5e-03, n=9,914)   ->  ±0.22
//     WR  slope +0.38  (p=4e-03, n=20,801)  ->  ±0.19
//
// Every slope is positive, so the direction is right everywhere: a worse defence
// does concede more. But QB is five times the WR figure. A quarterback faces the
// whole defence and his week is one passing performance; a receiver's week is
// dominated by target and touchdown noise that swamps the matchup entirely.
//
// Note the ordering does NOT follow how well a defensive rating persists
// year-over-year (RB +0.320, QB +0.243, WR +0.195, TE +0.165). Persistence says
// whether you can know the matchup in advance; the slope says whether knowing it
// changes anything. They are different questions and they rank differently.
//
// These are a floor: the grader ranks defences by the board's forward-looking
// consensus ECR, which ought to beat the prior-season points-allowed ranking
// used to measure this. Historical ECR is not available to check that, so the
// measured number is used as-is rather than inflated on a hunch.
export const MATCHUP_SWING = { QB: 1.0, RB: 0.6, TE: 0.2, WR: 0.2 };

// Largest swing any position carries — for copy and for bounds assertions.
export const MAX_MATCHUP_SWING = Math.max(...Object.values(MATCHUP_SWING));

// The board writes the Rams LAR; the schedule feed writes them LA. Same trap the
// Draft Kit's team-change flag hit, same fix.
const TEAM_ALIASES = { LAR: 'LA', LVR: 'LV', JAC: 'JAX', WSH: 'WAS', ARZ: 'ARI' };
const canonicalTeam = (team) => {
    if (!team || team === 'FA') return undefined;
    const upper = String(team).toUpperCase();
    return TEAM_ALIASES[upper] || upper;
};

export const FLEX_POSITIONS = ['RB', 'WR', 'TE'];
export const SUPERFLEX_POSITIONS = ['QB', 'RB', 'WR', 'TE'];

// Slot types a league can start. `eligible: null` means the slot is a bench
// spot and never scores.
export const SLOT_TYPES = {
    QB: { label: 'QB', eligible: ['QB'] },
    RB: { label: 'RB', eligible: ['RB'] },
    WR: { label: 'WR', eligible: ['WR'] },
    TE: { label: 'TE', eligible: ['TE'] },
    FLEX: { label: 'FLEX', eligible: FLEX_POSITIONS },
    SUPERFLEX: { label: 'SUPERFLEX', eligible: SUPERFLEX_POSITIONS },
};

export const DEFAULT_LEAGUE = {
    teams: 12,
    slots: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 0 },
};

/** Slot keys in fill order: the most constrained first, flex last. */
const fillOrder = (slots) => {
    const out = [];
    ['QB', 'RB', 'WR', 'TE', 'FLEX', 'SUPERFLEX'].forEach((key) => {
        for (let i = 0; i < (slots[key] || 0); i += 1) out.push(key);
    });
    return out;
};

export const startingSlotCount = (slots) =>
    Object.entries(slots).reduce((n, [, count]) => n + (count || 0), 0);

/**
 * How much each defence moves an opposing player, from the board's own 2026
 * team-defence ranks.
 *
 * The ranking has to be forward-looking — last season's points allowed is a
 * record of a roster that has since changed, and it barely predicts itself
 * anyway. The board already carries a consensus 2026 rank for each team defence,
 * which is the market's view of how good that unit will be THIS year, and it
 * updates whenever the board does.
 *
 * Returns a unitless SHARE per team, running -1 for the best defence on the
 * board to +1 for the worst. It is not in points, because the points depend on
 * who is being matched up: `weeklyPoints` scales this by MATCHUP_SWING for the
 * player's own position, which differs fivefold between QB and WR.
 *
 * Rank position is used rather than the raw consensus number because the gaps
 * between ranks are uneven and would otherwise bunch most teams around zero. A
 * team with no ranked defence is neutral.
 */
export const defenseAdjustments = (allPlayers) => {
    const ranked = (allPlayers || [])
        .filter((p) => p.position === 'DST' && p.ecr && canonicalTeam(p.team))
        .sort((a, b) => a.ecr - b.ecr);
    const map = {};
    if (ranked.length < 2) return map;
    ranked.forEach((player, i) => {
        map[canonicalTeam(player.team)] = -1 + 2 * (i / (ranked.length - 1));
    });
    return map;
};

/** The opponent a player faces in a given week, or undefined on his bye. */
export const opponentFor = (player, week) =>
    SEASON.schedule?.[canonicalTeam(player?.team)]?.[String(week)];

/**
 * The player's bye week, keyed through the same alias map as the schedule.
 * `SEASON.byes` is written in nflverse abbreviations (the Rams are LA), so a
 * raw board team (LAR) looked up directly never matches — which silently gave
 * every Rams player an 18-game schedule.
 */
export const byeWeek = (team) => SEASON.byes?.[canonicalTeam(team)];

// Week kickoff dates, parsed once — `isAvailable` runs per player per week per
// grade, and re-parsing the same 18 date strings each call added up to nothing
// but waste.
const WEEK_KICKOFFS = (SEASON.weeks || []).map((day) => Date.parse(`${day}T00:00:00Z`));

/**
 * A player's expected points in one week: his rate, moved by who he plays.
 * Floored at zero — no matchup is bad enough to score negative.
 *
 * The opponent's share is scaled by the swing measured for THIS player's
 * position, so the same defence moves a quarterback by up to a point and a
 * receiver by a fifth of one. A position with no measured swing does not move.
 */
export const weeklyPoints = (row, week, adjustments) => {
    const base = row.projection.ppg;
    const opponent = opponentFor(row.player, week);
    const share = (opponent && adjustments?.[opponent]) || 0;
    const adjust = share * (MATCHUP_SWING[row.player?.position] ?? 0);
    return { points: Math.max(0, base + adjust), opponent, adjust };
};

/**
 * Is the player on the field in this week?
 *
 * Two ways to be out: his team is on its bye, or his injury has not cleared. The
 * injury side reuses the Draft Kit's rule — the return date is what separates a
 * knock that costs nothing from a knee that costs a month — but applies it a week
 * at a time rather than as a season total.
 */
export const isAvailable = (player, week) => {
    if (!player) return false;
    if (byeWeek(player.team) === week) return false;
    const injury = injuryReport[player.id];
    if (injury?.returnDate) {
        const kickoff = WEEK_KICKOFFS[week - 1];
        if (kickoff && kickoff < Date.parse(`${injury.returnDate}T00:00:00Z`)) {
            return false;
        }
    }
    return true;
};

/**
 * What a streamer is worth at each position.
 *
 * `REPLACEMENT_RANK` is already this codebase's definition of the waiver line —
 * "starters absorbed at each position before the waiver wire in a 12-team
 * league" — so a free pickup is the player sitting at it. Averaging the next
 * `teams` players from that rank rather than taking the single one at it keeps
 * the number off any one projection, and the rank scales with league size
 * because a shallower league leaves better players unrostered.
 */
export const streamerLevels = (allRows, league) => {
    const teams = league?.teams || DEFAULT_LEAGUE.teams;
    const byPosition = {};
    allRows.forEach((row) => {
        (byPosition[row.player.position] ||= []).push(row);
    });
    const levels = {};
    Object.entries(REPLACEMENT_RANK).forEach(([position, rank12]) => {
        const list = (byPosition[position] || []).sort((a, b) => b.projection.ppg - a.projection.ppg);
        const start = Math.max(0, Math.round((rank12 * teams) / 12) - 1);
        const pool = list.slice(start, start + teams);
        levels[position] = pool.length
            ? pool.reduce((sum, r) => sum + r.projection.ppg, 0) / pool.length
            : 0;
    });
    return levels;
};

const streamerFor = (eligible, levels) =>
    eligible.reduce((best, position) => Math.max(best, levels?.[position] ?? 0), 0);

/**
 * Best legal lineup from the players available, and what it scores.
 *
 * Greedy is optimal here because the slot types are nested — every flex-eligible
 * player is also eligible for his own position's slot — so filling the dedicated
 * slots first with the best at each position never strands a better flex option.
 *
 * A slot with nobody eligible is filled by a streamer rather than scored as a
 * zero. Nobody actually leaves a lineup spot empty on a bye week; they pick up
 * whoever is on waivers, and pretending otherwise makes a bye look like a
 * catastrophe instead of the mild tax it is.
 */
export const bestLineup = (rows, slots, levels, scoreOf) => {
    const score = scoreOf || ((row) => ({ points: row.projection.ppg }));
    // A player's score doesn't depend on which slot he fills, so score each row
    // once instead of once per slot.
    const scores = new Map(rows.map((row) => [row.player.id, score(row)]));
    const order = fillOrder(slots);
    const taken = new Set();
    const lineup = [];
    let points = 0;
    let streamed = 0;
    order.forEach((slotKey) => {
        const eligible = SLOT_TYPES[slotKey].eligible;
        let pick = null;
        let best = null;
        rows.forEach((row) => {
            if (taken.has(row.player.id)) return;
            if (!eligible.includes(row.player.position)) return;
            // Scored on the matchup-adjusted number, not the season rate, so a
            // brutal draw can genuinely bench a player behind a team-mate.
            const scored = scores.get(row.player.id);
            if (!pick || scored.points > best.points) { pick = row; best = scored; }
        });
        if (pick) {
            taken.add(pick.player.id);
            points += best.points;
            lineup.push({ slot: slotKey, row: pick, streamer: false, ...best });
            return;
        }
        const streamerPoints = levels ? streamerFor(eligible, levels) : 0;
        points += streamerPoints;
        streamed += 1;
        lineup.push({ slot: slotKey, row: null, streamer: true, streamerPoints });
    });
    return { lineup, points, streamed, benched: rows.filter((r) => !taken.has(r.player.id)) };
};

/**
 * Week-by-week: who is available, who starts, what it scores.
 */
export const gradeWeeks = (rows, slots, levels, adjustments) => {
    const weeks = [];
    const count = SEASON.weeks?.length || 18;
    for (let week = 1; week <= count; week += 1) {
        const available = [];
        const unavailable = [];
        rows.forEach((row) => {
            (isAvailable(row.player, week) ? available : unavailable).push(row);
        });
        const { lineup, points, streamed } = bestLineup(
            available, slots, levels, (row) => weeklyPoints(row, week, adjustments),
        );
        weeks.push({
            week,
            points,
            lineup,
            // How many slots had to be streamed is the thing a bye-week pile-up
            // actually looks like, so it is surfaced rather than folded into a
            // lower score.
            streamed,
            unavailable,
        });
    }
    return weeks;
};

/**
 * What an average team in this league scores in a week.
 *
 * The starters at a position across the whole league are, near enough, the top
 * `slots x teams` players at it. Averaging that group gives the points an average
 * manager gets from that slot, and summing over slots gives the team. Flex is
 * taken from the best remaining flex-eligible players after the dedicated slots
 * are accounted for, which is what the flex actually is.
 */
export const leagueAverage = (allRows, league) => {
    const { teams, slots } = league;
    const byPosition = {};
    allRows.forEach((row) => {
        (byPosition[row.player.position] ||= []).push(row);
    });
    Object.values(byPosition).forEach((list) => list.sort((a, b) => b.projection.ppg - a.projection.ppg));

    const consumed = {};
    const parts = [];
    ['QB', 'RB', 'WR', 'TE'].forEach((position) => {
        const count = (slots[position] || 0) * teams;
        if (!count) return;
        const pool = (byPosition[position] || []).slice(0, count);
        consumed[position] = count;
        if (pool.length) {
            parts.push({
                slot: position,
                perTeam: slots[position],
                average: pool.reduce((sum, r) => sum + r.projection.ppg, 0) / pool.length,
            });
        }
    });
    [['FLEX', FLEX_POSITIONS], ['SUPERFLEX', SUPERFLEX_POSITIONS]].forEach(([key, eligible]) => {
        const count = (slots[key] || 0) * teams;
        if (!count) return;
        const pool = eligible
            .flatMap((position) => (byPosition[position] || []).slice(consumed[position] || 0))
            .sort((a, b) => b.projection.ppg - a.projection.ppg)
            .slice(0, count);
        eligible.forEach((position) => {
            const used = pool.filter((r) => r.player.position === position).length;
            consumed[position] = (consumed[position] || 0) + used;
        });
        if (pool.length) {
            parts.push({
                slot: key,
                perTeam: slots[key],
                average: pool.reduce((sum, r) => sum + r.projection.ppg, 0) / pool.length,
            });
        }
    });
    const total = parts.reduce((sum, p) => sum + p.average * p.perTeam, 0);
    return { total, parts };
};

// Grades are cut on the differential itself, in points per week, rather than on
// a percentile. A five-point-a-week edge is about half a win over a season, and
// that is the unit a manager can actually feel.
const GRADE_CUTS = [
    [12, 'A+'], [8, 'A'], [5, 'A-'], [3, 'B+'], [1.5, 'B'], [0, 'B-'],
    [-1.5, 'C+'], [-3, 'C'], [-5, 'C-'], [-8, 'D'], [-Infinity, 'F'],
];

export const gradeFor = (differential) =>
    GRADE_CUTS.find(([cut]) => differential >= cut)?.[1] ?? 'F';

/**
 * The whole grade for one roster.
 *
 * `allPlayers` is the full board, not the roster: the league average and every
 * projection have to be computed off the whole player pool, the same rule the
 * Draft Kit follows.
 */
export const gradeRoster = (roster, allPlayers, league = DEFAULT_LEAGUE) => {
    const scored = buildProjections(allPlayers);
    const byId = new Map(scored.map((row) => [row.player.id, row]));
    const rows = roster.map((id) => byId.get(id)).filter(Boolean);
    const missing = roster.filter((id) => !byId.has(id));

    const streamers = streamerLevels(scored, league);
    const matchups = defenseAdjustments(allPlayers);
    const weeks = gradeWeeks(rows, league.slots, streamers, matchups);
    const played = weeks.filter((w) => w.points > 0);
    const perWeek = played.length
        ? played.reduce((sum, w) => sum + w.points, 0) / played.length
        : 0;
    const average = leagueAverage(scored, league);
    const differential = perWeek - average.total;

    return {
        rows,
        missing,
        weeks,
        perWeek,
        average,
        differential,
        streamers,
        matchups,
        grade: gradeFor(differential),
        starters: startingSlotCount(league.slots),
        // Best and worst weeks are what a bye-week pile-up looks like from the
        // outside, so they are reported rather than averaged away.
        bestWeek: played.reduce((best, w) => (!best || w.points > best.points ? w : best), null),
        worstWeek: played.reduce((worst, w) => (!worst || w.points < worst.points ? w : worst), null),
    };
};


// ---------------------------------------------------------------------------
// Sleeper import.
//
// Sleeper hands back a roster as a list of its own player ids. `playerStats`
// already carries a `sleeperId` per board player because the stat feed is keyed
// on it, so the map falls out of data that is loaded anyway rather than needing
// a second lookup table.

const sleeperIndex = () => {
    const index = new Map();
    Object.entries(playerStats).forEach(([boardId, entry]) => {
        if (entry?.sleeperId) index.set(String(entry.sleeperId), boardId);
    });
    return index;
};

export const rosterFromSleeper = (sleeperPlayerIds) => {
    const index = sleeperIndex();
    const matched = [];
    const unmatched = [];
    (sleeperPlayerIds || []).forEach((id) => {
        const boardId = index.get(String(id));
        if (boardId) matched.push(boardId);
        else unmatched.push(String(id));
    });
    return { matched, unmatched };
};

/**
 * League settings from a Sleeper league object.
 *
 * `roster_positions` is a flat list with one entry per slot, bench and IR
 * included, so the starting slots are whatever is left after those are dropped.
 * Anything Sleeper starts that this page does not model (kickers, defenses,
 * individual defensive players) is reported rather than silently ignored — a
 * grade that quietly drops two starting slots is worse than one that says so.
 */
export const leagueFromSleeper = (league) => {
    const slots = { QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, SUPERFLEX: 0 };
    const unsupported = {};
    (league?.roster_positions || []).forEach((raw) => {
        const key = String(raw).toUpperCase();
        if (key === 'BN' || key === 'IR' || key === 'TAXI') return;
        if (key === 'SUPER_FLEX' || key === 'SUPERFLEX') { slots.SUPERFLEX += 1; return; }
        if (key === 'FLEX' || key === 'REC_FLEX' || key === 'WRRB_FLEX') { slots.FLEX += 1; return; }
        if (slots[key] !== undefined) { slots[key] += 1; return; }
        unsupported[key] = (unsupported[key] || 0) + 1;
    });
    return {
        teams: league?.total_rosters || DEFAULT_LEAGUE.teams,
        slots,
        unsupported,
        name: league?.name || '',
    };
};
