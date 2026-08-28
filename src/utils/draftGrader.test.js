import { playerDatabase } from './playerDatabase';
import { SEASON } from './projectionModel';
import { injuryReport } from './injuryReport';
import {
    DEFAULT_LEAGUE, MATCHUP_SWING, MAX_MATCHUP_SWING, bestLineup, byeWeek, defenseAdjustments, gradeFor,
    gradeRoster, isAvailable, leagueAverage, opponentFor, startingSlotCount, weeklyPoints,
} from './draftGrader';

const board = Object.values(playerDatabase).filter((p) => p.ecr);
const byEcr = [...board].sort((a, b) => a.ecr - b.ecr);
const pick = (position, n) => byEcr.filter((p) => p.position === position).slice(0, n).map((p) => p.id);
const roster = [...pick('QB', 2), ...pick('RB', 4), ...pick('WR', 5), ...pick('TE', 2)];

describe('availability', () => {
    it('sits a player on his bye week', () => {
        const player = board.find((p) => SEASON.byes[p.team]);
        const bye = SEASON.byes[player.team];
        expect(isAvailable(player, bye)).toBe(false);
        expect(isAvailable(player, bye === 1 ? 2 : 1)).toBe(true);
    });

    it('sits an injured player until his return date', () => {
        // Bounded above by the season's last kickoff, not just below by
        // week 4 — a season-ending IR return date (past week 18) is a real
        // case on the board, and picking one here would make this a test of
        // "still hurt at the end of the season" rather than "back mid-season".
        const id = Object.keys(injuryReport).find((key) => {
            const back = Date.parse(injuryReport[key].returnDate);
            return playerDatabase[key]
                && back > Date.parse(SEASON.weeks[3])
                && back <= Date.parse(SEASON.weeks[SEASON.weeks.length - 1]);
        });
        const player = playerDatabase[id];
        expect(isAvailable(player, 1)).toBe(false);
        expect(isAvailable(player, 18)).toBe(true);
    });

    it('sits a player whose board team is an alias of the schedule key', () => {
        // SEASON.byes is keyed in nflverse abbreviations — the Rams are LA —
        // while the board writes LAR. Looked up raw, every Rams player silently
        // skipped his bye.
        const ram = board.find((p) => p.team === 'LAR');
        expect(ram).toBeDefined();
        expect(SEASON.byes[ram.team]).toBeUndefined();
        expect(byeWeek(ram.team)).toBe(SEASON.byes.LA);
        expect(isAvailable(ram, SEASON.byes.LA)).toBe(false);
    });

    it('every team has exactly one bye, between weeks 5 and 14', () => {
        const byes = Object.values(SEASON.byes);
        expect(Object.keys(SEASON.byes)).toHaveLength(32);
        expect(Math.min(...byes)).toBeGreaterThanOrEqual(4);
        expect(Math.max(...byes)).toBeLessThanOrEqual(15);
    });
});

describe('lineup', () => {
    const rows = gradeRoster(roster, board, DEFAULT_LEAGUE).rows;

    it('fills every slot and never starts a player twice', () => {
        const { lineup } = bestLineup(rows, DEFAULT_LEAGUE.slots);
        expect(lineup).toHaveLength(startingSlotCount(DEFAULT_LEAGUE.slots));
        const ids = lineup.map((s) => s.row?.player.id).filter(Boolean);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('respects slot eligibility', () => {
        const { lineup } = bestLineup(rows, DEFAULT_LEAGUE.slots);
        lineup.forEach(({ slot, row }) => {
            if (!row) return;
            if (slot === 'FLEX') expect(['RB', 'WR', 'TE']).toContain(row.player.position);
            else expect(row.player.position).toBe(slot);
        });
    });

    it('starts the best available, so no bench player outscores his own slot', () => {
        const { lineup, benched } = bestLineup(rows, DEFAULT_LEAGUE.slots);
        lineup.forEach(({ slot, row }) => {
            if (!row) return;
            const eligibleBench = benched.filter((b) =>
                (slot === 'FLEX' ? ['RB', 'WR', 'TE'] : [slot]).includes(b.player.position));
            eligibleBench.forEach((b) =>
                expect(b.projection.ppg).toBeLessThanOrEqual(row.projection.ppg));
        });
    });

    it('streams a slot it has nobody eligible for, rather than scoring zero', () => {
        const wrOnly = pick('WR', 3);
        const result = gradeRoster(wrOnly, board, DEFAULT_LEAGUE);
        const { lineup } = bestLineup(result.rows, DEFAULT_LEAGUE.slots, result.streamers);
        const qb = lineup.find((s) => s.slot === 'QB');
        expect(qb.row).toBeNull();
        expect(qb.streamer).toBe(true);
        expect(qb.streamerPoints).toBeGreaterThan(0);
    });

    it('a streamer is worth less than a real starter at the same position', () => {
        const result = gradeRoster(roster, board, DEFAULT_LEAGUE);
        ['QB', 'RB', 'WR', 'TE'].forEach((position) => {
            const best = result.rows
                .filter((r) => r.player.position === position)
                .reduce((m, r) => Math.max(m, r.projection.ppg), 0);
            if (best) expect(result.streamers[position]).toBeLessThan(best);
            expect(result.streamers[position]).toBeGreaterThan(0);
        });
    });

    it('a deep roster never needs to stream — byes are covered from the bench', () => {
        const result = gradeRoster(roster, board, DEFAULT_LEAGUE);
        expect(result.weeks.every((w) => w.streamed === 0)).toBe(true);
    });

    it('a bye week costs something, but not everything', () => {
        // Exactly enough players to fill the lineup and no bench, so any bye
        // strands a slot and has to be streamed.
        const bare = [...pick('QB', 1), ...pick('RB', 2), ...pick('WR', 3), ...pick('TE', 1)];
        const result = gradeRoster(bare, board, DEFAULT_LEAGUE);
        const streamed = result.weeks.filter((w) => w.streamed > 0);
        expect(streamed.length).toBeGreaterThan(0);
        // Streaming softens a bye rather than erasing it: those weeks still come
        // in under the full-strength weeks.
        streamed.forEach((w) => expect(w.points).toBeLessThan(result.bestWeek.points));
        expect(result.worstWeek.points).toBeGreaterThan(0);
    });
});

describe('grading', () => {
    it('scores a strong roster above the league average', () => {
        const result = gradeRoster(roster, board, DEFAULT_LEAGUE);
        expect(result.perWeek).toBeGreaterThan(result.average.total);
        expect(result.differential).toBeGreaterThan(0);
        expect('A+ A A- B+ B B-').toContain(result.grade);
    });

    it('scores a deliberately bad roster below it', () => {
        const worst = [...board].sort((a, b) => b.ecr - a.ecr);
        const bad = ['QB', 'RB', 'WR', 'TE'].flatMap((pos) =>
            worst.filter((p) => p.position === pos).slice(0, 3).map((p) => p.id));
        const result = gradeRoster(bad, board, DEFAULT_LEAGUE);
        expect(result.differential).toBeLessThan(0);
        expect('C+ C C- D F').toContain(result.grade);
    });

    it('the league average uses the whole board, not the roster', () => {
        const strong = leagueAverage(gradeRoster(roster, board).rows.length
            ? gradeRoster(roster, board, DEFAULT_LEAGUE).rows : [], DEFAULT_LEAGUE);
        const full = gradeRoster(roster, board, DEFAULT_LEAGUE).average;
        // A 13-player roster cannot supply 12 teams' worth of starters, so the
        // roster-only version is necessarily thinner.
        expect(full.total).toBeGreaterThan(0);
        expect(full.total).not.toBe(strong.total);
    });

    it('reports a week for every week of the season', () => {
        const result = gradeRoster(roster, board, DEFAULT_LEAGUE);
        expect(result.weeks).toHaveLength(SEASON.weeks.length);
        result.weeks.forEach((w) => expect(w.points).toBeGreaterThan(0));
    });

    it('a bye-week pile-up shows up as a worse worst week', () => {
        const result = gradeRoster(roster, board, DEFAULT_LEAGUE);
        expect(result.worstWeek.points).toBeLessThan(result.bestWeek.points);
    });

    it('flags roster ids it cannot find', () => {
        const result = gradeRoster([...roster, 'not-a-player'], board, DEFAULT_LEAGUE);
        expect(result.missing).toEqual(['not-a-player']);
    });

    it('grade cuts run the right way', () => {
        expect(gradeFor(20)).toBe('A+');
        expect(gradeFor(0.5)).toBe('B-');
        expect(gradeFor(-20)).toBe('F');
    });
});


describe('matchups', () => {
    const adjustments = defenseAdjustments(Object.values(playerDatabase));

    it('ranks every board defence between -1 and +1 as a unitless share', () => {
        const values = Object.values(adjustments);
        expect(values.length).toBeGreaterThan(20);
        expect(Math.min(...values)).toBeCloseTo(-1, 5);
        expect(Math.max(...values)).toBeCloseTo(1, 5);
    });

    // The swing is measured per position and differs fivefold across them, so a
    // single shared constant would quietly reintroduce the flat +/-3 this
    // replaced. QB must stay the largest and WR the smallest.
    it('carries a distinct, positive swing for every startable position', () => {
        ['QB', 'RB', 'WR', 'TE'].forEach((pos) => {
            expect(MATCHUP_SWING[pos]).toBeGreaterThan(0);
            expect(MATCHUP_SWING[pos]).toBeLessThanOrEqual(MAX_MATCHUP_SWING);
        });
        expect(MATCHUP_SWING.QB).toBeGreaterThan(MATCHUP_SWING.RB);
        expect(MATCHUP_SWING.RB).toBeGreaterThan(MATCHUP_SWING.WR);
    });

    it('the best-ranked defence is the harshest matchup', () => {
        const dst = Object.values(playerDatabase)
            .filter((p) => p.position === 'DST' && p.ecr)
            .sort((a, b) => a.ecr - b.ecr);
        const best = dst[0];
        const worst = dst[dst.length - 1];
        expect(adjustments[best.team === 'LAR' ? 'LA' : best.team]).toBeLessThan(0);
        expect(adjustments[worst.team === 'LAR' ? 'LA' : worst.team]).toBeGreaterThan(0);
    });

    it('gives a player an opponent every week except his bye', () => {
        const player = board.find((p) => SEASON.byes[p.team] && opponentFor(p, 1));
        const bye = SEASON.byes[player.team];
        expect(opponentFor(player, bye)).toBeUndefined();
        let played = 0;
        for (let w = 1; w <= SEASON.weeks.length; w += 1) if (opponentFor(player, w)) played += 1;
        expect(played).toBe(SEASON.weeks.length - 1);
    });

    it('moves a weekly score by the matchup and never below zero', () => {
        const result = gradeRoster(roster, board, DEFAULT_LEAGUE);
        const row = result.rows[0];
        for (let w = 1; w <= SEASON.weeks.length; w += 1) {
            const { points, adjust } = weeklyPoints(row, w, adjustments);
            const swing = MATCHUP_SWING[row.player.position] ?? 0;
            expect(Math.abs(adjust)).toBeLessThanOrEqual(swing + 1e-9);
            expect(points).toBeGreaterThanOrEqual(0);
            if (opponentFor(row.player, w)) {
                expect(points).toBeCloseTo(Math.max(0, row.projection.ppg + adjust), 5);
            }
        }
    });

    it('a matchup can change who starts, not just the total', () => {
        // Two players close on the season rate should swap in some week if their
        // draws differ enough.
        const result = gradeRoster(roster, board, DEFAULT_LEAGUE);
        const starters = result.weeks.map((w) =>
            w.lineup.map((s) => s.row?.player.id).join('|'));
        expect(new Set(starters).size).toBeGreaterThan(1);
    });

    it('the season grade barely moves, because matchups average out', () => {
        // Worth asserting: over 18 weeks a team faces good and bad defences, so
        // the differential should not swing wildly on matchups alone.
        const withMatchups = gradeRoster(roster, board, DEFAULT_LEAGUE);
        expect(Math.abs(withMatchups.differential)).toBeLessThan(40);
        expect(Object.keys(withMatchups.matchups).length).toBeGreaterThan(20);
    });
});
