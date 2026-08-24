import React, { useMemo, useState } from 'react';
import { ui } from '../utils/uiTheme';
import { getPositionTagProps } from '../utils/playerStyles';
import { useDraftKitPositionColors } from '../context/PositionColorsContext';
import PositionColorPicker from './PositionColorPicker';
import { buildProjections, driverMeta, REPLACEMENT_RANK } from '../utils/draftScore';
import { PROJECTION_MODEL, ROOKIE_MODEL, SEASON, MODEL_SEASONS } from '../utils/projectionModel';
import { getPlayerAge } from '../utils/playerStats';
import { SCORING_FORMATS } from '../utils/scoringFormats';
import { NAV_ROUTES } from '../utils/routes';

/*
 * 2026 Draft Kit — a projection card for each of the top 150 players by ECR.
 *
 * Every card leads with projected half-PPR points per game, because that is the
 * quantity the model was fitted to predict. Positional rank / value over
 * replacement and the ADP score re-express that same projection in draft terms.
 * The model runs on 6-8 inputs per position. The card draws the four heaviest as
 * bars and the remainder as a single "smaller factors" total, so the four bars
 * plus that one number equal the projection. The tail is not itemised: the line
 * exists to close the arithmetic, not to list every input. The team-change flag
 * is held out of the four on purpose — it is binary and 85% of this board stayed
 * put, so it reads the same on six cards out of seven.
 */

const PLAYER_COUNT = 150;
// The model is fitted on half-PPR and only half-PPR. The board can be viewed in
// four scoring formats, so the format is stated on the page rather than assumed.
const SCORING_LABEL = SCORING_FORMATS['half-ppr'].shortLabel;
const POSITIONS = ['QB', 'RB', 'WR', 'TE'];
// Read from the route rather than hard-coded, so the page and the nav tab come
// out of beta in one edit instead of two.
const IS_BETA = NAV_ROUTES.some((route) => route.path === '/draft-kit' && route.beta);

const SORTS = {
    ecr: { label: 'Consensus rank', compare: (a, b) => (a.player.ecr ?? 999) - (b.player.ecr ?? 999) },
    total: {
        label: 'Projected total points',
        compare: (a, b) => (b.projection.totalPoints ?? 0) - (a.projection.totalPoints ?? 0),
    },
    projection: { label: 'Projected PPG', compare: (a, b) => b.projection.ppg - a.projection.ppg },
    games: {
        label: 'Projected games',
        compare: (a, b) => (b.projection.games ?? 0) - (a.projection.games ?? 0),
    },
    vorp: { label: 'Value over replacement', compare: (a, b) => b.vorp - a.vorp },
    adp: { label: 'Value vs ADP', compare: (a, b) => (b.adpScore ?? -1) - (a.adpScore ?? -1) },
};

const CONFIDENCE = {
    high: { label: 'High confidence', tone: 'success' },
    medium: { label: 'Medium confidence', tone: 'default' },
    low: { label: 'Low confidence', tone: 'muted' },
};

// Confidence sits in the card's footer next to plain muted text, so it uses a
// compact tag rather than ui.statPill — a full pill at that size outweighed the
// projection it was qualifying.
const CONFIDENCE_TONE = {
    high: (dark) => (dark
        ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20'
        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'),
    medium: (dark) => (dark
        ? 'bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/20'
        : 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'),
    low: (dark) => (dark
        ? 'bg-white/[0.06] text-slate-400 ring-1 ring-white/10'
        : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'),
};

const fmt = (value, feature) => {
    if (value === undefined || value === null || !Number.isFinite(value)) return '—';
    // Touchdowns over expected lives in fractions of a TD per game; everything
    // else reads better rounded to one place.
    if (feature === 'td_oe_pg') return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
    return value.toFixed(1);
};

const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('');

/** "3 picks late" / "1 pick early" / "priced right" — never "0 picks early". */
const describeAdpGap = (gap) => {
    if (gap === undefined || gap === null) return undefined;
    if (gap === 0) return 'priced right';
    const picks = Math.abs(gap) === 1 ? 'pick' : 'picks';
    return `${Math.abs(gap)} ${picks} ${gap > 0 ? 'late' : 'early'}`;
};

/**
 * One cell of the stat strip. The three metrics sit in a shared inset panel so
 * they read as one group of numbers rather than three things floating beside the
 * player's name, which is what made the old header feel unstructured.
 */
const Stat = ({ darkMode, value, label, sub, tone, lead, index = 0 }) => (
    // Borders are per-cell rather than `divide-x` on the parent, because the
    // strip is a 2x2 grid on a phone and one row from `lg` up — `divide-x` would
    // draw a left border on the third cell, which starts a row.
    <div
        className={`min-w-0 px-3.5 py-3 ${
            darkMode ? 'border-white/[0.06]' : 'border-slate-200/70'
        } ${index % 2 === 1 ? 'border-l' : ''} ${index >= 2 ? 'border-t' : ''} ${
            index > 0 ? 'lg:border-l' : 'lg:border-l-0'
        } lg:border-t-0`}
    >
        <div
            className={`font-display tabular-nums leading-none ${
                lead ? 'text-[32px] sm:text-[40px]' : 'text-[22px] sm:text-[26px]'
            } ${tone || ui.heading(darkMode)}`}
        >
            {value}
        </div>
        <div className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
            {label}
        </div>
        {sub && <div className={`mt-0.5 truncate text-xs tabular-nums ${ui.muted(darkMode)}`}>{sub}</div>}
    </div>
);

/**
 * Places the zero line for a card's four bars. Contributions are mostly positive,
 * so splitting the track down the middle left half of every row permanently
 * empty. The line instead sits where the data puts it: both sides are drawn
 * against one shared span, so a bar's length still means the same thing left or
 * right, and the positive side gets the room it actually uses.
 */
const driverAxis = (drivers) => {
    const maxPos = Math.max(0, ...drivers.map((d) => d.contribution));
    const maxNeg = Math.max(0, ...drivers.map((d) => -d.contribution));
    const span = maxPos + maxNeg || 1;
    return {
        maxPos: maxPos || 1,
        maxNeg: maxNeg || 1,
        // Where zero sits is the true negative share of the span, so a bar's
        // length means the same on both sides. The only exception is a card with
        // no negative driver at all: the line goes to a fixed gutter so the axis
        // is still visible, and nothing is ever drawn in it.
        zero: maxNeg > 0 ? maxNeg / span : 0.06,
    };
};

const DriverBar = ({ darkMode, driver, axis }) => {
    const { contribution, label, value, unit, feature, hint, imputed, display } = driver;
    const positive = contribution >= 0;
    // Each side fills its own share of the track, which is what keeps the
    // longest bar ending exactly at the track edge instead of running under the
    // value column. A floor so a tiny effect still reads as a mark.
    const share = positive
        ? (contribution / axis.maxPos) * (1 - axis.zero)
        : (-contribution / axis.maxNeg) * axis.zero;
    const width = Math.max(1.5, share * 100);
    const rail = darkMode ? 'bg-white/[0.05]' : 'bg-slate-100';

    return (
        <div className="flex items-center gap-3" title={hint}>
            {/* Sized for the longest label the model can produce ("TDs over
                expected") at this weight, so a driver name is never clipped. */}
            <div className="w-[122px] shrink-0 sm:w-[134px]">
                <div className={`truncate text-[13px] font-semibold leading-tight ${ui.heading(darkMode)}`}>
                    {label}
                </div>
                <div className={`mt-0.5 truncate text-xs tabular-nums leading-tight ${ui.muted(darkMode)}`}>
                    {display ?? `${fmt(value, feature)}${unit ? ` ${unit}` : ''}`}
                    {imputed && <span title="No data — league median used"> ·&nbsp;est</span>}
                </div>
            </div>

            <div className={`relative h-2 min-w-0 flex-1 rounded-full ${rail}`}>
                <span
                    aria-hidden="true"
                    className={`absolute -top-0.5 bottom-[-2px] w-px ${darkMode ? 'bg-white/25' : 'bg-slate-300'}`}
                    style={{ left: `${axis.zero * 100}%` }}
                />
                <div
                    className={`absolute inset-y-0 rounded-full ${
                        positive
                            ? (darkMode ? 'bg-emerald-400' : 'bg-emerald-500')
                            : (darkMode ? 'bg-rose-400' : 'bg-rose-500')
                    }`}
                    style={positive
                        ? { left: `${axis.zero * 100}%`, width: `${width}%` }
                        : { right: `${(1 - axis.zero) * 100}%`, width: `${width}%` }}
                />
            </div>

            <div
                className={`w-11 shrink-0 text-right text-[13px] font-bold tabular-nums ${
                    positive
                        ? (darkMode ? 'text-emerald-300' : 'text-emerald-600')
                        : (darkMode ? 'text-rose-300' : 'text-rose-600')
                }`}
            >
                {positive ? '+' : ''}{contribution.toFixed(1)}
            </div>
        </div>
    );
};

const PlayerCard = ({ darkMode, row, positionColors }) => {
    const { player, projection, posRank, vorp, adpScore, adpGap, replacementPpg } = row;
    const confidence = CONFIDENCE[projection.confidence];
    const axis = driverAxis(projection.drivers);
    const age = getPlayerAge(player.id);

    return (
        <article
            className={`${ui.card(darkMode)} relative overflow-hidden p-4 pl-5 transition-colors duration-200 sm:p-5 sm:pl-6 ${
                darkMode ? 'hover:border-white/[0.12]' : 'hover:border-slate-300'
            }`}
        >
            {/* Position rail, in the user's own accent for that position. This was
                keyed to tier first, which looked broken: tier tracks consensus rank
                almost exactly, so the default sort produced twelve red cards, then
                twelve orange, then a 36-card run of pink. It encoded what the card's
                position in the list already said. Position varies row to row and is
                the thing being colour-coded everywhere else on the page. */}
            <span
                aria-hidden="true"
                className="absolute inset-y-3 left-0 w-[3px] rounded-r-full"
                style={{ backgroundColor: positionColors[player.position] }}
            />

            <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-5">
                {/* identity */}
                <div className="flex min-w-0 items-center gap-3 lg:flex-1">
                    <div
                        className={`flex h-8 min-w-[32px] shrink-0 items-center justify-center rounded-lg px-1.5 text-[13px] font-bold tabular-nums ${
                            darkMode ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}
                        title="Consensus rank"
                    >
                        {player.ecr ?? '—'}
                    </div>
                    {player.photo ? (
                        <img
                            src={player.photo}
                            alt=""
                            loading="lazy"
                            className={`h-14 w-14 shrink-0 rounded-full object-cover sm:h-16 sm:w-16 ${
                                darkMode ? 'bg-slate-800 ring-1 ring-white/10' : 'bg-slate-100 ring-1 ring-slate-200'
                            }`}
                        />
                    ) : (
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold sm:h-16 sm:w-16 ${
                            darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                        }`}
                        >
                            {initials(player.name)}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h3 className={`truncate font-display text-xl leading-tight sm:text-[22px] ${ui.heading(darkMode)}`}>
                            {player.name}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span
                                data-testid="draftkit-position"
                                {...getPositionTagProps(player.position, { darkMode, colors: positionColors })}
                            >
                                {player.position}
                            </span>
                            <span className={`text-[13px] font-medium ${ui.muted(darkMode)}`}>{player.team}</span>
                            {age && <span className={`text-[13px] tabular-nums ${ui.muted(darkMode)}`}>{age}y</span>}
                            {projection.isRookie && (
                                <span
                                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                        darkMode
                                            ? 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20'
                                            : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                    }`}
                                >
                                    Rookie · pick {projection.draft.pick}
                                </span>
                            )}
                            {/* Only shown when the injury actually costs games. A
                                camp knock with a return date before week one is
                                real news and zero projection impact, and tagging
                                it here would imply otherwise. */}
                            {projection.injury && projection.gamesMissed >= 0.5 && (
                                <span
                                    title={projection.injury.description || projection.injury.label}
                                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                        darkMode
                                            ? 'bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20'
                                            : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                                    }`}
                                >
                                    {projection.injury.label}
                                    {projection.injury.bodyPart ? ` · ${projection.injury.bodyPart}` : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Projected total leads, because a season total is what a league
                    is won on and what rank and value-vs-ADP are now built from.
                    PPG sits under it as the rate the model actually predicts. */}
                <div className={`grid grid-cols-2 lg:w-[28rem] lg:shrink-0 lg:grid-cols-4 ${ui.cardInset(darkMode)}`}>
                    <Stat
                        index={0}
                        lead
                        darkMode={darkMode}
                        value={projection.totalPoints ?? '—'}
                        label="Proj. points"
                        sub={`${projection.ppg.toFixed(1)} /g`}
                        tone={darkMode ? 'text-emerald-300' : 'text-emerald-600'}
                    />
                    <Stat
                        index={1}
                        darkMode={darkMode}
                        value={projection.games === undefined ? '—' : projection.games.toFixed(1)}
                        label="Proj. games"
                        sub={projection.gamesMissed >= 0.5
                            ? `−${projection.gamesMissed.toFixed(1)} injured`
                            : 'no injury'}
                        tone={projection.gamesMissed >= 0.5
                            ? (darkMode ? 'text-amber-300' : 'text-amber-600')
                            : undefined}
                    />
                    <Stat
                        index={2}
                        darkMode={darkMode}
                        value={`${player.position}${posRank}`}
                        label="Proj. rank"
                        sub={`${vorp >= 0 ? '+' : ''}${vorp} vs repl.`}
                    />
                    <Stat
                        index={3}
                        darkMode={darkMode}
                        value={adpScore ?? '—'}
                        label="vs ADP"
                        sub={describeAdpGap(adpGap)}
                        tone={adpScore >= 66
                            ? (darkMode ? 'text-emerald-300' : 'text-emerald-600')
                            : adpScore <= 33
                                ? (darkMode ? 'text-rose-300' : 'text-rose-600')
                                : undefined}
                    />
                </div>
            </div>

            {/* drivers */}
            <div className={`mt-4 border-t pt-3.5 ${darkMode ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                {projection.isRookie ? (
                    <div className={`space-y-2 text-xs ${ui.muted(darkMode)}`}>
                        <p>
                            No NFL snaps yet, so there is nothing to build drivers from. The projection
                            is his draft slot: round&nbsp;{projection.draft.round},
                            pick&nbsp;{projection.draft.pick}.
                        </p>
                        {/* This average IS the projection for everyone except a rookie WR,
                            who also carries a landing-spot adjustment. Where that applies the
                            adjustment is spelled out below, because the card must never cite
                            one number as its evidence and print a different one. */}
                        {projection.comparable && (
                            <p className={ui.heading(darkMode)}>
                                <span className="tabular-nums">
                                    {player.position}s drafted {projection.comparable.lo}–
                                    {projection.comparable.hi} since 2015 average{' '}
                                    <strong>{projection.comparable.mean} PPG</strong> as rookies
                                    {' '}(n&nbsp;=&nbsp;{projection.comparable.n})
                                </span>
                                <span className={ui.muted(darkMode)}>, weighted toward recent classes.</span>
                            </p>
                        )}
                        {projection.landing && (
                            <p className={ui.heading(darkMode)}>
                                <span className="tabular-nums">
                                    {player.team} vacated{' '}
                                    <strong>{Math.round(projection.landing.vacated)}%</strong> of its
                                    targets, worth{' '}
                                    <strong>
                                        {projection.landing.adjust > 0 ? '+' : ''}
                                        {projection.landing.adjust} PPG
                                    </strong>
                                </span>
                                <span className={ui.muted(darkMode)}>
                                    {' '}— opportunity is most of what can be known about a rookie
                                    receiver, and the only position where it holds up out of sample.
                                </span>
                            </p>
                        )}
                        <p>
                            Draft slot is a thin signal next to a stat line, so rookies carry low
                            confidence and a wide range.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={`mb-2.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
                            <span>What moves this projection</span>
                            <span>PPG effect</span>
                        </div>
                        {/* Without this row the bars read as "expect him to gain +5.1",
                            when they actually measure distance from an average starter.
                            Showing the baseline makes the sum add up on the page. */}
                        <div className={`mb-3 flex items-baseline justify-between gap-2 text-xs ${ui.muted(darkMode)}`}>
                            <span>Average {player.position} starts at</span>
                            <span className="tabular-nums">{projection.baseline.toFixed(1)} PPG</span>
                        </div>
                        {/* Two columns on anything wider than a phone. One column
                            gave each bar ~750px of track to express a range of about
                            five points, so most of the width was empty rail; pairing
                            them halves the track, doubles the room for labels, and
                            makes the card two rows tall instead of four. All four
                            still share one axis, so lengths stay comparable across
                            the columns. */}
                        <div className="grid gap-x-7 gap-y-2.5 sm:grid-cols-2">
                            {projection.drivers.map((driver) => (
                                <DriverBar key={driver.feature} darkMode={darkMode} driver={driver} axis={axis} />
                            ))}
                        </div>
                        {/* Everything below the headline four, as one number. The
                            breakdown is deliberately not shown — the point of the
                            line is that the four bars plus this equals the
                            projection, not to itemise the tail. */}
                        {projection.otherFactors.length > 0 && (
                            <div className={`mt-3 flex items-center justify-between gap-2 border-t pt-2.5 text-[10px] ${ui.muted(darkMode)} ${
                                darkMode ? 'border-white/[0.04]' : 'border-slate-100'
                            }`}>
                                <span className="font-semibold uppercase tracking-[0.06em]">
                                    {projection.otherFactors.length} smaller
                                    {' '}
                                    {projection.otherFactors.length === 1 ? 'factor' : 'factors'}
                                </span>
                                <span
                                    className={`text-[11px] font-semibold tabular-nums ${
                                        projection.otherContribution >= 0
                                            ? (darkMode ? 'text-emerald-300' : 'text-emerald-600')
                                            : (darkMode ? 'text-rose-300' : 'text-rose-600')
                                    }`}
                                >
                                    {projection.otherContribution >= 0 ? '+' : ''}
                                    {projection.otherContribution.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </>
                )}

                <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            CONFIDENCE_TONE[projection.confidence](darkMode)
                        }`}
                    >
                        {confidence.label}
                    </span>
                    {!projection.isRookie && (
                        <span className={`text-[11px] ${ui.muted(darkMode)}`}>
                            {projection.seasonsUsed > 1
                                ? `${projection.seasonsUsed} seasons weighted`
                                : 'One season on record'}
                            {` · ${projection.inputCount} model inputs`}
                            {' · replacement '}
                            {replacementPpg.toFixed(1)} PPG
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
};

const MethodModal = ({ darkMode, onClose }) => {
    // Everything quoted below is read out of the fitted model rather than typed
    // in, so a refit can never leave the description behind.
    const totalRows = POSITIONS.reduce((sum, p) => sum + PROJECTION_MODEL[p].n, 0);
    const rookieN = POSITIONS.reduce((sum, p) => sum + ROOKIE_MODEL[p].n, 0);

    return (
        <div
            className={ui.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="draftkit-method-title"
            onClick={onClose}
        >
            <div
                className={`${ui.modal(darkMode, '2xl')} max-h-[85vh] overflow-y-auto`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-4">
                    <h2 id="draftkit-method-title" className={`text-lg font-bold ${ui.heading(darkMode)}`}>
                        How these numbers work
                    </h2>
                    <button type="button" onClick={onClose} className={ui.btn(darkMode)}>Close</button>
                </div>

                <div className={`space-y-5 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <p className={`text-base ${ui.heading(darkMode)}`}>
                        Projected {SCORING_LABEL} fantasy points for the 2026 season.
                    </p>

                    <section>
                        <h3 className={`mb-1 font-semibold ${ui.heading(darkMode)}`}>Sources</h3>
                        <p>
                            Sleeper season scoring, 2009–{MODEL_SEASONS[1]}. nflverse weekly stats
                            aggregated to seasons, {MODEL_SEASONS[0]}–{MODEL_SEASONS[1]}, for snaps,
                            red-zone volume and market share. nflverse draft records for rookies and
                            the {SEASON.year} schedule. ESPN's injury feed for current designations
                            and return dates.
                        </p>
                    </section>

                    <section>
                        <h3 className={`mb-1 font-semibold ${ui.heading(darkMode)}`}>How a score is built</h3>
                        <p className="mb-2">
                            A projection starts at the position baseline — what an average starter at
                            that position scores the following season — and each input then adds or
                            subtracts from it. Inputs are averaged over the player&apos;s last two or
                            three seasons, weighted toward the most recent.
                        </p>
                        <dl className={`space-y-1.5 rounded-xl px-3 py-2.5 text-[13px] ${
                            darkMode ? 'bg-white/[0.03]' : 'bg-slate-50'
                        }`}
                        >
                            {POSITIONS.map((position) => (
                                <div key={position} className="flex gap-2.5">
                                    <dt className={`w-8 shrink-0 font-bold ${ui.heading(darkMode)}`}>
                                        {position}
                                    </dt>
                                    <dd className="min-w-0">
                                        <span className={ui.muted(darkMode)}>
                                            {PROJECTION_MODEL[position].intercept.toFixed(1)} PPG baseline +{' '}
                                        </span>
                                        {PROJECTION_MODEL[position].features
                                            .map((f) => driverMeta(f).label.toLowerCase())
                                            .join(', ')}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <p className="mt-2">
                            Fitted on {totalRows.toLocaleString()} season-to-season transitions from
                            {' '}{MODEL_SEASONS[0]}–{MODEL_SEASONS[1]}, covering every quarterback,
                            running back, receiver and tight end in that span. These inputs were picked
                            by testing every stat in the feeds against those seasons and keeping the
                            ones that predicted best.
                        </p>
                    </section>

                    <section>
                        <h3 className={`mb-1 font-semibold ${ui.heading(darkMode)}`}>The four numbers</h3>
                        <p className="mb-1.5">
                            <strong>Projected points</strong> — the season total: points per game
                            multiplied by projected games. Points per game sits underneath it.
                        </p>
                        <p className="mb-1.5">
                            <strong>Projected games</strong> — a positional baseline adjusted for
                            career durability, then scaled by the share of the season a current injury
                            still leaves.
                        </p>
                        <p className="mb-1.5">
                            <strong>Projected rank</strong> — that total&apos;s rank at the position,
                            and its margin over the replacement-level starter (QB{REPLACEMENT_RANK.QB},
                            {' '}RB{REPLACEMENT_RANK.RB}, WR{REPLACEMENT_RANK.WR}, TE{REPLACEMENT_RANK.TE}
                            {' '}in a 12-team league).
                        </p>
                        <p>
                            <strong>Value vs ADP</strong> — the total against the player&apos;s draft
                            cost, on a 0–100 scale across the board.
                        </p>
                    </section>

                    <section>
                        <h3 className={`mb-1 font-semibold ${ui.heading(darkMode)}`}>Games and injuries</h3>
                        <p className="mb-1.5">
                            Availability barely repeats year to year — prior games played predict the
                            next season&apos;s at 0.10 to 0.23, and a fit on games, durability and age
                            explains 2% of the variance at running back. Games come from the positional
                            baseline and the player&apos;s own career durability, pulled toward the
                            positional average when he has only a season or two on record.
                        </p>
                        <p>
                            A current injury costs the weeks its <strong>return date</strong> rules out,
                            plus a premium for the designation and the body part. The premium is there
                            because a published return date is usually the next re-evaluation rather
                            than a return to play, so a knee reported in August lands four days out and
                            still costs games.
                        </p>
                    </section>

                    <section>
                        <h3 className={`mb-1 font-semibold ${ui.heading(darkMode)}`}>Rookies</h3>
                        <p>
                            No NFL stats, so the score is the average rookie season of players drafted in
                            the same pick range since {MODEL_SEASONS[0]} — {rookieN.toLocaleString()}{' '}
                            drafted players, recent classes weighted more heavily. Players who never
                            recorded a season count as zero.
                        </p>
                    </section>

                    <section>
                        <h3 className={`mb-1 font-semibold ${ui.heading(darkMode)}`}>Accuracy</h3>
                        <p>
                            Scored by fitting the model without a season and then projecting it. Out of
                            sample:{' '}
                            {POSITIONS.map((p) => `${p} ${PROJECTION_MODEL[p].r2.toFixed(2)}`).join(' · ')}
                            {' '}R². All figures are {SCORING_LABEL} only.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

const DraftKit = ({ darkMode, allPlayers = [] }) => {
    const positionColorsKit = useDraftKitPositionColors();
    const positionColors = positionColorsKit.colors;
    const [showColors, setShowColors] = useState(false);
    const [sort, setSort] = useState('ecr');
    // Positions are a toggle set rather than one choice, so RB+WR or WR/RB/TE can
    // be looked at together. Empty means every position: deselecting the last one
    // falls back to the full board instead of an empty page.
    const [positionFilter, setPositionFilter] = useState([]);
    const [showMethod, setShowMethod] = useState(false);

    // Projections are built from the WHOLE board, not the visible slice: value
    // over replacement and the ADP score are relative measures, and computing
    // them off the visible slice alone would put replacement level inside the
    // starters and inflate every VORP on the page.
    const rows = useMemo(() => {
        const scored = buildProjections(allPlayers);
        const byId = new Map(scored.map((row) => [row.player.id, row]));
        return allPlayers
            .filter((player) => player.ecr)
            .sort((a, b) => a.ecr - b.ecr)
            .slice(0, PLAYER_COUNT)
            .map((player) => byId.get(player.id))
            .filter(Boolean);
    }, [allPlayers]);

    const togglePosition = (position) => {
        setPositionFilter((current) => (current.includes(position)
            ? current.filter((p) => p !== position)
            : [...current, position]));
    };

    const visible = useMemo(() => {
        const filtered = positionFilter.length
            ? rows.filter((row) => positionFilter.includes(row.player.position))
            : rows;
        return [...filtered].sort(SORTS[sort].compare);
    }, [rows, sort, positionFilter]);

    const skipped = Math.min(PLAYER_COUNT, allPlayers.filter((p) => p.ecr).length) - rows.length;

    return (
        <div className="container mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
            <header className="mb-6">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${ui.heading(darkMode)}`}>
                        2026 Draft Kit
                    </h1>
                    {IS_BETA && (
                        <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                                darkMode
                                    ? 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25'
                                    : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                            }`}
                        >
                            Beta
                        </span>
                    )}
                    <span className={ui.statPill(darkMode, 'success')}>{SCORING_LABEL} scoring</span>
                </div>
                <p className={`mt-2 max-w-2xl text-sm ${ui.muted(darkMode)}`}>
                    Projected 2026 totals for the top {PLAYER_COUNT} players by consensus rank,
                    with games played and current injuries priced in.
                    {' '}<strong>{SCORING_LABEL}</strong> only, whatever your board is set to.
                </p>
                <button
                    type="button"
                    onClick={() => setShowMethod(true)}
                    className={`mt-3 ${ui.btn(darkMode)}`}
                >
                    How these numbers are built
                </button>
            </header>

            {/* Sticky so the filters stay reachable down a 150-card list. z-30
                sits under the app nav (z-40) and well under the modal (z-50). */}
            <div className="sticky top-[4.5rem] z-30 mb-5">
                <div className={`${ui.toolbar(darkMode)} flex flex-wrap items-center gap-x-4 gap-y-3`}>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
                            Position
                        </span>
                        {/* A segmented control rather than five separate buttons: these
                            are one control with several states, and it matches the app
                            nav's own segment styling. */}
                        <div className={ui.navSegment(darkMode)}>
                            <button
                                type="button"
                                onClick={() => setPositionFilter([])}
                                aria-pressed={!positionFilter.length}
                                className={`${ui.navPill(darkMode, !positionFilter.length)} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50`}
                            >
                                All
                            </button>
                            {POSITIONS.map((position) => {
                                const active = positionFilter.includes(position);
                                return (
                                    <button
                                        key={position}
                                        type="button"
                                        onClick={() => togglePosition(position)}
                                        aria-pressed={active}
                                        className={`${ui.navPill(darkMode, active)} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50`}
                                    >
                                        {position}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <label className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
                            Sort
                        </span>
                        <select
                            value={sort}
                            onChange={(event) => setSort(event.target.value)}
                            className={`${ui.btn(darkMode)} cursor-pointer py-1.5 text-xs sm:text-sm`}
                        >
                            {Object.entries(SORTS).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </label>

                    <div className="ml-auto flex items-center gap-3">
                        <span className={`text-[11px] tabular-nums ${ui.muted(darkMode)}`}>
                            {visible.length} {visible.length === 1 ? 'player' : 'players'}
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowColors(true)}
                            className={`${ui.btn(darkMode)} cursor-pointer py-1.5 text-xs sm:text-sm`}
                            aria-haspopup="dialog"
                        >
                            <span className="flex items-center gap-1" aria-hidden="true">
                                {POSITIONS.map((position) => (
                                    <span
                                        key={position}
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: positionColors[position] }}
                                    />
                                ))}
                            </span>
                            Colors
                        </button>
                    </div>
                </div>
            </div>

            {skipped > 0 && (
                <p className={`mb-4 text-xs ${ui.muted(darkMode)}`}>
                    {skipped} of the top {PLAYER_COUNT} have no projection — kickers, team defenses and anyone
                    with neither an NFL season nor draft capital on record. They are left out rather than
                    shown as a zero.
                </p>
            )}

            <div className="flex flex-col gap-3">
                {visible.map((row) => (
                    <PlayerCard
                        key={row.player.id}
                        darkMode={darkMode}
                        row={row}
                        positionColors={positionColors}
                    />
                ))}
            </div>

            {!visible.length && (
                <p className={`py-12 text-center text-sm ${ui.muted(darkMode)}`}>
                    No players match that filter.
                </p>
            )}

            {showMethod && <MethodModal darkMode={darkMode} onClose={() => setShowMethod(false)} />}

            {showColors && (
                <PositionColorPicker
                    darkMode={darkMode}
                    onClose={() => setShowColors(false)}
                    controller={positionColorsKit}
                    subtitle={positionColorsKit.linked
                        ? 'Shared with the draft board — a change here changes both.'
                        : 'Draft Kit only. The draft board keeps its own colors.'}
                >
                    <label
                        className={`mb-5 flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                            darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={positionColorsKit.linked}
                            onChange={(event) => positionColorsKit.setLinked(event.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-500"
                        />
                        <span className="min-w-0">
                            <span className={`block text-sm font-semibold ${ui.heading(darkMode)}`}>
                                Match colors with draft board
                            </span>
                            <span className={`mt-0.5 block text-xs ${ui.muted(darkMode)}`}>
                                On, the swatches below edit the colors both pages share. Off, the Draft
                                Kit keeps its own set and the board is left alone.
                            </span>
                        </span>
                    </label>
                </PositionColorPicker>
            )}
        </div>
    );
};

export default DraftKit;
