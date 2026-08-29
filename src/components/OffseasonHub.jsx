import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ui } from '../utils/uiTheme';
import { getPositionTagProps } from '../utils/playerStyles';
import { usePositionColors } from '../context/PositionColorsContext';
import { offseasonData, NEW_HC_TEAMS } from '../utils/offseasonData';
import { getOffseasonNews, OFFSEASON_NEWS_UPDATED_AT } from '../utils/offseasonNews';
import { teamData } from '../utils/teamData';
import { playerDatabase } from '../utils/playerDatabase';
import { getInjury } from '../utils/injuryReport';
import InjuryBadge from './InjuryBadge';

const DIVISIONS = [
    'AFC East', 'AFC North', 'AFC South', 'AFC West',
    'NFC East', 'NFC North', 'NFC South', 'NFC West',
];

// Projected depth charts, computed once from the same database that powers
// the draft board so rosters never drift out of sync.
const DEPTH_SLOTS = [
    { position: 'QB', count: 1 },
    { position: 'RB', count: 2 },
    { position: 'WR', count: 3 },
    { position: 'TE', count: 1 },
];

const buildDepthCharts = () => {
    const byTeam = {};
    Object.values(playerDatabase).forEach((player) => {
        if (!['QB', 'RB', 'WR', 'TE'].includes(player.position)) return;
        if (!byTeam[player.team]) byTeam[player.team] = [];
        byTeam[player.team].push(player);
    });

    const charts = {};
    Object.entries(byTeam).forEach(([team, players]) => {
        const sorted = [...players].sort((a, b) => (a.ecr ?? 999) - (b.ecr ?? 999));
        charts[team] = DEPTH_SLOTS.map(({ position, count }) => ({
            position,
            players: sorted.filter((p) => p.position === position).slice(0, count),
        }));
    });
    return charts;
};

const DEPTH_CHARTS = buildDepthCharts();

const MOVE_COUNT = Object.values(offseasonData).reduce(
    (sum, t) => sum + t.additions.length + t.departures.length,
    0,
);

const ChevronIcon = ({ open }) => (
    <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        aria-hidden="true"
    >
        <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
        />
    </svg>
);

const MoveList = ({ title, accent, moves, darkMode, emptyLabel }) => {
    const { colors: positionColors } = usePositionColors();
    return (
    <div className={`${ui.cardInset(darkMode)} p-4`}>
        <p className={`mb-3 text-[11px] font-bold uppercase tracking-[0.14em] ${accent}`}>
            {title}
        </p>
        {moves.length === 0 ? (
            <p className={`text-sm ${ui.muted(darkMode)}`}>{emptyLabel}</p>
        ) : (
            <ul className="space-y-2.5">
                {moves.map((move) => (
                    <li key={move.name} className="flex items-start gap-2.5">
                        <span {...getPositionTagProps(move.pos, { darkMode, colors: positionColors })}>{move.pos}</span>
                        <div className="min-w-0">
                            <p className={`text-sm font-semibold leading-snug ${ui.heading(darkMode)}`}>
                                {move.name}
                            </p>
                            <p className={`mt-0.5 text-xs leading-relaxed ${ui.muted(darkMode)}`}>
                                {move.detail}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </div>
    );
};

const DepthChartRow = ({ slot, darkMode }) => {
    const { colors: positionColors } = usePositionColors();
    return (
    <div className="flex items-start gap-3">
        <span {...getPositionTagProps(slot.position, { darkMode, colors: positionColors })}>{slot.position}</span>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
            {slot.players.length === 0 ? (
                <span className={`text-sm ${ui.muted(darkMode)}`}>—</span>
            ) : (
                slot.players.map((player, index) => (
                    <React.Fragment key={player.id}>
                        {index > 0 && (
                            <span className={`text-xs ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} aria-hidden="true">
                                ›
                            </span>
                        )}
                        <span className="relative inline-flex items-center gap-1">
                            <span
                                className={`text-sm ${index === 0
                                    ? `font-semibold ${ui.heading(darkMode)}`
                                    : `font-medium ${ui.muted(darkMode)}`}`}
                            >
                                {player.name}
                            </span>
                            <InjuryBadge injury={getInjury(player.id)} darkMode={darkMode} />
                        </span>
                    </React.Fragment>
                ))
            )}
        </div>
    </div>
    );
};

// Colour a 1–32 rank green (top third) / amber (middle) / rose (bottom third).
const rankTone = (rank, darkMode) => {
    if (rank == null) {
        return { text: ui.muted(darkMode), wrap: darkMode ? 'bg-slate-800/50 ring-white/5' : 'bg-slate-100 ring-slate-200' };
    }
    if (rank <= 10) {
        return { text: darkMode ? 'text-green-300' : 'text-green-700', wrap: darkMode ? 'bg-green-500/10 ring-green-500/20' : 'bg-green-50 ring-green-200' };
    }
    if (rank <= 22) {
        return { text: darkMode ? 'text-amber-300' : 'text-amber-700', wrap: darkMode ? 'bg-amber-500/10 ring-amber-500/20' : 'bg-amber-50 ring-amber-200' };
    }
    return { text: darkMode ? 'text-rose-300' : 'text-rose-700', wrap: darkMode ? 'bg-rose-500/10 ring-rose-500/20' : 'bg-rose-50 ring-rose-200' };
};

const RankStat = ({ label, rank, darkMode }) => {
    const tone = rankTone(rank, darkMode);
    return (
        <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ${tone.wrap}`}>
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${ui.muted(darkMode)}`}>{label}</span>
            <span className={`text-sm font-bold tabular-nums ${tone.text}`}>{rank != null ? `#${rank}` : '—'}</span>
            <span className={`text-[10px] ${ui.muted(darkMode)}`}>/ 32</span>
        </div>
    );
};

const formatNewsDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const NewsBlock = ({ liveNews, darkMode }) => {
    const { news, transactions } = liveNews;
    if (!news.length && !transactions.length) return null;

    return (
        <div className={`${ui.cardInset(darkMode)} mb-4 p-4`}>
            <p className={`mb-3 text-[11px] font-bold uppercase tracking-[0.14em] ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                Latest News
            </p>
            {news.length > 0 && (
                <ul className="space-y-3">
                    {news.map((item) => (
                        <li key={item.id || item.headline}>
                            {item.url ? (
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-sm font-semibold leading-snug underline decoration-emerald-500/40 underline-offset-2 transition hover:decoration-emerald-500 ${ui.heading(darkMode)}`}
                                >
                                    {item.headline}
                                </a>
                            ) : (
                                <p className={`text-sm font-semibold leading-snug ${ui.heading(darkMode)}`}>
                                    {item.headline}
                                </p>
                            )}
                            {item.summary && (
                                <p className={`mt-1 text-xs leading-relaxed ${ui.muted(darkMode)}`}>
                                    {item.summary}
                                </p>
                            )}
                            {item.date && (
                                <p className={`mt-1 text-[10px] ${ui.muted(darkMode)}`}>
                                    {formatNewsDate(item.date)}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {transactions.length > 0 && (
                <div className={news.length ? `mt-4 border-t pt-4 ${darkMode ? 'border-white/5' : 'border-slate-200'}` : ''}>
                    <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.12em] ${ui.muted(darkMode)}`}>
                        Recent Transactions
                    </p>
                    <ul className="space-y-1.5">
                        {transactions.map((txn) => (
                            <li key={`${txn.date}-${txn.description}`} className={`text-xs leading-relaxed ${ui.muted(darkMode)}`}>
                                {txn.date && (
                                    <span className={`mr-2 tabular-nums ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {formatNewsDate(txn.date)}
                                    </span>
                                )}
                                {txn.description}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const TeamCard = ({ abbr, team, info, liveNews, depthChart, darkMode, open, onToggle, cardRef }) => {
    const isNewHc = info.coaching.hc.status === 'new';

    return (
        <div ref={cardRef} className={`${ui.card(darkMode)} scroll-mt-24`}>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition sm:gap-4 sm:px-5 ${
                    darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/80'
                }`}
            >
                <img
                    src={team.logo}
                    alt=""
                    className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
                    loading="lazy"
                />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h3 className={`truncate text-base font-bold sm:text-lg ${ui.heading(darkMode)}`}>
                            {team.name}
                        </h3>
                        {isNewHc && (
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-950 shadow-glow">
                                New HC
                            </span>
                        )}
                    </div>
                    <p className={`mt-0.5 truncate text-xs sm:text-sm ${ui.muted(darkMode)}`}>
                        {team.conference} {team.division}
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        {isNewHc
                            ? `${info.coaching.hc.name} replaces ${info.coaching.hc.replaced}`
                            : `${info.coaching.hc.name} returns`}
                    </p>
                </div>
                <span className={ui.muted(darkMode)}>
                    <ChevronIcon open={open} />
                </span>
            </button>

            {open && (
                <div className={`border-t px-4 pb-5 pt-4 sm:px-5 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <MoveList
                            title="Key Additions"
                            accent="text-emerald-600 dark:text-emerald-400"
                            moves={info.additions}
                            darkMode={darkMode}
                            emptyLabel="No major additions"
                        />
                        <MoveList
                            title="Key Departures"
                            accent={darkMode ? 'text-rose-400' : 'text-rose-500'}
                            moves={info.departures}
                            darkMode={darkMode}
                            emptyLabel="No major departures"
                        />
                        <MoveList
                            title="Draft Class"
                            accent={darkMode ? 'text-sky-400' : 'text-sky-500'}
                            moves={info.rookies}
                            darkMode={darkMode}
                            emptyLabel="No fantasy-relevant rookies"
                        />
                    </div>

                    <div className={`${ui.cardInset(darkMode)} mb-4 p-4`}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                            <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${ui.muted(darkMode)}`}>
                                Projected Depth Chart
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <RankStat label="O-Line" rank={team.olineRank} darkMode={darkMode} />
                                <RankStat label="Proj. Defense" rank={team.defenseRank} darkMode={darkMode} />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            {(depthChart || []).map((slot) => (
                                <DepthChartRow key={slot.position} slot={slot} darkMode={darkMode} />
                            ))}
                        </div>
                    </div>

                    <NewsBlock liveNews={liveNews} darkMode={darkMode} />

                    <div
                        className={`rounded-xl border-l-4 border-emerald-500 p-4 ${
                            darkMode ? 'bg-emerald-500/[0.06]' : 'bg-emerald-50/70'
                        }`}
                    >
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                            2026 Key Points
                        </p>
                        <ul className="space-y-2">
                            {(info.keyPoints || []).map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                    <svg
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                                        aria-hidden="true"
                                    >
                                        <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className={`text-sm leading-snug ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {point}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

const OffseasonHub = ({ darkMode }) => {
    const [divisionFilter, setDivisionFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [openTeams, setOpenTeams] = useState(() => new Set());
    const teamCardRefs = useRef(new Map());

    const setTeamCardRef = useCallback((abbr, element) => {
        if (element) teamCardRefs.current.set(abbr, element);
        else teamCardRefs.current.delete(abbr);
    }, []);

    const scrollTeamUnderNav = useCallback((abbr) => {
        const card = teamCardRefs.current.get(abbr);
        if (!card) return;

        const nav = document.querySelector('nav');
        const navHeight = nav?.getBoundingClientRect().height ?? 72;
        const gap = 12;
        const targetTop = card.getBoundingClientRect().top + window.scrollY - navHeight - gap;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
    }, []);

    const teams = useMemo(() => {
        const query = search.trim().toLowerCase();
        return Object.keys(offseasonData)
            .filter((abbr) => teamData[abbr])
            .map((abbr) => ({ abbr, team: teamData[abbr], info: offseasonData[abbr] }))
            .filter(({ abbr, team }) => {
                if (divisionFilter !== 'All' && `${team.conference} ${team.division}` !== divisionFilter) {
                    return false;
                }
                if (query && !team.name.toLowerCase().includes(query) && !abbr.toLowerCase().includes(query)) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => a.team.name.localeCompare(b.team.name));
    }, [divisionFilter, search]);

    const toggleTeam = (abbr) => {
        const isOpening = !openTeams.has(abbr);
        setOpenTeams((prev) => {
            const next = new Set(prev);
            if (next.has(abbr)) {
                next.delete(abbr);
            } else {
                next.add(abbr);
            }
            return next;
        });
        if (isOpening) {
            // Wait for the expanded panel to paint before scrolling.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => scrollTeamUnderNav(abbr));
            });
        }
    };

    const allVisibleOpen = teams.length > 0 && teams.every(({ abbr }) => openTeams.has(abbr));
    const toggleAll = () => {
        setOpenTeams((prev) => {
            if (allVisibleOpen) return new Set();
            const next = new Set(prev);
            teams.forEach(({ abbr }) => next.add(abbr));
            return next;
        });
    };

    return (
        <div className="container mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-8">
            <div className="mb-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                    2026 Season
                </p>
                <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${ui.heading(darkMode)}`}>
                    <span className="text-gradient-brand">Offseason HQ</span>
                </h1>
                <p className={`mt-2 max-w-2xl text-sm sm:text-base ${ui.muted(darkMode)}`}>
                    Coaching changes, key moves, projected depth charts, and the key points for
                    every team heading into the 2026 season.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className={ui.statPill(darkMode, 'default')}>32 teams</span>
                    <span className={ui.statPill(darkMode, 'success')}>{NEW_HC_TEAMS.length} new head coaches</span>
                    <span className={ui.statPill(darkMode, 'muted')}>{MOVE_COUNT} tracked moves</span>
                    {OFFSEASON_NEWS_UPDATED_AT && (
                        <span className={ui.statPill(darkMode, 'muted')}>
                            News updated {formatNewsDate(OFFSEASON_NEWS_UPDATED_AT)}
                        </span>
                    )}
                </div>
            </div>

            <div className={`${ui.toolbar(darkMode)} mb-5 flex flex-col gap-3`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${ui.muted(darkMode)}`}
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search teams…"
                            aria-label="Search teams"
                            className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                                darkMode
                                    ? 'border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500'
                                    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                            }`}
                        />
                    </div>
                    <button type="button" onClick={toggleAll} className={ui.btn(darkMode)}>
                        {allVisibleOpen ? 'Collapse all' : 'Expand all'}
                    </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {['All', ...DIVISIONS].map((division) => {
                        const active = divisionFilter === division;
                        return (
                            <button
                                key={division}
                                type="button"
                                onClick={() => setDivisionFilter(division)}
                                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                                    active
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-glow'
                                        : darkMode
                                            ? 'bg-slate-800/70 text-slate-300 ring-1 ring-white/5 hover:bg-slate-700/70'
                                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {division}
                            </button>
                        );
                    })}
                </div>
            </div>

            {teams.length === 0 ? (
                <div className={`${ui.card(darkMode)} p-10 text-center`}>
                    <p className={`text-sm ${ui.muted(darkMode)}`}>
                        No teams match your search.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {teams.map(({ abbr, team, info }) => (
                        <TeamCard
                            key={abbr}
                            abbr={abbr}
                            team={team}
                            info={info}
                            liveNews={getOffseasonNews(abbr)}
                            depthChart={DEPTH_CHARTS[abbr]}
                            darkMode={darkMode}
                            open={openTeams.has(abbr)}
                            onToggle={() => toggleTeam(abbr)}
                            cardRef={(element) => setTeamCardRef(abbr, element)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OffseasonHub;
