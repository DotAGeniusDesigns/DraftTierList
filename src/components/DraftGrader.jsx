import React, { useMemo, useState } from 'react';
import { ui } from '../utils/uiTheme';
import { getPositionTagProps } from '../utils/playerStyles';
import { useDraftKitPositionColors } from '../context/PositionColorsContext';
import { SCORING_FORMATS } from '../utils/scoringFormats';
import { SEASON } from '../utils/projectionModel';
import { NAV_ROUTES } from '../utils/routes';
import { fetchLeague, fetchLeagueRosters, fetchLeagueUsers } from '../utils/sleeperLeague';
import {
    DEFAULT_LEAGUE, MATCHUP_SWING, SLOT_TYPES, gradeRoster, leagueFromSleeper,
    rosterFromSleeper, startingSlotCount,
} from '../utils/draftGrader';

/*
 * Draft grader — expected points per week for a roster, against what an average
 * team in the same league would score.
 *
 * The number rests on the Draft Kit's projections, so it inherits their scope:
 * half-PPR, and a rate rather than a weekly forecast. What genuinely varies week
 * to week is who is on the field — byes come off the real schedule, injuries off
 * their return date — and that is where two similar-looking rosters separate.
 */

const SCORING_LABEL = SCORING_FORMATS['half-ppr'].shortLabel;
const IS_BETA = NAV_ROUTES.some((route) => route.path === '/draft-grader' && route.beta);
const SLOT_KEYS = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'SUPERFLEX'];

const GRADE_TONE = (grade, dark) => {
    const letter = grade[0];
    if (letter === 'A') return dark ? 'text-emerald-300' : 'text-emerald-600';
    if (letter === 'B') return dark ? 'text-sky-300' : 'text-sky-600';
    if (letter === 'C') return dark ? 'text-amber-300' : 'text-amber-600';
    return dark ? 'text-rose-300' : 'text-rose-600';
};

const Field = ({ darkMode, label, children }) => (
    <label className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
            {label}
        </span>
        {children}
    </label>
);

const WeekBars = ({ darkMode, weeks, average, selected, onSelect }) => {
    const points = weeks.map((w) => w.points);
    const max = Math.max(...points, average);
    // A zero-based axis is useless here: every week lands between about 80 and
    // 105, so the bars come out the same height and a bye week looks like a good
    // one. The floor sits just below the worst week instead, which is what makes
    // the week-to-week spread the chart is for actually visible.
    const floor = Math.min(...points, average) * 0.94;
    const span = Math.max(max - floor, 1);
    const height = (value) => `${Math.max(3, ((value - floor) / span) * 100)}%`;

    return (
        <div className="relative" style={{ height: 96 }}>
            {/* the league average, as a line to read the bars against */}
            <div
                className={`pointer-events-none absolute inset-x-0 border-t border-dashed ${
                    darkMode ? 'border-white/25' : 'border-slate-400/60'
                }`}
                style={{ bottom: height(average) }}
            />
            <div className="flex h-full items-stretch gap-[3px]">
                {weeks.map((w) => (
                    <button
                        type="button"
                        key={w.week}
                        onClick={() => onSelect(w.week)}
                        aria-pressed={selected === w.week}
                        className="flex flex-1 cursor-pointer flex-col justify-end focus-visible:outline-none"
                        title={`Week ${w.week}: ${w.points.toFixed(1)} pts`
                            + (w.unavailable.length
                                ? ` · out: ${w.unavailable.map((r) => r.player.name).join(', ')}`
                                : '')}
                    >
                        <div
                            className={`w-full rounded-t-sm transition-opacity ${
                                selected === w.week ? '' : 'opacity-70 hover:opacity-100'
                            } ${
                                w.points < average
                                    ? (darkMode ? 'bg-rose-400' : 'bg-rose-400')
                                    : (darkMode ? 'bg-emerald-400' : 'bg-emerald-500')
                            }`}
                            style={{ height: height(w.points) }}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};

const DraftGrader = ({ darkMode, allPlayers = [] }) => {
    const { colors: positionColors } = useDraftKitPositionColors();
    const [league, setLeague] = useState(DEFAULT_LEAGUE);
    const [roster, setRoster] = useState([]);
    const [query, setQuery] = useState('');
    const [leagueId, setLeagueId] = useState('');
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState('');
    const [teamChoices, setTeamChoices] = useState(null);
    const [unmatched, setUnmatched] = useState([]);
    const [week, setWeek] = useState(1);

    const pool = useMemo(() => allPlayers.filter((p) => p.ecr), [allPlayers]);

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) return [];
        return pool
            .filter((p) => p.name.toLowerCase().includes(q) && !roster.includes(p.id))
            .sort((a, b) => a.ecr - b.ecr)
            .slice(0, 8);
    }, [query, pool, roster]);

    const result = useMemo(
        () => (roster.length ? gradeRoster(roster, pool, league) : null),
        [roster, pool, league],
    );

    const setSlot = (key, value) => setLeague((prev) => ({
        ...prev,
        slots: { ...prev.slots, [key]: Math.max(0, Math.min(4, Number(value) || 0)) },
    }));

    const importLeague = async () => {
        const id = leagueId.trim();
        if (!id) return;
        setImporting(true);
        setImportError('');
        setTeamChoices(null);
        try {
            const [meta, rosters, users] = await Promise.all([
                fetchLeague(id), fetchLeagueRosters(id), fetchLeagueUsers(id),
            ]);
            const settings = leagueFromSleeper(meta);
            setLeague({ teams: settings.teams, slots: settings.slots, unsupported: settings.unsupported });
            const byOwner = new Map((users || []).map((u) => [u.user_id, u]));
            setTeamChoices((rosters || []).map((r) => ({
                rosterId: r.roster_id,
                name: byOwner.get(r.owner_id)?.metadata?.team_name
                    || byOwner.get(r.owner_id)?.display_name
                    || `Team ${r.roster_id}`,
                players: r.players || [],
            })));
        } catch (error) {
            setImportError(error.message || 'Could not read that league.');
        } finally {
            setImporting(false);
        }
    };

    const chooseTeam = (choice) => {
        const { matched, unmatched: missed } = rosterFromSleeper(choice.players);
        setRoster(matched);
        setUnmatched(missed);
        setTeamChoices(null);
    };

    const starters = startingSlotCount(league.slots);

    return (
        <div className="container mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
            <header className="mb-6">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${ui.heading(darkMode)}`}>
                        Draft Grader
                    </h1>
                    {IS_BETA && (
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
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
                    Your expected points per week against what an average team in the same league
                    scores. Lineups are set a week at a time, so byes and injury returns count.
                    {' '}<strong>{SCORING_LABEL}</strong> only, whatever your league is set to.
                </p>
            </header>

            {/* league settings */}
            <div className={`${ui.toolbar(darkMode)} mb-4 flex flex-wrap items-center gap-x-4 gap-y-3`}>
                <Field darkMode={darkMode} label="Teams">
                    <input
                        type="number" min="4" max="16" value={league.teams}
                        onChange={(e) => setLeague((p) => ({
                            ...p, teams: Math.max(4, Math.min(16, Number(e.target.value) || 12)),
                        }))}
                        className={`${ui.btn(darkMode)} w-16 py-1.5 text-sm`}
                    />
                </Field>
                {SLOT_KEYS.map((key) => (
                    <Field key={key} darkMode={darkMode} label={SLOT_TYPES[key].label}>
                        <input
                            type="number" min="0" max="4" value={league.slots[key] || 0}
                            onChange={(e) => setSlot(key, e.target.value)}
                            className={`${ui.btn(darkMode)} w-14 py-1.5 text-sm`}
                        />
                    </Field>
                ))}
                <span className={`ml-auto text-[11px] tabular-nums ${ui.muted(darkMode)}`}>
                    {starters} starters
                </span>
            </div>

            {/* roster input */}
            <div className={`${ui.card(darkMode)} mb-5 p-4 sm:p-5`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                    <div className="relative min-w-0 flex-1">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Add a player by name…"
                            className={ui.input(darkMode)}
                        />
                        {matches.length > 0 && (
                            <div className={`absolute z-20 mt-1 w-full overflow-hidden ${ui.dropdown(darkMode)}`}>
                                {matches.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { setRoster((r) => [...r, p.id]); setQuery(''); }}
                                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                                            darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <span {...getPositionTagProps(p.position, { darkMode, colors: positionColors })}>
                                            {p.position}
                                        </span>
                                        <span className={ui.heading(darkMode)}>{p.name}</span>
                                        <span className={`ml-auto text-xs tabular-nums ${ui.muted(darkMode)}`}>
                                            {p.team} · ECR {p.ecr}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            value={leagueId}
                            onChange={(e) => setLeagueId(e.target.value)}
                            placeholder="Sleeper league ID"
                            className={`${ui.input(darkMode)} lg:w-52`}
                        />
                        <button
                            type="button"
                            onClick={importLeague}
                            disabled={importing || !leagueId.trim()}
                            className={`${ui.btn(darkMode)} shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            {importing ? 'Reading…' : 'Import'}
                        </button>
                    </div>
                </div>

                {importError && <p className={`${ui.fieldError(darkMode)}`}>{importError}</p>}

                {teamChoices && (
                    <div className="mt-3">
                        <p className={`mb-2 text-xs ${ui.muted(darkMode)}`}>Which team is yours?</p>
                        <div className="flex flex-wrap gap-2">
                            {teamChoices.map((c) => (
                                <button key={c.rosterId} type="button" onClick={() => chooseTeam(c)}
                                    className={`${ui.btn(darkMode)} cursor-pointer py-1.5 text-xs`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {roster.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {result?.rows.map((row) => (
                            <button
                                key={row.player.id}
                                type="button"
                                onClick={() => setRoster((r) => r.filter((id) => id !== row.player.id))}
                                title="Remove"
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition ${
                                    darkMode
                                        ? 'bg-white/[0.06] text-slate-200 hover:bg-rose-400/15'
                                        : 'bg-slate-100 text-slate-700 hover:bg-rose-50'
                                }`}
                            >
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: positionColors[row.player.position] }}
                                />
                                {row.player.name}
                                <span className={`tabular-nums ${ui.muted(darkMode)}`}>
                                    {row.projection.ppg}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {(result?.missing?.length > 0 || unmatched.length > 0) && (
                    <p className={`mt-2 text-[11px] ${ui.muted(darkMode)}`}>
                        {(result?.missing?.length || 0) + unmatched.length} player(s) on that roster
                        aren&apos;t on the board and are left out — kickers, defenses and anyone the
                        model has no projection for.
                    </p>
                )}
                {league.unsupported && Object.keys(league.unsupported).length > 0 && (
                    <p className={`mt-2 text-[11px] ${ui.muted(darkMode)}`}>
                        This league starts {Object.entries(league.unsupported)
                            .map(([k, n]) => `${n}× ${k}`).join(', ')}, which the model does not
                        project. Those slots are excluded from both your score and the average.
                    </p>
                )}
            </div>

            {!result && (
                <p className={`py-12 text-center text-sm ${ui.muted(darkMode)}`}>
                    Add players or import a Sleeper league to grade a roster.
                </p>
            )}

            {result && (
                <>
                    <div className={`${ui.card(darkMode)} mb-4 p-4 sm:p-5`}>
                        <div className="grid grid-cols-2 gap-y-4 lg:grid-cols-4">
                            <div>
                                <div className={`font-display text-[44px] leading-none ${GRADE_TONE(result.grade, darkMode)}`}>
                                    {result.grade}
                                </div>
                                <div className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
                                    Draft grade
                                </div>
                            </div>
                            <div>
                                <div className={`font-display text-[32px] leading-none ${ui.heading(darkMode)}`}>
                                    {result.perWeek.toFixed(1)}
                                </div>
                                <div className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
                                    Your pts / week
                                </div>
                            </div>
                            <div>
                                <div className={`font-display text-[32px] leading-none ${ui.muted(darkMode)}`}>
                                    {result.average.total.toFixed(1)}
                                </div>
                                <div className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
                                    League average
                                </div>
                            </div>
                            <div>
                                <div className={`font-display text-[32px] leading-none ${
                                    result.differential >= 0
                                        ? (darkMode ? 'text-emerald-300' : 'text-emerald-600')
                                        : (darkMode ? 'text-rose-300' : 'text-rose-600')
                                }`}
                                >
                                    {result.differential >= 0 ? '+' : ''}{result.differential.toFixed(1)}
                                </div>
                                <div className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
                                    Differential
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${ui.card(darkMode)} mb-4 p-4 sm:p-5`}>
                        <div className={`mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
                            <span>Week by week</span>
                            <span>
                                best {result.bestWeek?.points.toFixed(1)} · worst {result.worstWeek?.points.toFixed(1)}
                            </span>
                        </div>
                        <WeekBars
                            darkMode={darkMode}
                            weeks={result.weeks}
                            average={result.average.total}
                            selected={week}
                            onSelect={setWeek}
                        />
                        <div className={`mt-1.5 flex justify-between text-[10px] tabular-nums ${ui.muted(darkMode)}`}>
                            <span>Wk 1</span>
                            <span>Wk {result.weeks.length}</span>
                        </div>
                        <p className={`mt-2 text-[11px] ${ui.muted(darkMode)}`}>
                            The dashed line is the league average; red weeks fall under it. Click a week
                            to see that lineup. Byes come from the {SEASON.year} schedule, injuries from
                            their return date. Each score is moved up to ±{MATCHUP_SWING} by that
                            week&apos;s opponent, using the board&apos;s 2026 team-defence ranks. A slot
                            with nobody left on the roster is filled by a streamer at waiver level,
                            not scored as a zero.
                        </p>
                    </div>

                    {(() => {
                        const w = result.weeks[week - 1];
                        if (!w) return null;
                        return (
                            <div className={`${ui.card(darkMode)} p-4 sm:p-5`}>
                                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                                    <span className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
                                        Week {w.week} lineup
                                    </span>
                                    <span className={`text-sm font-semibold tabular-nums ${
                                        w.points < result.average.total
                                            ? (darkMode ? 'text-rose-300' : 'text-rose-600')
                                            : (darkMode ? 'text-emerald-300' : 'text-emerald-600')
                                    }`}
                                    >
                                        {w.points.toFixed(1)} pts
                                        <span className={`ml-2 font-normal ${ui.muted(darkMode)}`}>
                                            {w.points >= result.average.total ? '+' : ''}
                                            {(w.points - result.average.total).toFixed(1)} vs average
                                        </span>
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {w.lineup.map(({ slot, row, opponent, adjust }, i) => (
                                        <div key={`${slot}-${i}`} className="flex items-center gap-3 text-sm">
                                            <span className={`w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide ${ui.muted(darkMode)}`}>
                                                {SLOT_TYPES[slot].label}
                                            </span>
                                            {row ? (
                                                <>
                                                    <span {...getPositionTagProps(row.player.position, { darkMode, colors: positionColors })}>
                                                        {row.player.position}
                                                    </span>
                                                    <span className={`truncate ${ui.heading(darkMode)}`}>
                                                        {row.player.name}
                                                    </span>
                                                    {opponent && (
                                                        <span
                                                            className={`shrink-0 text-[11px] tabular-nums ${
                                                                adjust > 0.2
                                                                    ? (darkMode ? 'text-emerald-300' : 'text-emerald-600')
                                                                    : adjust < -0.2
                                                                        ? (darkMode ? 'text-rose-300' : 'text-rose-600')
                                                                        : ui.muted(darkMode)
                                                            }`}
                                                            title={`${row.projection.ppg.toFixed(1)} base `
                                                                + `${adjust >= 0 ? '+' : ''}${adjust.toFixed(1)} matchup`}
                                                        >
                                                            vs {opponent} {adjust >= 0 ? '+' : ''}{adjust.toFixed(1)}
                                                        </span>
                                                    )}
                                                    <span className={`ml-auto tabular-nums ${ui.heading(darkMode)}`}>
                                                        {Math.max(0, row.projection.ppg + (adjust || 0)).toFixed(1)}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                            darkMode
                                                                ? 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20'
                                                                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                                        }`}
                                                    >
                                                        Streamer
                                                    </span>
                                                    <span className={`truncate ${ui.muted(darkMode)}`}>
                                                        nobody on the roster — waiver pickup
                                                    </span>
                                                    <span className={`ml-auto tabular-nums ${ui.muted(darkMode)}`}>
                                                        {(w.lineup.find((l) => l.slot === slot && !l.row)?.streamerPoints ?? 0).toFixed(1)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {w.unavailable.length > 0 && (
                                    <div className={`mt-3 border-t pt-2.5 ${darkMode ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                                        <span className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${ui.muted(darkMode)}`}>
                                            Out this week
                                        </span>
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {w.unavailable.map((row) => (
                                                <span
                                                    key={row.player.id}
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs ${
                                                        darkMode ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {row.player.name}
                                                    <span className={ui.muted(darkMode)}>
                                                        {SEASON.byes?.[row.player.team] === w.week ? 'bye' : 'injured'}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </>
            )}
        </div>
    );
};

export default DraftGrader;
