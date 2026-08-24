import { PROJECTION_MODEL, ROOKIE_MODEL, GAMES_MODEL, SEASON } from './projectionModel';
import { injuryReport } from './injuryReport';
import { playerDatabase } from './playerDatabase';
import { projectPlayer, driverMeta, buildProjections } from './draftScore';

const POSITIONS = ['QB', 'RB', 'WR', 'TE'];
const boardBy = (position) =>
    Object.values(playerDatabase).filter((p) => p.position === position);

describe('projection model shape', () => {
    it.each(POSITIONS)('%s carries no input fitted to zero', (position) => {
        // The sign-constrained fit parks redundant inputs at exactly zero. They
        // used to be kept, which let one onto the card; fit_wide.py now refits
        // without them, so anything still listed must actually move the number.
        const model = PROJECTION_MODEL[position];
        const dead = model.features.filter((_, i) => Math.abs(model.coef[i]) < 1e-9);
        expect(dead).toEqual([]);
    });

    it.each(POSITIONS)('%s headline drivers all carry real weight', (position) => {
        const model = PROJECTION_MODEL[position];
        model.headline.forEach((feature) => {
            const i = model.features.indexOf(feature);
            expect(i).toBeGreaterThanOrEqual(0);
            expect(Math.abs(model.coef[i])).toBeGreaterThan(0.01);
        });
    });

    it.each(POSITIONS)('%s shows the four heaviest card-eligible inputs', (position) => {
        // team_change is binary and 85% of the board stayed put, so it is held
        // out of the headline and shown among the smaller factors instead.
        const model = PROJECTION_MODEL[position];
        const ranked = model.features
            .map((f, i) => [f, Math.abs(model.coef[i])])
            .filter(([f]) => f !== 'team_change')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([f]) => f);
        expect([...model.headline].sort()).toEqual([...ranked].sort());
    });

    it.each(POSITIONS)('%s does not carry an input the audit removed', (position) => {
        // Each of these was measured and taken out: games played was doing
        // shrinkage in disguise, target_share hurt at WR and RB, td_oe_pg hurt at
        // TE. See scripts/analysis/fit_wide.py for the reasoning.
        const banned = { QB: ['gp'], RB: ['gp', 'target_share'], WR: ['gp', 'target_share'], TE: ['gp', 'td_oe_pg'] };
        banned[position].forEach((feature) => {
            expect(PROJECTION_MODEL[position].features).not.toContain(feature);
        });
    });

    it.each(POSITIONS)('%s keeps team_change in the model but off the card', (position) => {
        const model = PROJECTION_MODEL[position];
        expect(model.features).toContain('team_change');
        expect(model.headline).not.toContain('team_change');
    });

    it.each(POSITIONS)('%s every input has human-facing copy', (position) => {
        PROJECTION_MODEL[position].features.forEach((feature) => {
            expect(driverMeta(feature).label).not.toEqual(feature);
        });
    });
});

describe('projectPlayer', () => {
    it.each(POSITIONS)('%s contributions sum to the projection', (position) => {
        const player = boardBy(position).find((p) => {
            const proj = projectPlayer(p.id, position, p);
            return proj && !proj.isRookie;
        });
        expect(player).toBeDefined();
        const proj = projectPlayer(player.id, position, player);
        const shown = proj.drivers.reduce((sum, d) => sum + d.contribution, 0);
        // The card's promise: the baseline plus the four drivers plus the
        // rolled-up remainder equals the number at the top of the card. Compared
        // against the unrounded intercept, since `baseline` is rounded for
        // display and would otherwise contribute its own 0.05 of slack.
        const total = PROJECTION_MODEL[position].intercept + shown + proj.otherContribution;
        expect(Math.abs(total - proj.ppg)).toBeLessThanOrEqual(0.051);
    });

    it('projects a well-known veteran into a sane range', () => {
        const gibbs = playerDatabase['jahmyr-gibbs'];
        const proj = projectPlayer('jahmyr-gibbs', 'RB', gibbs);
        expect(proj).not.toBeNull();
        expect(proj.isRookie).toBe(false);
        expect(proj.ppg).toBeGreaterThan(10);
        expect(proj.ppg).toBeLessThan(25);
        expect(proj.confidence).toBe('high');
    });

    it('projects an incoming rookie from the top-12 band alone', () => {
        const love = playerDatabase['jeremiyah-love'];
        const proj = projectPlayer('jeremiyah-love', 'RB', love);
        expect(proj.isRookie).toBe(true);
        expect(proj.drivers).toEqual([]);
        expect(proj.comparable.lo).toBe(1);
        expect(proj.comparable.hi).toBe(12);
        expect(proj.ppg).toBeCloseTo(proj.comparable.mean, 1);
    });

    it("a rookie's projection is his band average plus only what the card shows", () => {
        // The card cites the comparable band as its evidence and then prints the
        // projection. Under the old curve-with-a-ceiling those were two different
        // numbers for any pick outside the very top, with nothing on screen to
        // explain the gap.
        //
        // A rookie WR now also carries a landing-spot adjustment, so the two are
        // no longer identical — but the gap must be exactly the adjustment the
        // card displays, never an unexplained difference. Everyone else still
        // projects at the band mean precisely.
        const rookies = Object.values(playerDatabase).filter((p) => {
            const proj = POSITIONS.includes(p.position)
                && projectPlayer(p.id, p.position, p);
            return proj && proj.isRookie;
        });
        expect(rookies.length).toBeGreaterThan(0);
        rookies.forEach((player) => {
            const proj = projectPlayer(player.id, player.position, player);
            const shown = proj.landing ? proj.landing.adjust : 0;
            expect(proj.ppg).toBeCloseTo(
                Math.max(0, proj.comparable.mean + shown), 1,
            );
            if (proj.landing) expect(player.position).toBe('WR');
        });
    });

    it('gives rookie WRs a landing-spot adjustment and nobody else', () => {
        const withLanding = Object.values(playerDatabase)
            .filter((p) => POSITIONS.includes(p.position))
            .map((p) => [p, projectPlayer(p.id, p.position, p)])
            .filter(([, proj]) => proj && proj.landing);
        expect(withLanding.length).toBeGreaterThan(0);
        withLanding.forEach(([player, proj]) => {
            expect(proj.isRookie).toBe(true);
            expect(player.position).toBe('WR');
            expect(Number.isFinite(proj.landing.vacated)).toBe(true);
        });
    });

    it.each(POSITIONS)('%s rookie bands never rise with a later pick', (position) => {
        const { bands } = ROOKIE_MODEL[position];
        bands.forEach((band, i) => {
            expect(band.sd).toBeGreaterThan(0);
            if (i > 0) expect(band.mean).toBeLessThanOrEqual(bands[i - 1].mean);
        });
    });

    it.each(POSITIONS)('%s projects games inside a real season', (position) => {
        boardBy(position).slice(0, 25).forEach((player) => {
            const proj = projectPlayer(player.id, position, player);
            if (!proj) return;
            expect(proj.games).toBeGreaterThanOrEqual(0);
            expect(proj.games).toBeLessThanOrEqual(SEASON.games);
            expect(proj.totalPoints).toBe(Math.round(proj.ppg * proj.games));
        });
    });

    it('prices a fresh injury past its stated return date', () => {
        // Jeanty's camp knee carries a return date four days after the injury,
        // which is a re-evaluation date rather than a return to play. The date
        // itself rules out no weeks, so everything charged here is the severity
        // premium — the thing that stops "Questionable, knee" reading the same as
        // a resolved knock.
        const entry = injuryReport['ashton-jeanty'];
        expect(entry).toBeDefined();
        expect(Date.parse(entry.returnDate)).toBeLessThan(Date.parse(SEASON.weeks[0]));
        const proj = projectPlayer('ashton-jeanty', 'RB', playerDatabase['ashton-jeanty']);
        expect(proj.gamesMissed).toBeGreaterThan(1);
        expect(proj.gamesMissed).toBeLessThan(6);
    });

    it('charges nothing for a designation with no injury behind it', () => {
        // A suspension ends on a known date, so there is no severity premium to
        // add on top of it.
        const proj = projectPlayer('jahmyr-gibbs', 'RB', playerDatabase['jahmyr-gibbs']);
        expect(injuryReport['jahmyr-gibbs']).toBeUndefined();
        expect(proj.gamesMissed).toBe(0);
    });

    it('docks a chronically unavailable player more than an iron man', () => {
        // Same position, no current injury on either: the gap has to come from
        // career durability alone.
        const henry = projectPlayer('derrick-henry', 'RB', playerDatabase['derrick-henry']);
        const gibbs = projectPlayer('jahmyr-gibbs', 'RB', playerDatabase['jahmyr-gibbs']);
        expect(gibbs.games).toBeGreaterThan(henry.games);
    });

    it('takes games off a player whose return date lands mid-season', () => {
        const hurt = Object.keys(injuryReport).find((id) => {
            const back = Date.parse(injuryReport[id].returnDate);
            return back > Date.parse(SEASON.weeks[4]) && playerDatabase[id];
        });
        expect(hurt).toBeDefined();
        const player = playerDatabase[hurt];
        const proj = projectPlayer(hurt, player.position, player);
        expect(proj.gamesMissed).toBeGreaterThan(0);
        // A healthy team-mate at the same position should project more games.
        const healthy = Object.values(playerDatabase).find(
            (p) => p.position === player.position && !injuryReport[p.id] && projectPlayer(p.id, p.position, p),
        );
        expect(proj.games).toBeLessThan(projectPlayer(healthy.id, healthy.position, healthy).games);
    });

    it('ranks and values off the season total, not the rate', () => {
        const rows = buildProjections(Object.values(playerDatabase).filter((p) => p.ecr));
        const rbs = rows.filter((r) => r.player.position === 'RB')
            .sort((a, b) => a.posRank - b.posRank);
        // Rank order must follow total points, which is not the same order as PPG
        // once games differ.
        for (let i = 1; i < Math.min(rbs.length, 40); i += 1) {
            expect(rbs[i - 1].projection.totalPoints).toBeGreaterThanOrEqual(rbs[i].projection.totalPoints);
        }
        const byRate = [...rbs].sort((a, b) => b.projection.ppg - a.projection.ppg);
        expect(byRate.map((r) => r.player.id)).not.toEqual(rbs.map((r) => r.player.id));
    });

    it.each(POSITIONS)('%s games model is present and sane', (position) => {
        const m = GAMES_MODEL[position];
        expect(m.mean).toBeGreaterThan(10);
        expect(m.mean).toBeLessThanOrEqual(SEASON.games);
        expect(m.durability).toBeGreaterThan(0);
    });

    it('returns null for a player the model cannot speak to', () => {
        expect(projectPlayer('not-a-real-player', 'RB', { team: 'ARI' })).toBeNull();
    });
});
