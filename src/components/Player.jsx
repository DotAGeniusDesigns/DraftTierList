import React, { useState, useRef, useEffect, useMemo } from 'react';
import InjuryBadge from './InjuryBadge';
import { getOlineRank } from '../utils/teamData';
import { getPositionTagProps } from '../utils/playerStyles';
import { usePositionColors } from '../context/PositionColorsContext';
import { ui } from '../utils/uiTheme';

const flagBtn = (active, activeClass, darkMode, idleHover) =>
    `relative rounded-lg p-1.5 transition ${active
        ? activeClass
        : darkMode
            ? `text-slate-500 ${idleHover} hover:bg-white/5`
            : `text-slate-400 ${idleHover} hover:bg-slate-100`
    }`;

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
    const [showMobileFlags, setShowMobileFlags] = useState(false);
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

    const handleToggleUpside = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleUpside?.(player.id, !player.isUpside);
    };

    const handleToggleRisky = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleRisky?.(player.id, !player.isRisky);
    };

    const handleToggleHandcuff = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleHandcuff?.(player.id, !player.isHandcuff);
    };

    const handleToggleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite?.(player.id, !player.isFavorite);
    };

    const handleToggleDND = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleDND?.(player.id, !player.isDND);
    };

    const handleToggleMobileFlagsMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMobileFlags((open) => !open);
    };

    const closeMobileFlagsMenu = (e) => {
        e.stopPropagation();
        setShowMobileFlags(false);
    };

    const isUpside = player.isUpside || false;
    const isRisky = player.isRisky || false;
    const isHandcuff = player.isHandcuff || false;
    const isFavorite = player.isFavorite || false;
    const isDND = player.isDND || false;

    const rowClass = player.drafted
        ? darkMode
            ? 'bg-slate-900/40 opacity-70'
            : 'bg-slate-50/80 opacity-75'
        : '';

    // Favorite/DND are opposite calls on the same player, so only one border
    // ever applies. Interaction feedback (drag, long-press, jump-to-focus)
    // takes visual priority over it since those are transient states.
    const flagRingClass = isDND
        ? 'ring-2 ring-rose-500'
        : isFavorite
            ? 'ring-2 ring-amber-400'
            : '';

    // A faint background wash so the flag reads as "this whole card" rather
    // than just a thin outline. Skipped on a drafted row, which already has
    // its own dimmed background.
    const flagTintClass = isDND
        ? (darkMode ? 'bg-rose-500/10' : 'bg-rose-50')
        : isFavorite
            ? (darkMode ? 'bg-amber-400/10' : 'bg-amber-50')
            : '';

    const valueClass = darkMode ? 'text-slate-400' : 'text-slate-500';
    const valueBold = darkMode ? 'font-semibold text-slate-300' : 'font-semibold text-slate-700';

    const deltaClass = (isPositive) =>
        isPositive
            ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
            : darkMode ? 'text-rose-400' : 'text-rose-600';

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
                player-row-hover relative cursor-grab px-1 py-2.5 hover:z-30 focus-within:z-30 active:cursor-grabbing board:px-4 board:py-3
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

            <div className="flex items-center gap-0 board:gap-4">
                {/* Bucket 1 — identity: rank, photo, player */}
                <div className="contents board:flex board:min-w-[300px] board:flex-1 board:items-center">
                    <div className={`w-6 shrink-0 text-center text-xs font-bold tabular-nums board:w-14 board:text-sm ${valueBold}`}>
                        {index}
                    </div>

                    <div className="relative h-8 w-8 shrink-0 board:h-11 board:w-11">
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
                                className={`h-full w-full items-center justify-center text-[10px] font-bold board:text-xs ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'}`}
                                style={{ display: 'none' }}
                            >
                                {initials}
                            </div>
                        </div>
                        {/* Team badge rides on the avatar corner on mobile, where the
                            dedicated team column below is hidden to leave room for the name. */}
                        {player.teamLogo && (
                            <img
                                src={player.teamLogo}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-white object-contain ring-2 board:hidden ${darkMode ? 'ring-slate-950' : 'ring-white'} ${player.drafted ? 'grayscale' : ''}`}
                            />
                        )}
                    </div>

                    <div className="min-w-0 max-w-md flex-1 px-0.5 board:max-w-none board:px-4">
                        {/* Positioning context for the injury hover card: anchored
                            to the name rather than to the chip, which on a phone
                            sits far enough right to push the card off screen. */}
                        <div className="relative flex min-w-0 items-center gap-1.5">
                            <span className={`truncate text-sm font-semibold board:text-[15px] ${player.drafted ? 'line-through opacity-70' : ''} ${ui.heading(darkMode)}`}>
                                {player.name}
                            </span>
                            <InjuryBadge injury={player.injury} darkMode={darkMode} />
                        </div>
                    </div>
                </div>

                {/* Bucket 2 — team context: pos, team, OL, bye */}
                <div className="contents board:flex board:flex-initial board:items-center board:justify-center board:gap-1.5">
                    <div className="w-8 shrink-0 text-center board:w-16">
                        <span {...getPositionTagProps(player.position, { drafted: player.drafted, darkMode, colors: positionColors })}>
                            {player.position}
                        </span>
                    </div>

                    <div className="hidden w-8 shrink-0 justify-center board:flex board:w-12">
                        <div className="h-8 w-8 board:h-10 board:w-10">
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
                    </div>

                    <div className={`hidden shrink-0 text-center text-xs board:block board:w-5 ${valueClass}`}>
                        {player.olineRank || getOlineRank(player.team) || '—'}
                    </div>

                    <div className={`hidden shrink-0 text-center text-xs board:block board:w-5 ${valueClass}`}>
                        {player.byeWeek ?? '—'}
                    </div>
                </div>

                {/* Bucket 3 — draft value: ECR, ADP, flags */}
                <div className="contents board:flex board:flex-initial board:items-center board:justify-center board:gap-1.5">
                    <div className={`hidden shrink-0 text-center text-xs board:block board:w-14 ${valueClass}`}>
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

                    <div className={`w-8 shrink-0 text-center text-xs board:w-16 ${valueClass}`}>
                        {player.adp ? (
                            <>
                                <span className={valueBold}>{player.adp.toFixed(1)}</span>
                                {Math.abs(index - player.adp) > 0.1 && (
                                    <span className={`ml-0.5 hidden text-[10px] board:inline ${deltaClass(index < player.adp)}`}>
                                        ({index < player.adp ? '+' : ''}{Math.abs(index - player.adp).toFixed(1)})
                                    </span>
                                )}
                            </>
                        ) : '—'}
                    </div>

                    <div className="hidden shrink-0 items-center justify-center gap-0.5 lg:flex lg:w-40">
                        <button
                            onClick={handleToggleUpside}
                            className={flagBtn(isUpside, 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/25', darkMode, 'hover:text-emerald-500')}
                            title="Upside"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <button
                            onClick={handleToggleRisky}
                            className={flagBtn(isRisky, 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/25', darkMode, 'hover:text-amber-500')}
                            title="Risky"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979.446.743.736 1.79.736 3.021 0 1.23-.29 2.278-.736 3.021C10.792 13.807 10.304 14 10 14c-.304 0-.792-.193-1.264-.979C8.29 12.278 8 11.23 8 10c0-1.231.29-2.278.736-3.021zM10 16a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <button
                            onClick={handleToggleHandcuff}
                            className={flagBtn(isHandcuff, 'bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/25', darkMode, 'hover:text-sky-500')}
                            title="Handcuff"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <button
                            onClick={handleToggleFavorite}
                            className={flagBtn(isFavorite, 'bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/25', darkMode, 'hover:text-amber-400')}
                            title="Favorite"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <button
                            onClick={handleToggleDND}
                            className={flagBtn(isDND, 'bg-rose-500/15 text-rose-500 ring-1 ring-rose-500/25', darkMode, 'hover:text-rose-500')}
                            title="Do Not Draft"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div className="relative shrink-0 lg:hidden">
                        <button
                            onClick={handleToggleMobileFlagsMenu}
                            className={`relative -mr-1 flex h-5 w-5 items-center justify-center rounded-md transition ${
                                isUpside || isRisky || isHandcuff || isFavorite || isDND
                                    ? darkMode ? 'bg-white/10 text-slate-200' : 'bg-slate-200 text-slate-700'
                                    : darkMode ? 'text-slate-500 hover:bg-white/5' : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            title="Flags"
                            aria-label="Player flags"
                        >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a1 1 0 00-1 1v13a1 1 0 102 0v-4.586l1.293-1.293a1 1 0 011.414 0l.586.586a3 3 0 004.242 0l.828-.828a1 1 0 011.414 0l.223.223a1 1 0 001.414-1.414l-.223-.223a3 3 0 00-4.242 0l-.828.828a1 1 0 01-1.414 0l-.586-.586a3 3 0 00-4.242 0L5 10.586V4a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {(isUpside || isRisky || isHandcuff || isFavorite || isDND) && (
                                <span
                                    className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ${darkMode ? 'ring-slate-950' : 'ring-white'}`}
                                    style={{
                                        backgroundColor: isDND
                                            ? '#f43f5e'
                                            : isFavorite
                                                ? '#fbbf24'
                                                : isRisky
                                                    ? '#f59e0b'
                                                    : isHandcuff
                                                        ? '#0ea5e9'
                                                        : '#10b981',
                                    }}
                                />
                            )}
                        </button>

                        {showMobileFlags && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={closeMobileFlagsMenu} />
                                <div
                                    className={`absolute right-0 top-full z-50 mt-1 w-44 space-y-0.5 rounded-xl border p-1.5 shadow-lg ${darkMode ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-white'}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={handleToggleUpside}
                                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition ${
                                            isUpside
                                                ? 'bg-emerald-500/15 text-emerald-500'
                                                : darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
                                        </svg>
                                        Upside
                                    </button>
                                    <button
                                        onClick={handleToggleRisky}
                                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition ${
                                            isRisky
                                                ? 'bg-amber-500/15 text-amber-500'
                                                : darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979.446.743.736 1.79.736 3.021 0 1.23-.29 2.278-.736 3.021C10.792 13.807 10.304 14 10 14c-.304 0-.792-.193-1.264-.979C8.29 12.278 8 11.23 8 10c0-1.231.29-2.278.736-3.021zM10 16a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        Risky
                                    </button>
                                    <button
                                        onClick={handleToggleHandcuff}
                                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition ${
                                            isHandcuff
                                                ? 'bg-sky-500/15 text-sky-500'
                                                : darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        Handcuff
                                    </button>
                                    <button
                                        onClick={handleToggleFavorite}
                                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition ${
                                            isFavorite
                                                ? 'bg-amber-400/15 text-amber-400'
                                                : darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" clipRule="evenodd" />
                                        </svg>
                                        Favorite
                                    </button>
                                    <button
                                        onClick={handleToggleDND}
                                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition ${
                                            isDND
                                                ? 'bg-rose-500/15 text-rose-500'
                                                : darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                        </svg>
                                        Do Not Draft
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Player);
