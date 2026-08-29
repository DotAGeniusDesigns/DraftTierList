import React, { useState, useRef, useEffect, useMemo } from 'react';
import InjuryBadge from './InjuryBadge';
import { getOlineRank } from '../utils/teamData';
import { getPositionTagProps } from '../utils/playerStyles';
import { usePositionColors } from '../context/PositionColorsContext';
import { boardGridStyle } from '../utils/boardGrid';
import { ui } from '../utils/uiTheme';

const FLAG_DEFS = [
    {
        key: 'upside',
        label: 'Upside',
        menuActiveClass: 'bg-green-500/15 text-green-500',
        dot: '#16a34a',
        path: 'M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z',
    },
    {
        key: 'risky',
        label: 'Risky',
        menuActiveClass: 'bg-amber-500/15 text-amber-500',
        dot: '#f59e0b',
        path: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979.446.743.736 1.79.736 3.021 0 1.23-.29 2.278-.736 3.021C10.792 13.807 10.304 14 10 14c-.304 0-.792-.193-1.264-.979C8.29 12.278 8 11.23 8 10c0-1.231.29-2.278.736-3.021zM10 16a1 1 0 100-2 1 1 0 000 2z',
    },
    {
        key: 'handcuff',
        label: 'Handcuff',
        menuActiveClass: 'bg-sky-500/15 text-sky-500',
        dot: '#0ea5e9',
        path: 'M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z',
    },
    {
        key: 'favorite',
        label: 'Favorite',
        menuActiveClass: 'bg-amber-400/15 text-amber-400',
        dot: '#fbbf24',
        path: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    },
    {
        key: 'dnd',
        label: 'Do Not Draft',
        menuActiveClass: 'bg-rose-500/15 text-rose-500',
        dot: '#f43f5e',
        path: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z',
    },
];

// Single dropdown used for every flag at every screen size — a small "tag"
// trigger button that opens a checklist. Kept as one component (rather than
// mobile/desktop variants) since its own size never needs to change, only
// the row layout around it does.
const FlagsMenu = ({ flags, onToggle, darkMode }) => {
    const [open, setOpen] = useState(false);
    const anyActive = FLAG_DEFS.some((f) => flags[f.key]);
    const activeDot = FLAG_DEFS.find((f) => flags[f.key])?.dot;

    const handleTrigger = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen((o) => !o);
    };

    const handleItem = (key) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(key, !flags[key]);
    };

    return (
        <div className="relative flex shrink-0 items-center justify-center">
            <button
                onClick={handleTrigger}
                className={`relative flex h-5 w-5 items-center justify-center rounded-md transition ${
                    anyActive
                        ? darkMode ? 'bg-white/10 text-slate-200' : 'bg-slate-200 text-slate-700'
                        : darkMode ? 'text-slate-500 hover:bg-white/5' : 'text-slate-400 hover:bg-slate-100'
                }`}
                title="Flags"
                aria-label="Player flags"
            >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {anyActive && (
                    <span
                        className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ${darkMode ? 'ring-slate-950' : 'ring-white'}`}
                        style={{ backgroundColor: activeDot }}
                    />
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
                    <div
                        className={`absolute right-0 top-full z-50 mt-1 w-44 space-y-0.5 rounded-xl border p-1.5 shadow-lg ${darkMode ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-white'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {FLAG_DEFS.map((f) => (
                            <button
                                key={f.key}
                                onClick={handleItem(f.key)}
                                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition ${
                                    flags[f.key]
                                        ? f.menuActiveClass
                                        : darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d={f.path} clipRule="evenodd" />
                                </svg>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const Player = ({
    player,
    index,
    onToggleDraft,
    onMovePlayer,
    onToggleRisky,
    onToggleUpside,
    onToggleHandcuff,
    onToggleFavorite,
    onToggleDND,
    darkMode,
    isFocused = false,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const longPressTimerRef = useRef(null);
    const touchStartRef = useRef(null);
    const { colors: positionColors } = usePositionColors();

    useEffect(() => {
        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, []);

    const initials = useMemo(
        () => player.name.split(' ').map(n => n[0]).join('').slice(0, 3),
        [player.name]
    );

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleDraft(player.id);
    };

    const handleDragStart = (e) => {
        setIsDragging(true);
        e.dataTransfer.setData('text/plain', JSON.stringify({
            playerId: player.id,
            sourceIndex: index,
            sourceTier: player.tier,
        }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dragData = e.dataTransfer.getData('text/plain');
        if (!dragData) return;

        try {
            const { playerId } = JSON.parse(dragData);
            if (playerId !== player.id) {
                onMovePlayer?.(playerId, player.tier, index);
            }
        } catch (error) {
            console.error('Error parsing drag data:', error);
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e) => {
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };

        longPressTimerRef.current = setTimeout(() => {
            setIsLongPressing(true);
            setIsDragging(true);

            document.dispatchEvent(new CustomEvent('playerDragStart', {
                detail: {
                    playerId: player.id,
                    sourceIndex: index,
                    sourceTier: player.tier,
                },
                bubbles: true,
            }));
        }, 500);
    };

    const handleTouchMove = (e) => {
        if (!isDragging || !isLongPressing) {
            if (touchStartRef.current && longPressTimerRef.current) {
                const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
                const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
                if (dx > 10 || dy > 10) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                }
            }
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];
        document.dispatchEvent(new CustomEvent('playerDragMove', {
            detail: {
                clientX: touch.clientX,
                clientY: touch.clientY,
                dragData: {
                    playerId: player.id,
                    sourceIndex: index,
                    sourceTier: player.tier,
                },
            },
            bubbles: true,
        }));
    };

    const clearLongPress = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleTouchEnd = (e) => {
        clearLongPress();

        if (!isDragging || !isLongPressing) return;

        e.preventDefault();
        const touch = e.changedTouches[0];
        document.dispatchEvent(new CustomEvent('playerDragEnd', {
            detail: {
                clientX: touch.clientX,
                clientY: touch.clientY,
                dragData: {
                    playerId: player.id,
                    sourceIndex: index,
                    sourceTier: player.tier,
                },
            },
            bubbles: true,
        }));

        setIsDragging(false);
        setIsLongPressing(false);
    };

    const handleTouchCancel = () => {
        clearLongPress();
        setIsLongPressing(false);
        setIsDragging(false);
    };

    const flags = {
        upside: player.isUpside || false,
        risky: player.isRisky || false,
        handcuff: player.isHandcuff || false,
        favorite: player.isFavorite || false,
        dnd: player.isDND || false,
    };

    const handleFlagToggle = (key, next) => {
        if (key === 'upside') onToggleUpside?.(player.id, next);
        if (key === 'risky') onToggleRisky?.(player.id, next);
        if (key === 'handcuff') onToggleHandcuff?.(player.id, next);
        if (key === 'favorite') onToggleFavorite?.(player.id, next);
        if (key === 'dnd') onToggleDND?.(player.id, next);
    };

    const rowClass = player.drafted
        ? darkMode
            ? 'bg-slate-900/40 opacity-70'
            : 'bg-slate-50/80 opacity-75'
        : '';

    // Favorite/DND are opposite calls on the same player, so only one border
    // ever applies. Interaction feedback (drag, long-press, jump-to-focus)
    // takes visual priority over it since those are transient states.
    const flagRingClass = flags.dnd
        ? 'ring-2 ring-rose-500'
        : flags.favorite
            ? 'ring-2 ring-amber-400'
            : '';

    // A faint background wash so the flag reads as "this whole card" rather
    // than just a thin outline. Skipped on a drafted row, which already has
    // its own dimmed background.
    const flagTintClass = flags.dnd
        ? (darkMode ? 'bg-rose-500/10' : 'bg-rose-50')
        : flags.favorite
            ? (darkMode ? 'bg-amber-400/10' : 'bg-amber-50')
            : '';

    const valueClass = darkMode ? 'text-slate-400' : 'text-slate-500';
    const valueBold = darkMode ? 'font-semibold text-slate-300' : 'font-semibold text-slate-700';

    const deltaClass = (isPositive) =>
        isPositive
            ? darkMode ? 'text-green-400' : 'text-green-600'
            : darkMode ? 'text-rose-400' : 'text-rose-600';

    const Avatar = ({ sizeClass, cornerBadge }) => (
        <div className={`relative ${sizeClass} shrink-0`}>
            <div className="h-full w-full overflow-hidden rounded-full bg-slate-200 avatar-ring dark:bg-slate-800">
                <img
                    src={player.photo}
                    alt={player.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
                <div
                    className={`h-full w-full items-center justify-center text-[10px] font-bold ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'}`}
                    style={{ display: 'none' }}
                >
                    {initials}
                </div>
            </div>
            {cornerBadge && player.teamLogo && (
                <img
                    src={player.teamLogo}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-white object-contain ring-2 ${darkMode ? 'ring-slate-950' : 'ring-white'} ${player.drafted ? 'grayscale' : ''}`}
                />
            )}
        </div>
    );

    const TeamLogo = ({ sizeClass }) => (
        <div className={sizeClass}>
            {player.teamLogo ? (
                <img
                    src={player.teamLogo}
                    alt={player.team}
                    loading="lazy"
                    decoding="async"
                    className={`h-full w-full object-contain ${player.drafted ? 'grayscale' : ''}`}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}
            <div
                className={`h-full w-full items-center justify-center rounded-lg text-[10px] font-bold ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-600'}`}
                style={{ display: player.teamLogo ? 'none' : 'flex' }}
            >
                {player.team}
            </div>
        </div>
    );

    return (
        <div
            draggable="true"
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className={`
                player-row-hover relative cursor-grab px-0.5 py-2.5 hover:z-30 focus-within:z-30 active:cursor-grabbing board:px-4 board:py-3
                ${isDragging ? 'z-50 scale-[1.01] opacity-60' : ''}
                ${isLongPressing ? 'ring-2 ring-emerald-400/40 ring-offset-0' : ''}
                ${isFocused ? 'ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-transparent bg-emerald-500/10' : ''}
                ${!isFocused && !isLongPressing ? flagRingClass : ''}
                ${!player.drafted ? flagTintClass : ''}
                ${rowClass}
            `}
            onClick={handleClick}
            style={{ userSelect: 'none', touchAction: isLongPressing ? 'none' : 'pan-y' }}
            data-player-id={player.id}
        >
            {player.drafted && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-gradient-to-b from-slate-400 to-slate-500" />
            )}

            {/* Mobile / narrow layout: one compact row, name truncates with an ellipsis. */}
            <div className="flex items-center gap-0 board:hidden">
                <div className={`w-6 shrink-0 text-center text-xs font-bold tabular-nums ${valueBold}`}>
                    {index}
                </div>

                <Avatar sizeClass="h-7 w-7" cornerBadge />

                <div className="relative flex min-w-0 flex-1 items-center gap-1.5 px-0.5">
                    <span className={`truncate text-sm font-semibold ${player.drafted ? 'line-through opacity-70' : ''} ${ui.heading(darkMode)}`}>
                        {player.name}
                    </span>
                    <InjuryBadge injury={player.injury} darkMode={darkMode} />
                </div>

                <div className="w-8 shrink-0 text-center">
                    <span {...getPositionTagProps(player.position, { drafted: player.drafted, darkMode, colors: positionColors })}>
                        {player.position}
                    </span>
                </div>

                <div className={`w-8 shrink-0 text-center text-xs ${valueClass}`}>
                    {player.adp ? <span className={valueBold}>{player.adp.toFixed(1)}</span> : '—'}
                </div>

                <FlagsMenu flags={flags} onToggle={handleFlagToggle} darkMode={darkMode} />
            </div>

            {/* Desktop layout: fixed-width CSS grid, identical column widths to the
                header in Tier.jsx so the two can never fall out of alignment. */}
            <div className="hidden board:grid board:items-center" style={boardGridStyle}>
                <div className={`text-center text-sm font-bold tabular-nums ${valueBold}`}>
                    {index}
                </div>

                <Avatar sizeClass="h-11 w-11" />

                <div className="relative flex min-w-0 items-start gap-1.5 pr-1">
                    <span className={`text-[15px] font-semibold leading-snug ${player.drafted ? 'line-through opacity-70' : ''} ${ui.heading(darkMode)}`}>
                        {player.name}
                    </span>
                    <InjuryBadge injury={player.injury} darkMode={darkMode} />
                </div>

                <div className="flex justify-center">
                    <span {...getPositionTagProps(player.position, { drafted: player.drafted, darkMode, colors: positionColors })}>
                        {player.position}
                    </span>
                </div>

                <div className="flex justify-center">
                    <TeamLogo sizeClass="h-9 w-9" />
                </div>

                <div className={`text-center text-xs ${valueClass}`}>
                    {player.olineRank || getOlineRank(player.team) || '—'}
                </div>

                <div className={`text-center text-xs ${valueClass}`}>
                    {player.byeWeek ?? '—'}
                </div>

                <div className={`text-center text-xs ${valueClass}`}>
                    {player.ecr ? (
                        <>
                            <span className={valueBold}>{player.ecr}</span>
                            {index !== player.ecr && (
                                <span className={`ml-0.5 text-[10px] ${deltaClass(index < player.ecr)}`}>
                                    ({index < player.ecr ? '+' : '-'}{Math.abs(index - player.ecr)})
                                </span>
                            )}
                        </>
                    ) : '—'}
                </div>

                <div className={`text-center text-xs ${valueClass}`}>
                    {player.adp ? (
                        <>
                            <span className={valueBold}>{player.adp.toFixed(1)}</span>
                            {Math.abs(index - player.adp) > 0.1 && (
                                <span className={`ml-0.5 text-[10px] ${deltaClass(index < player.adp)}`}>
                                    ({index < player.adp ? '+' : ''}{Math.abs(index - player.adp).toFixed(1)})
                                </span>
                            )}
                        </>
                    ) : '—'}
                </div>

                <FlagsMenu flags={flags} onToggle={handleFlagToggle} darkMode={darkMode} />
            </div>
        </div>
    );
};

export default React.memo(Player);
