import {
    PROJECTION_MODEL, ROOKIE_MODEL, ROOKIE_LANDING, EXPECTED_TD, GAMES_MODEL, SEASON, MODEL_SEASONS,
} from './projectionModel';
import { playerStats, VACATED_WR_TARGETS } from './playerStats';
import { injuryReport } from './injuryReport';

/*
 * Turns a board player into a 2026 projection.
 *
 * The primary number is projected half-PPR points per game — the quantity the
 * model was actually fitted to predict. Everything else on the card is derived
 * from it: positional rank and value over replacement re-express the projection
 * in draft terms, and the ADP score compares it against what the player costs.
 *
 * Coefficients come from scripts/analysis/fit_wide.py, fitted on 3,136
 * year-over-year transitions (2015–2025) and validated leave-one-season-out.
 * Each position's model runs on 6–8 inputs. The card draws the four heaviest,
 * chosen by fitted coefficient rather than a hand-kept list, and shows the rest
 * only as `otherContribution` — one number, no breakdown — so the parts on
 * screen still sum to the whole without itemising the tail. The team-change flag
 * is held out of those four on purpose (see fit_wide.py): it is binary and
 * near-constant across a board of established starters.
 */

// Starters absorbed at each position before the waiver wire in a 12-team league,
// flex included. Value over replacement is measured against the player who sits
// exactly here, which is what makes a QB and a RB score comparable.
export const REPLACEMENT_RANK = { QB: 12, RB: 30, WR: 42, TE: 12 };

const round1 = (n) => Math.round(n * 10) / 10;

/** What the player costs to draft: ADP where it exists, otherwise consensus rank. */
const costOf = (player) => (player.adp ?? player.ecr);

/** Sleeper reports counting stats per season; the model wants per-game rates. */
const perGame = (total, gp) => (gp > 0 && Number.isFinite(total) ? total / gp : undefined);

/**
 * Touchdowns scored above what the player's opportunity implies. Positive means
 * the player outscored his red-zone and total volume — which regresses, so the
 * model carries a negative weight on it.
 */
const touchdownsOverExpected = (season) => {
    const gp = season.gp;
    if (!gp) return undefined;
    const rzAtt = season.rush?.rzAtt || 0;
    const rzTgt = season.rec?.rzTgt || 0;
    const att = Math.max((season.rush?.att || 0) - rzAtt, 0);
    const tgt = Math.max((season.rec?.tgt || 0) - rzTgt, 0);
    const expected = EXPECTED_TD.intercept
        + EXPECTED_TD.rzAtt * rzAtt
        + EXPECTED_TD.rzTgt * rzTgt
        + EXPECTED_TD.att * att
        + EXPECTED_TD.tgt * tgt;
    const actual = (season.rush?.td || 0) + (season.rec?.td || 0);
    return (actual - expected) / gp;
};

/**
 * How much a designation is worth in expected games missed BEYOND the stated
 * return date, and how much the body part multiplies it.
 *
 * These are priors, not fits. Nothing in the cache records what players carrying
 * a given designation actually went on to miss — that would need historical
 * injury reports, and the feed only ever holds today's. They are here, in one
 * table, so the judgement is visible and tunable rather than buried in a formula.
 *
 * The premium exists because a return date is a floor, not an expectation. ESPN
 * publishes the next re-evaluation, so a back who left practice unable to put
 * weight on a knee gets a date four days out; the real distribution of outcomes
 * runs well past it.
 */
// Games missed BEYOND what the return date already rules out.
//
// These began as pure priors. `scripts/analysis/injuries.py` now measures the
// claim against nflverse's weekly league injury report (2015-2025, 9,536
// player-weeks), which the earlier comment here wrongly assumed did not exist —
// it is ESPN that only holds today's report, not the league feed.
//
// What the fit settled, and what it did NOT:
//   - DOUBTFUL belongs next to OUT, not next to QUESTIONABLE. Over the six
//     weeks after a report, Out costs 4.15 games, Doubtful 3.77, Questionable
//     2.02; a doubtful player misses that week 99.3% of the time against Out's
//     100% and Questionable's 40.4%. Doubtful sitting level with Questionable
//     was simply wrong, and that is corrected below.
//   - The ABSOLUTE numbers are deliberately NOT taken from that fit. In-season
//     designations are formal league filings; ESPN's August feed is a different
//     animal, 65 of its 68 current entries are QUESTIONABLE, and 38 of those
//     carry no severity language at all ("was on the field for practice")
//     against 30 that do (Kamara's MCL, "out at least a month"). The league
//     report's rest-of-season figures — Out 7.81, Doubtful 6.37, Questionable
//     4.96 — describe a much sicker population than an August watch-list, and
//     applying them here would dock most of the board five games for nothing.
//     The fitted table is the right foundation for an IN-SEASON weekly model,
//     where the designations do mean the same thing; it is the wrong input for
//     a draft board, so only the ordering is taken from it.
const DESIGNATION_RISK = {
    IR: 4, 'PUP-R': 4, 'PUP-P': 2, OUT: 2, DOUBTFUL: 1.8, QUESTIONABLE: 1.5,
    SUSPENSION: 0, // a ban has an exact end date, so the date is the whole story
};

// Measured too, with a caveat that matters. Within the league report the
// testable tiers do nothing at all: grouped by body part, games missed over the
// next six weeks lands at 0.94x-1.05x the designation's own average, whichever
// tier the injury falls in. But the two SEVERE tiers could not be tested — clubs
// file a body part, never a diagnosis ("Knee", 1,531 times; never "torn ACL"),
// so the acl/achilles/torn and surgery/fracture patterns never match that feed.
// ESPN's free text, which is what this actually runs against, is far richer
// ("Knee (MCL, sprain)", "Left ankle (surgery)"), and on an August board that
// text is doing most of the real discriminating. So the severe tiers stay as
// untested priors, and the mild ones are known to be near-inert.
const BODY_PART_SEVERITY = [
    [/acl|achilles|torn|rupture|lisfranc/i, 3],
    [/surgery|fracture|broken/i, 2],
    [/knee|back|foot|hip/i, 2],
    [/hamstring|groin|quad|calf|shoulder|concussion/i, 1.2],
];

const injuryRisk = (entry) => {
    if (!entry) return 0;
    const base = DESIGNATION_RISK[entry.designation]
        ?? DESIGNATION_RISK[String(entry.status || '').toUpperCase()]
        ?? 0.5;
    if (!base) return 0;
    const text = `${entry.bodyPart || ''} ${entry.label || ''}`;
    const hit = BODY_PART_SEVERITY.find(([pattern]) => pattern.test(text));
    return base * (hit ? hit[1] : 1);
};

/**
 * Games the player is expected to miss to an injury he is carrying right now:
 * the weeks his return date rules out, plus the risk premium above.
 *
 * The date alone is not enough. A status of "Questionable" covers both a knock
 * that costs nothing and a knee that costs a month, and the date attached to the
 * second is usually the next check-up rather than a return to play.
 */
const gamesMissedToInjury = (playerId) => {
    const entry = injuryReport[playerId];
    if (!entry) return 0;
    const weeks = SEASON?.weeks || [];
    let missed = 0;
    const back = Date.parse(`${entry.returnDate}T00:00:00Z`);
    if (weeks.length && Number.isFinite(back)) {
        const missedWeeks = weeks.filter((day) => Date.parse(`${day}T00:00:00Z`) < back).length;
        // A 17-game season runs over 18 weeks, so a missed week costs slightly
        // less than a whole game once the bye is spread across the schedule.
        missed = missedWeeks * (SEASON.games / weeks.length);
    }
    return Math.min(SEASON.games, missed + injuryRisk(entry));
};

// Career durability is an average over however many seasons a player has, so a
// rookie who played all 17 reads as a perfect 1.000 on a sample of one. Pulling
// it toward the positional mean by a couple of seasons' worth of prior stops a
// single year buying iron-man status. The fitted weight is ambiguous — receivers
// prefer no shrinkage, tight ends prefer a lot, and the spread between them is
// smaller than the noise — so this is a modest uniform prior rather than a
// number the data picked.
const DURABILITY_PRIOR_SEASONS = 2;

/**
 * Projected games. Availability barely persists year to year — a fit on prior
 * games, durability and age explains 1.7% of the variance at running back and
 * 9% at quarterback — so this is a positional baseline nudged by career
 * durability, then scaled by the share of the season a current injury still
 * leaves him. Scaling rather than subtracting avoids charging him twice: the
 * baseline already prices in the ordinary missed game.
 */
const projectGames = (position, durability, seasonsPlayed, missed) => {
    const model = GAMES_MODEL[position];
    if (!model) return undefined;
    let base = model.mean;
    if (Number.isFinite(durability)) {
        const n = Math.max(1, seasonsPlayed || 1);
        const priorMean = model.priorDurability ?? 0.85;
        const shrunk = (n * durability + DURABILITY_PRIOR_SEASONS * priorMean)
            / (n + DURABILITY_PRIOR_SEASONS);
        base = model.intercept + model.durability * shrunk;
    }
    const healthy = Math.max(1, Math.min(SEASON.games, base));
    const available = Math.max(0, SEASON.games - missed);
    return Math.max(0, Math.min(available, healthy * (available / SEASON.games)));
};

/** One season's value for a model feature, or undefined if it can't be formed. */
const featureValue = (season, feature) => {
    switch (feature) {
        case 'ppg_half': return season.ppg?.half;
        case 'rec_yd_pg': return perGame(season.rec?.yd || 0, season.gp);
        case 'tgt_pg': return perGame(season.rec?.tgt || 0, season.gp);
        case 'scrim_yd_pg':
            return perGame((season.rush?.yd || 0) + (season.rec?.yd || 0), season.gp);
        case 'opportunity_pg':
            return perGame((season.rush?.att || 0) + (season.rec?.tgt || 0), season.gp);
        case 'pass_yd_pg': return perGame(season.pass?.yd || 0, season.gp);
        case 'pass_td_pg': return perGame(season.pass?.td || 0, season.gp);
        case 'pass_rz_att_pg': return perGame(season.pass?.rzAtt || 0, season.gp);
        case 'cmp_pct': return season.pass?.cmpPct;
        case 'rush_att_pg': return perGame(season.rush?.att || 0, season.gp);
        case 'rush_yd_pg': return perGame(season.rush?.yd || 0, season.gp);
        case 'int_pg': return perGame(season.pass?.int || 0, season.gp);
        case 'rz_tgt_pg': return perGame(season.rec?.rzTgt || 0, season.gp);
        case 'rz_att_pg': return perGame(season.rush?.rzAtt || 0, season.gp);
        case 'weighted_opp_pg': {
            // PFF's weighting: red-zone work is priced well above the rest.
            const rzAtt = season.rush?.rzAtt || 0;
            const rzTgt = season.rec?.rzTgt || 0;
            const att = Math.max((season.rush?.att || 0) - rzAtt, 0);
            const tgt = Math.max((season.rec?.tgt || 0) - rzTgt, 0);
            return perGame(rzAtt * 1.28 + rzTgt * 2.39 + att * 0.47 + tgt * 1.54, season.gp);
        }
        case 'target_share': return season.adv?.targetShare;
        case 'air_yards_share': return season.adv?.airYardsShare;
        case 'wopr': return season.adv?.wopr;
        case 'rush_share': return season.adv?.rushShare;
        case 'snap_pct': return season.snapPct;
        case 'ypt': return season.rec?.ypt;
        case 'ypr': return season.rec?.ypr;
        case 'gp': return season.gp;
        case 'ryoe_att': return season.rush?.yoeAtt;
        case 'avg_yac_above_expectation': return season.rec?.yacOe;
        case 'td_oe_pg': return touchdownsOverExpected(season);
        case 'age': return season.age;
        default: return undefined;
    }
};

// nflverse writes the Rams as LA; the board writes them LAR. Left unmapped, every
// Rams player would read as having changed teams and be wrongly marked down.
const TEAM_ALIASES = { LAR: 'LA', LVR: 'LV', JAC: 'JAX', WSH: 'WAS', ARZ: 'ARI' };
const canonicalTeam = (team) => {
    if (!team || team === 'FA') return undefined;
    const upper = String(team).toUpperCase();
    return TEAM_ALIASES[upper] || upper;
};

/**
 * Career-level inputs, which describe the player rather than one season and so
 * are never blended. Returning undefined lets the caller fall back to the league
 * median instead of inventing a value.
 */
const careerFeature = (feature, { entry, seasons, boardPlayer }) => {
    switch (feature) {
        case 'team_change': {
            const now = canonicalTeam(boardPlayer?.team);
            const last = canonicalTeam(seasons[0]?.team);
            if (!now || !last) return undefined;
            return now === last ? 0 : 1;
        }
        case 'draft_pick_log':
            return entry?.draft?.pick ? Math.log(entry.draft.pick) : undefined;
        case 'durability': {
            // Share of a full season played, averaged across the career. One
            // missed year is noise; a pattern is a real discount.
            if (!seasons.length) return undefined;
            const played = seasons.map((s) => Math.min(s.gp || 0, 17) / 17);
            return played.reduce((a, b) => a + b, 0) / played.length;
        }
        default: return undefined;
    }
};

const CAREER_FEATURES = new Set(['team_change', 'draft_pick_log', 'durability']);

/**
 * Presentation for inputs whose stored form is unreadable. "New team +0.19" on a
 * player who never moved is worse than showing nothing, so the flag states which
 * side of the split he is on; draft capital reads as a pick number, not a log.
 */
const describeSpecial = (feature, value) => {
    switch (feature) {
        case 'team_change':
            return value >= 0.5
                ? { label: 'Changed teams', display: 'new team', unit: '' }
                : { label: 'Same team', display: 'stayed', unit: '' };
        case 'draft_pick_log':
            return { display: `pick ${Math.round(Math.exp(value))}`, unit: '' };
        case 'durability':
            return { display: `${Math.round(value * 100)}% of games`, unit: '' };
        case 'gp':
            return { display: `${Math.round(value)} games`, unit: '' };
        default:
            return {};
    }
};

/**
 * Blends a feature across the seasons leading into the one being projected.
 *
 * The window is anchored on the PRIOR SEASON, not on the player's own most
 * recent one. Anchoring on the player meant a man who sat out all of last year
 * had the year before treated as if it were yesterday — Joe Mixon missed 2025
 * entirely and was being projected off 2024 at full recency weight, which is how
 * a free agent ended up ranked RB13.
 *
 * `absentWeight` is the share of the window the player was in the league for and
 * has no season in. That is different from a window slot he simply predates: a
 * second-year player is not absent from the season before he was drafted. The
 * caller pulls the standardised value toward the league average by that share,
 * so a missed season costs something instead of quietly renormalising away.
 */
const blendedFeature = (seasons, feature, blend, priorSeason, fullSeason) => {
    const latest = seasons[0];
    if (!latest) return undefined;
    if (feature === 'age' || !blend?.length) {
        return { value: featureValue(latest, feature), absentWeight: 0 };
    }
    const anchor = Number.isFinite(priorSeason) ? priorSeason : latest.season;
    const oldest = seasons[seasons.length - 1]?.season;
    // Full credit at the number of games the fit's average player actually
    // played, not at 17 — the corpus averages under 14, so 17 would make every
    // healthy player look partly absent and drag the whole board to the mean.
    const full = fullSeason && fullSeason > 0 ? fullSeason : 17;

    let weighted = 0;
    let used = 0;
    let absent = 0;
    blend.forEach((weight, offset) => {
        const target = anchor - offset;
        const season = seasons.find((s) => s.season === target);
        const value = season === undefined ? undefined : featureValue(season, feature);
        const inLeague = Number.isFinite(oldest) && target > oldest;
        if (value === undefined || !Number.isFinite(value)) {
            // In the league that year with no record of it: a season he missed.
            // Earlier than his first season: he simply did not exist yet.
            if (inLeague) absent += weight;
            return;
        }
        // A four-game season is not four-seventeenths of a data point in the
        // model's eyes unless it is told so. The fit never saw a season under
        // eight games; this is what keeps a one-game cameo from being read as a
        // full year of evidence.
        const share = Math.max(0, Math.min(1, (season.gp || 0) / full));
        weighted += value * weight * share;
        used += weight * share;
        absent += weight * (1 - share);
    });
    if (used <= 0) return { value: undefined, absentWeight: Math.min(absent, 1) };
    return { value: weighted / used, absentWeight: Math.min(absent, 1) };
};

// Human-facing copy for each driver. `good` states the direction that helps, so
// the card can explain a negative contribution without the reader doing algebra.
const DRIVER_META = {
    ppg_half: { label: 'Prior production', unit: 'PPG', hint: 'Half-PPR points per game, weighted toward last season', good: 'up' },
    rec_yd_pg: { label: 'Receiving yards', unit: '/g', hint: 'Receiving yards per game', good: 'up' },
    scrim_yd_pg: { label: 'Scrimmage yards', unit: '/g', hint: 'Rushing plus receiving yards per game', good: 'up' },
    tgt_pg: { label: 'Targets', unit: '/g', hint: 'The stickiest input in the study — 0.82 year over year', good: 'up' },
    opportunity_pg: { label: 'Opportunities', unit: '/g', hint: 'Carries plus targets per game', good: 'up' },
    pass_yd_pg: { label: 'Passing yards', unit: '/g', hint: 'Passing yards per game', good: 'up' },
    rush_att_pg: { label: 'Rush attempts', unit: '/g', hint: 'QB rushing volume — the stickiest QB input at 0.80', good: 'up' },
    int_pg: { label: 'Interceptions', unit: '/g', hint: 'Interceptions per game', good: 'down' },
    td_oe_pg: { label: 'TDs over expected', unit: '/g', hint: 'Scoring above what red-zone volume implies — this regresses', good: 'down' },
    age: { label: 'Age', unit: 'yrs', hint: 'Age on Sept 1 — the strongest single predictor of year-over-year change', good: 'down' },
    rush_yd_pg: { label: 'Rushing yards', unit: '/g', hint: 'Rushing yards per game', good: 'up' },
    pass_td_pg: { label: 'Passing TDs', unit: '/g', hint: 'Passing touchdowns per game', good: 'up' },
    pass_rz_att_pg: { label: 'Red-zone attempts', unit: '/g', hint: 'Pass attempts inside the 20', good: 'up' },
    cmp_pct: { label: 'Completion %', unit: '%', hint: 'Completion percentage', good: 'up' },
    rz_tgt_pg: { label: 'Red-zone targets', unit: '/g', hint: 'Targets inside the 20 — steadier than touchdowns themselves', good: 'up' },
    rz_att_pg: { label: 'Red-zone carries', unit: '/g', hint: 'Carries inside the 20', good: 'up' },
    weighted_opp_pg: { label: 'Weighted opportunity', unit: '/g', hint: 'Touches weighted by where on the field they came', good: 'up' },
    target_share: { label: 'Target share', unit: '%', hint: 'Share of the team\'s targets', good: 'up' },
    air_yards_share: { label: 'Air-yards share', unit: '%', hint: 'Share of the team\'s intended downfield yardage', good: 'up' },
    wopr: { label: 'WOPR', unit: '', hint: 'Target share and air-yards share combined', good: 'up' },
    rush_share: { label: 'Rush share', unit: '%', hint: 'Share of the team\'s carries', good: 'up' },
    snap_pct: { label: 'Snap share', unit: '%', hint: 'Share of the team\'s offensive snaps', good: 'up' },
    ypt: { label: 'Yards per target', unit: '', hint: 'Receiving yards per target', good: 'up' },
    ypr: { label: 'Yards per catch', unit: '', hint: 'Receiving yards per reception — how far downfield the role is', good: 'up' },
    gp: { label: 'Games played', unit: '', hint: 'Games played last season', good: 'up' },
    ryoe_att: { label: 'Rush yards over expected', unit: '/att', hint: 'NGS-tracked rushing efficiency vs. a defender-position-adjusted expectation', good: 'up' },
    avg_yac_above_expectation: { label: 'YAC over expected', unit: '/rec', hint: 'NGS-tracked yards after the catch vs. what the coverage at the catch point implied', good: 'up' },
    team_change: { label: 'New team', unit: '', hint: 'Changing teams costs production on average — new scheme, new quarterback', good: 'down' },
    draft_pick_log: { label: 'Draft capital', unit: '', hint: 'Where the player was drafted — pedigree still matters years in', good: 'down' },
    durability: { label: 'Durability', unit: '', hint: 'Share of a full season played, across the career', good: 'up' },
};

export const driverMeta = (feature) => DRIVER_META[feature] || { label: feature, unit: '', hint: '', good: 'up' };

/**
 * Projects one player. Returns null for anyone the model cannot speak to —
 * team defenses, kickers, and anyone with neither an NFL season nor draft
 * capital. A null is meant to be shown as "no projection", never as a zero.
 */
export const projectPlayer = (playerId, position, boardPlayer) => {
    const model = PROJECTION_MODEL[position];
    if (!model) return null;
    // No roster spot, no projection. A free agent's stat line describes a job he
    // no longer has, and the model has no way to know that — left in, Joe Mixon
    // projected as RB13 off his 2024 season in Houston and scored 100 on value
    // vs ADP, which is the board calling the market's biggest write-off its
    // biggest bargain. `canonicalTeam` also returns undefined for FA, so the
    // team-change penalty silently fell back to the league median: the most
    // uncertain case on the board was getting the average treatment.
    if (!boardPlayer?.team || String(boardPlayer.team).toUpperCase() === 'FA') return null;

    const entry = playerStats[playerId];
    const seasons = entry?.seasons || [];

    if (!seasons.length) {
        const draft = entry?.draft;
        const rookie = ROOKIE_MODEL[position];
        if (!draft?.pick || !rookie) return null;
        // Every rookie is graded off the mean of his draft band and nothing else.
        // There used to be a fitted log curve here with the band mean applied only
        // as a ceiling, which meant the ceiling bound the very top picks and the
        // curve governed everyone else — so the card quoted a band average as its
        // evidence and then printed a different number beside it.
        //
        // Band means are recency-weighted (see ROOKIE_MODEL.halfLife): rookie
        // pass-catchers have measurably improved, and pooling 2015 flat with 2025
        // was holding every top-12 WR down to the average of a cohort containing
        // two players who barely took the field.
        const band = (rookie.bands || []).find(
            (b) => draft.pick >= b.lo && draft.pick <= b.hi,
        );
        if (!band) return null;
        // Landing spot, rookie WRs only: the share of his new team's targets
        // that walked out the door. Vacated opportunity is worthless for
        // veterans — their own stat line already says what role they hold —
        // but a rookie has no line, so the job waiting for him is most of what
        // can be known. WR is also the only position where it survives being
        // rolled forward by draft class; RB's larger in-sample effect does not
        // (see fit_wide.py).
        const vacated = position === 'WR' && ROOKIE_LANDING
            ? VACATED_WR_TARGETS[canonicalTeam(boardPlayer?.team)]
            : undefined;
        // Rounded before they are added, not after, so the card's arithmetic
        // closes for a reader who takes the band average on screen and applies
        // the adjustment on screen — the same rule the season total follows.
        const bandMean = round1(band.mean);
        const landing = Number.isFinite(vacated)
            ? round1(ROOKIE_LANDING.intercept + ROOKIE_LANDING.coef * vacated)
            : 0;
        const ppg = Math.max(0, bandMean + landing);
        const spread = band.sd;
        const missed = gamesMissedToInjury(playerId);
        const games = projectGames(position, undefined, 0, missed);
        return {
            ppg: round1(ppg),
            games: games === undefined ? undefined : round1(games),
            // Built from the rounded rate and games so the card's arithmetic
            // closes: what a reader multiplies is what the model reports.
            totalPoints: games === undefined ? undefined : Math.round(round1(ppg) * round1(games)),
            gamesMissed: round1(missed),
            injury: injuryReport[playerId],
            // The comparable group this estimate rests on. Because the projection
            // IS the band mean, what the card cites and what it shows are now the
            // same number rather than two that nearly agree.
            comparable: { ...band, mean: bandMean },
            // What the landing spot moved him by, so the card can show the band
            // average as evidence AND account for the gap to the number shown.
            landing: landing ? { vacated, adjust: landing } : undefined,
            residSd: spread,
            low: round1(Math.max(0, ppg - spread)),
            // The band constrains the estimate, not the upside: a rookie really
            // can beat what his comparables averaged, so the range runs up to the
            // best season the position has actually produced.
            high: round1(Math.min(rookie.best ?? ppg + spread, ppg + spread)),
            isRookie: true,
            confidence: 'low',
            draft,
            drivers: [],
            modelR2: null,
        };
    }

    const all = [];
    let ppg = model.intercept;
    const priorSeason = MODEL_SEASONS[1];
    model.features.forEach((feature, i) => {
        const career = CAREER_FEATURES.has(feature);
        const blended = career
            ? undefined
            : blendedFeature(seasons, feature, model.blend, priorSeason,
                GAMES_MODEL[position]?.mean);
        const raw = career
            ? careerFeature(feature, { entry, seasons, boardPlayer })
            : blended?.value;
        const used = raw === undefined || !Number.isFinite(raw) ? model.median[i] : raw;
        // A season the player was in the league for and missed pulls the input
        // toward the league average in proportion to the weight it carried. A
        // window slot he predates does not — he was not absent from a season
        // before his first one.
        const present = 1 - (blended?.absentWeight || 0);
        const z = ((used - model.mean[i]) / model.sd[i]) * present;
        const contribution = model.coef[i] * z;
        ppg += contribution;
        const meta = driverMeta(feature);
        all.push({
            feature,
            ...meta,
            value: used,
            // Three inputs are stored in a form nobody reads: a 0/1 flag, a log,
            // and a fraction. `label`/`display` carry what the card should say.
            ...describeSpecial(feature, used),
            imputed: raw === undefined || !Number.isFinite(raw),
            z,
            contribution,
            weight: model.coef[i],
            leagueMean: model.mean[i],
        });
    });

    // The card shows the four headline drivers; the rest are real inputs with
    // small weights, rolled into a single "other factors" line so the numbers on
    // screen still add up to the projection rather than nearly adding up.
    const headline = model.headline
        .map((f) => all.find((d) => d.feature === f))
        .filter(Boolean);
    const rest = all.filter((d) => !model.headline.includes(d.feature));
    const otherContribution = rest.reduce((sum, d) => sum + d.contribution, 0);
    const drivers = headline;

    ppg = Math.max(0, ppg);
    const missed = gamesMissedToInjury(playerId);
    const games = projectGames(
        position,
        careerFeature('durability', { entry, seasons, boardPlayer }),
        seasons.length,
        missed,
    );
    // A single healthy season is a thin base; flag it rather than hide it.
    const played = seasons[0]?.gp || 0;
    const confidence = seasons.length >= 3 && played >= 12
        ? 'high'
        : (seasons.length >= 2 && played >= 8 ? 'medium' : 'low');

    return {
        ppg: round1(ppg),
        games: games === undefined ? undefined : round1(games),
        // Season total is the number a league is actually won on; PPG is the
        // quantity the model predicts, and games is what turns one into the
        // other. Rank and value-vs-ADP are both built off the total. Computed
        // from the rounded parts so the card's arithmetic closes.
        totalPoints: games === undefined ? undefined : Math.round(round1(ppg) * round1(games)),
        gamesMissed: round1(missed),
        injury: injuryReport[playerId],
        // The model's intercept: what an average starter at this position scores
        // the following season. Every driver contribution is a step away from it,
        // NOT a change from the player's own last year — the card shows the
        // baseline so that arithmetic is legible instead of surprising.
        baseline: round1(model.intercept),
        residSd: model.residSd,
        low: round1(Math.max(0, ppg - model.residSd)),
        high: round1(ppg + model.residSd),
        isRookie: false,
        confidence,
        drivers,
        otherFactors: rest
            .filter((d) => Math.abs(d.contribution) >= 0.01)
            .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
        otherContribution,
        inputCount: model.features.length,
        modelR2: model.r2,
        seasonsUsed: Math.min(seasons.length, model.blend?.length || 1),
    };
};

/**
 * Scores a whole board at once. Rank, value over replacement and the ADP score
 * are all relative measures, so they can only be computed against the same pool
 * the user is looking at — hence one pass over the list rather than per player.
 */
export const buildProjections = (players) => {
    const rows = [];
    players.forEach((player) => {
        const projection = projectPlayer(player.id, player.position, player);
        if (projection) rows.push({ player, projection });
    });

    // Positional rank, then the replacement baseline that rank implies. Both are
    // built on the SEASON TOTAL rather than points per game: a back who scores
    // 15 a game across nine games is not the RB5 that his rate implies, and a
    // league is won on the total. PPG stays the headline number because it is
    // what the model predicts; games is what converts it.
    const totalOf = (row) => row.projection.totalPoints ?? 0;
    const byPosition = {};
    rows.forEach((row) => {
        (byPosition[row.player.position] ||= []).push(row);
    });
    const replacement = {};
    Object.entries(byPosition).forEach(([position, list]) => {
        list.sort((a, b) => totalOf(b) - totalOf(a));
        list.forEach((row, i) => { row.posRank = i + 1; });
        const cutoff = REPLACEMENT_RANK[position];
        // Short pool: fall back to the last player rather than dropping to zero,
        // which would inflate every VORP at that position.
        const baseline = list[Math.min(cutoff, list.length) - 1];
        replacement[position] = baseline ? totalOf(baseline) : 0;
    });

    rows.forEach((row) => {
        row.replacementPoints = replacement[row.player.position] ?? 0;
        row.replacementPpg = row.projection.games
            ? round1(row.replacementPoints / row.projection.games)
            : 0;
        row.vorp = Math.round(totalOf(row) - row.replacementPoints);
    });

    // Overall value order — this is the list the model would draft from.
    const byValue = [...rows].sort((a, b) => b.vorp - a.vorp);
    byValue.forEach((row, i) => { row.valueRank = i + 1; });

    // Value against cost. A player whose ADP sits well behind his value rank is
    // the bargain; percentile-ranking the gap keeps the score readable whatever
    // the pool size, rather than pinning everyone near the middle of a fixed scale.
    const withCost = rows.filter((row) => costOf(row.player) !== undefined);
    const gaps = withCost
        .map((row) => ({ row, gap: costOf(row.player) - row.valueRank }))
        .sort((a, b) => a.gap - b.gap);
    gaps.forEach(({ row }, i) => {
        row.adpScore = gaps.length > 1 ? Math.round((i / (gaps.length - 1)) * 100) : 50;
        row.adpGap = costOf(row.player) - row.valueRank;
    });

    return rows;
};

export const MODEL_RANGE = MODEL_SEASONS;
