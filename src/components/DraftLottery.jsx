import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ui } from '../utils/uiTheme';
import { createMarbleRace, makeDefaultTeams } from '../utils/marbleRace';

const MIN_TEAMS = 2;
const MAX_TEAMS = 20;
const STORAGE_KEY = 'draft-lottery-order';
const MAX_PLAYS = 5;

const PLAY_TONE = {
    score: 'text-emerald-300',
    hot: 'text-rose-300',
    good: 'text-sky-300',
    hit: 'text-amber-300',
    neutral: 'text-slate-400',
};

const shade = (c, amount) => {
    const n = parseInt(c.slice(1), 16);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    return '#' + [clamp((n >> 16) + amount), clamp(((n >> 8) & 0xff) + amount), clamp((n & 0xff) + amount)]
        .map(v => v.toString(16).padStart(2, '0')).join('');
};

// Matches the ball drawn on the field, so the setup row and the race agree.
const FootballGlyph = ({ color }) => (
    <svg viewBox="0 0 44 28" className="h-full w-full" aria-hidden="true">
        <path
            d="M2 14 Q22 0 42 14 Q22 28 2 14 Z"
            fill={color}
            stroke={shade(color, -70)}
            strokeWidth="1.5"
        />
        <g stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round">
            <line x1="14" y1="14" x2="30" y2="14" />
            {[18, 22, 26].map((x) => <line key={x} x1={x} y1="10.5" x2={x} y2="17.5" />)}
        </g>
    </svg>
);

const formatStarted = (d) => {
    if (!d) return '';
    try {
        return d.toLocaleString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
        });
    } catch (e) {
        return String(d);
    }
};

const drawRoundRect = (ctx, x, y, w, h, r) => {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

// Renders a shareable branded results card (start date/time + final draft order)
// to an offscreen canvas and returns it.
async function buildResultsImage({ startedAt, order }) {
    if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (e) { /* ignore */ }
    }
    const scale = 2;
    const W = 720;
    const padX = 44;
    const headerH = 158;
    const rowH = 44;
    const footerH = 58;
    const H = headerH + order.length * rowH + footerH;

    const cv = document.createElement('canvas');
    cv.width = W * scale;
    cv.height = H * scale;
    const ctx = cv.getContext('2d');
    ctx.scale(scale, scale);

    // Background + soft brand glow
    ctx.fillStyle = '#0b0e13';
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, -60, 0, W / 2, -60, 460);
    glow.addColorStop(0, 'rgba(16,185,129,0.20)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 300);

    // Header
    ctx.textAlign = 'left';
    ctx.save();
    if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
    ctx.fillStyle = '#34d399';
    ctx.font = '700 12px "DM Sans", system-ui, sans-serif';
    ctx.fillText('FANTASY TOOLKIT', padX, 50);
    ctx.restore();

    ctx.fillStyle = '#f4f4f5';
    ctx.font = '800 34px "Bricolage Grotesque", "DM Sans", system-ui, sans-serif';
    ctx.fillText('Draft Order', padX, 92);

    ctx.fillStyle = '#8b95a7';
    ctx.font = '500 14px "DM Sans", system-ui, sans-serif';
    ctx.fillText(`Race started ${formatStarted(startedAt)}`, padX, 120);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, headerH - 18);
    ctx.lineTo(W - padX, headerH - 18);
    ctx.stroke();

    // Rows
    order.forEach((t, i) => {
        const top = headerH + i * rowH;
        const mid = top + rowH / 2;
        if (i === 0) {
            ctx.fillStyle = 'rgba(16,185,129,0.10)';
            drawRoundRect(ctx, padX - 14, top + 2, W - 2 * (padX - 14), rowH - 6, 10);
            ctx.fill();
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = i === 0 ? '#34d399' : '#6f7787';
        ctx.font = '700 15px "DM Sans", system-ui, sans-serif';
        ctx.fillText(String(i + 1), padX, mid + 5);

        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(padX + 42, mid, 6.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f4f4f5';
        ctx.font = '600 16px "DM Sans", system-ui, sans-serif';
        ctx.fillText(t.name, padX + 62, mid + 5);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#8b95a7';
        ctx.font = '500 13px "DM Sans", system-ui, sans-serif';
        ctx.fillText(t.finished ? `${(t.finishTime / 1000).toFixed(2)}s` : 'DNF', W - padX, mid + 5);
    });

    // Footer
    ctx.textAlign = 'left';
    ctx.fillStyle = '#5b6472';
    ctx.font = '500 12px "DM Sans", system-ui, sans-serif';
    ctx.fillText('Draft Lottery · first to the end zone picks first', padX, H - 24);
    const winner = order[0];
    if (winner) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#34d399';
        ctx.font = '700 12px "DM Sans", system-ui, sans-serif';
        ctx.fillText(`1.01  ${winner.name}`, W - padX, H - 24);
    }

    return cv;
}

const TeamSwatch = ({ index, team, darkMode, onChange }) => {
    const colorRef = useRef(null);
    return (
        <div className="flex flex-col items-center gap-2">
            <button
                type="button"
                onClick={() => colorRef.current?.click()}
                aria-label={`Recolor ${team.name || `team ${index + 1}`}`}
                className="h-7 w-11 cursor-pointer rounded transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
                <FootballGlyph color={team.color} />
            </button>
            <input
                ref={colorRef}
                type="color"
                value={team.color}
                onChange={(e) => onChange(index, { color: e.target.value })}
                className="pointer-events-none absolute h-0 w-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
            />
            <input
                type="text"
                maxLength={14}
                value={team.name}
                onChange={(e) => onChange(index, { name: e.target.value })}
                placeholder={`Team ${index + 1}`}
                aria-label={`Name for team ${index + 1}`}
                className={`w-20 border-0 border-b bg-transparent px-1 py-1 text-center text-xs font-semibold outline-none ${darkMode ? 'placeholder:text-slate-600' : 'placeholder:text-slate-400'}`}
                style={{ color: team.color, borderBottomColor: team.color + '66' }}
            />
        </div>
    );
};

const DraftLottery = ({ darkMode }) => {
    const canvasRef = useRef(null);
    const controllerRef = useRef(null);

    const [count, setCount] = useState(8);
    const [teams, setTeams] = useState(() => makeDefaultTeams(8));
    const [shuffle, setShuffle] = useState(false);
    const [phase, setPhase] = useState('setup'); // 'setup' | 'racing' | 'done'
    const [timer, setTimer] = useState('00:00.0');
    const [order, setOrder] = useState(null);
    const [copied, setCopied] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [raceStartedAt, setRaceStartedAt] = useState(null);
    const [plays, setPlays] = useState([]);

    // Boot the engine once; tear it down on unmount.
    useEffect(() => {
        const controller = createMarbleRace(canvasRef.current, {
            onTimer: setTimer,
            // Every reset path funnels through onPhase('setup'), so clearing the
            // feed here covers Reset, New board and team-count changes at once.
            onPhase: (next) => {
                setPhase(next);
                if (next === 'setup') setPlays([]);
            },
            onPlay: (play) => setPlays((prev) => [play, ...prev].slice(0, MAX_PLAYS)),
            onFinish: (result) => {
                setOrder(result);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), order: result }));
                } catch (e) { /* ignore storage errors */ }
            },
        });
        controllerRef.current = controller;
        controller.setCount(8, teams.map(t => t.name), teams.map(t => t.color));
        return () => controller.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCountChange = useCallback((next) => {
        setTeams((prev) => {
            const defaults = makeDefaultTeams(next);
            const merged = defaults.map((d, i) => prev[i] || d);
            controllerRef.current?.setCount(next, merged.map(t => t.name), merged.map(t => t.color));
            return merged;
        });
        setCount(next);
        setOrder(null);
    }, []);

    const handleTeamChange = useCallback((index, patch) => {
        setTeams((prev) => {
            const next = prev.map((t, i) => (i === index ? { ...t, ...patch } : t));
            return next;
        });
        controllerRef.current?.updateTeam(index, patch);
    }, []);

    const handleShuffle = useCallback((value) => {
        setShuffle(value);
        controllerRef.current?.setShuffle(value);
    }, []);

    const handleStart = useCallback(() => {
        setOrder(null);
        setPlays([]);
        setRaceStartedAt(new Date());
        controllerRef.current?.start();
    }, []);

    const handleReset = useCallback(() => {
        setOrder(null);
        controllerRef.current?.reset();
    }, []);

    const handleNewCourse = useCallback(() => {
        controllerRef.current?.newCourse();
    }, []);

    const handleCopy = useCallback(() => {
        if (!order) return;
        const text = order
            .map((t, i) => `${i + 1}. ${t.name}${t.finished ? '' : ' (DNF)'}`)
            .join('\n');
        navigator.clipboard?.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        }).catch(() => { /* clipboard unavailable */ });
    }, [order]);

    const handleShare = useCallback(async () => {
        if (!order) return;
        setSharing(true);
        try {
            const canvas = await buildResultsImage({ startedAt: raceStartedAt || new Date(), order });
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) return;
            const file = new File([blob], 'draft-order.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: 'Draft Order', text: '2026 draft order' });
                    return;
                } catch (e) {
                    if (e && e.name === 'AbortError') return; // user dismissed the share sheet
                    // otherwise fall through to download
                }
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'draft-order.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } finally {
            setSharing(false);
        }
    }, [order, raceStartedAt]);

    const isRacing = phase === 'racing';

    return (
        <div className="container mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
            <div className="mb-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">
                    Draft Tool
                </p>
                <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${ui.heading(darkMode)}`}>
                    <span className="text-gradient-brand">Draft Lottery</span>
                </h1>
                <p className={`mt-2 max-w-2xl text-sm sm:text-base ${ui.muted(darkMode)}`}>
                    Every team runs a football 100 yards down a randomized field — the order they
                    reach the end zone sets your draft order. First one in takes the 1.01.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className={ui.statPill(darkMode, 'default')}>{count} teams</span>
                    <span className={ui.statPill(darkMode, 'success')}>Finish order = draft order</span>
                </div>
            </div>

            {/* Setup controls — above the race window */}
            {!isRacing && (
                <div className={`${ui.toolbar(darkMode)} mb-5 flex flex-col gap-4`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2.5">
                                <span className={`text-sm font-medium ${ui.muted(darkMode)}`}>Teams</span>
                                <select
                                    value={count}
                                    onChange={(e) => handleCountChange(parseInt(e.target.value, 10))}
                                    aria-label="Number of teams"
                                    className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${darkMode ? 'border-white/10 bg-slate-950/40 text-slate-100' : 'border-slate-200 bg-white text-slate-900 shadow-sm'}`}
                                >
                                    {Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => MIN_TEAMS + i).map(n => (
                                        <option key={n} value={n}>{n} teams</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex cursor-pointer select-none items-center gap-2.5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={shuffle}
                                    onClick={() => handleShuffle(!shuffle)}
                                    className={ui.toggle(darkMode, shuffle)}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${shuffle ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className={`text-sm font-medium ${ui.muted(darkMode)}`}>Shuffle start</span>
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleNewCourse} className={ui.btn(darkMode)}>New field</button>
                            <button onClick={handleReset} className={ui.btn(darkMode)}>Reset</button>
                            <button onClick={handleStart} className={ui.btnPrimary()} style={{ minWidth: 120 }}>
                                Kick off
                            </button>
                        </div>
                    </div>

                    <div className={`h-px w-full ${darkMode ? 'bg-white/5' : 'bg-slate-200/70'}`} />

                    <div className="flex flex-col gap-3">
                        <span className={`text-[11px] font-bold uppercase tracking-[0.14em] ${ui.muted(darkMode)}`}>
                            Teams — click a swatch to recolor, type to rename
                        </span>
                        <div className="flex flex-wrap gap-x-4 gap-y-3">
                            {teams.map((team, i) => (
                                <TeamSwatch
                                    key={i}
                                    index={i}
                                    team={team}
                                    darkMode={darkMode}
                                    onChange={handleTeamChange}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stage — the race window */}
            <div className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10] shadow-card-dark">
                <div className="flex items-center justify-between px-4 pt-3.5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Game clock
                        </span>
                        <span className="font-mono text-3xl font-bold tabular-nums tracking-tight text-slate-100 sm:text-4xl">
                            {timer}
                        </span>
                    </div>
                    {isRacing && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/25">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            Live
                        </span>
                    )}
                </div>
                <div className="p-3 sm:p-4">
                    <canvas
                        ref={canvasRef}
                        className="block w-full rounded-xl border border-white/5"
                        style={{ height: 'auto', aspectRatio: '700 / 560' }}
                    />
                </div>

                {plays.length > 0 && (
                    <div className="border-t border-white/5 px-4 py-3">
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Play by play
                        </p>
                        <ul className="space-y-0.5" aria-live="polite">
                            {plays.map((play, i) => (
                                <li
                                    key={play.id}
                                    className={`truncate text-xs font-medium ${PLAY_TONE[play.tone] || PLAY_TONE.neutral}`}
                                    style={{ opacity: 1 - i * 0.17 }}
                                >
                                    {play.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Results */}
            {order && (
                <div className={`${ui.card(darkMode)} overflow-hidden`}>
                    <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-500">
                                Draft order set
                            </p>
                            <h2 className={`mt-0.5 text-lg font-bold ${ui.heading(darkMode)}`}>
                                {order[0]?.name} lands the 1.01
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={handleShare} disabled={sharing} className={ui.btn(darkMode)}>
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                                    <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.605a2.5 2.5 0 010 .79l6.732 3.368a2.5 2.5 0 11-.671 1.341l-6.732-3.367a2.5 2.5 0 110-3.475l6.732-3.367A2.5 2.5 0 0113 4.5z" />
                                </svg>
                                {sharing ? 'Preparing…' : 'Share image'}
                            </button>
                            <button onClick={handleCopy} className={ui.btn(darkMode)}>
                                {copied ? 'Copied!' : 'Copy order'}
                            </button>
                            <button onClick={handleReset} className={ui.btnPrimary()}>Run it back</button>
                        </div>
                    </div>
                    <ol className="divide-y divide-slate-200/60 dark:divide-white/[0.05]">
                        {order.map((team, i) => (
                            <li key={i} className="flex items-center gap-3 px-5 py-2.5">
                                <span className={`w-8 shrink-0 text-center font-mono text-sm font-bold tabular-nums ${i === 0 ? 'text-emerald-500' : ui.muted(darkMode)}`}>
                                    {i + 1}
                                </span>
                                <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/20" style={{ background: team.color }} />
                                <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${ui.heading(darkMode)}`}>
                                    {team.name}
                                </span>
                                <span className={`shrink-0 font-mono text-xs tabular-nums ${ui.muted(darkMode)}`}>
                                    {team.finished ? `${(team.finishTime / 1000).toFixed(2)}s` : 'DNF'}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {!order && (
                <p className={`text-center text-xs ${ui.muted(darkMode)}`}>
                    Set your teams, hit Kick off, and let the field decide. New field generates a fresh layout.
                </p>
            )}
        </div>
    );
};

export default DraftLottery;
