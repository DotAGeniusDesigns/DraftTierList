import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Player from './Player';
import ColumnHeader, { BOARD_COLUMN_TOOLTIPS } from './ColumnHeader';
import { getTierDisplayName, TIER_NAMES_UPDATED_EVENT } from '../utils/tierNames';
import { TIER_HEX, ui } from '../utils/uiTheme';

const Tier = ({
    tierNumber,
    players,
    allTierPlayers,
    onToggleDraft,
    onToggleRisky,
    onToggleUpside,
    onToggleHandcuff,
    onRemoveTier,
    onRenameTier,
    onMovePlayer,
    startingRank,
    darkMode,
    tierNamesVersion = 0,
    focusPlayerId = null,
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [dropIndex, setDropIndex] = useState(null);
    const [isTouchDragging, setIsTouchDragging] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tierName, setTierName] = useState(() => getTierDisplayName(tierNumber));
    const tierRef = useRef(null);
    const dropIndexRef = useRef(null);
    const tierColor = TIER_HEX[tierNumber] || TIER_HEX[12];

    useEffect(() => {
        dropIndexRef.current = dropIndex;
    }, [dropIndex]);

    const rankByPlayerId = useMemo(() => {
        const map = new Map();
        allTierPlayers.forEach((player, index) => {
            map.set(player.id, startingRank + index);
        });
        return map;
    }, [allTierPlayers, startingRank]);

    const resolveDropIndex = useCallback((y, containerHeight) => {
        const headerHeight = 48;
        const padding = 12;
        const availableHeight = Math.max(containerHeight - headerHeight, 1);
        const rowCount = Math.max(players.length, 1);
        const dynamicDropZoneHeight = availableHeight / rowCount;
        const adjustedY = y - padding;
        const newIndex = Math.max(0, Math.floor(adjustedY / dynamicDropZoneHeight));
        return Math.min(newIndex, players.length);
    }, [players.length]);

    const finalizeDrop = useCallback((playerId, sourceTier, index) => {
        let finalDropIndex = index !== null ? index : 0;

        if (sourceTier === tierNumber) {
            const draggedPlayerIndex = players.findIndex(p => p.id === playerId);
            if (draggedPlayerIndex !== -1 && finalDropIndex > draggedPlayerIndex) {
                finalDropIndex -= 1;
            }
        }

        if (playerId) {
            onMovePlayer?.(playerId, tierNumber, finalDropIndex);
        }
    }, [players, tierNumber, onMovePlayer]);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        setDropIndex(resolveDropIndex(y, rect.height));
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        setDropIndex(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const dragData = e.dataTransfer.getData('text/plain');
        if (!dragData) return;

        try {
            const { playerId, sourceTier } = JSON.parse(dragData);
            finalizeDrop(playerId, sourceTier, dropIndex);
        } catch (error) {
            console.error('Error parsing drag data in tier:', error);
        }
        setDropIndex(null);
    };

    useEffect(() => {
        setTierName(getTierDisplayName(tierNumber));
    }, [tierNumber, tierNamesVersion]);

    useEffect(() => {
        const refreshName = () => setTierName(getTierDisplayName(tierNumber));
        window.addEventListener(TIER_NAMES_UPDATED_EVENT, refreshName);
        return () => window.removeEventListener(TIER_NAMES_UPDATED_EVENT, refreshName);
    }, [tierNumber]);

    const handleSaveName = () => {
        if (tierName.trim() && onRenameTier) {
            onRenameTier(tierNumber, tierName.trim());
        }
        setIsEditingName(false);
    };

    const handleCancelEdit = () => {
        setTierName(getTierDisplayName(tierNumber));
        setIsEditingName(false);
    };

    useEffect(() => {
        const handleTouchDragMove = (e) => {
            if (!isTouchDragging) return;

            const touch = e.detail;
            const rect = tierRef.current?.getBoundingClientRect();
            if (!rect) return;

            const y = touch.clientY - rect.top;
            setDropIndex(resolveDropIndex(y, rect.height));
            setIsDragOver(true);
        };

        const handleTouchDragStart = () => {
            setIsTouchDragging(true);
        };

        const handleTouchDragEnd = (e) => {
            if (!isTouchDragging) return;

            const touch = e.detail;
            const { playerId, sourceTier } = touch.dragData;
            finalizeDrop(playerId, sourceTier, dropIndexRef.current);

            setIsTouchDragging(false);
            setIsDragOver(false);
            setDropIndex(null);
        };

        document.addEventListener('playerDragStart', handleTouchDragStart);
        document.addEventListener('playerDragMove', handleTouchDragMove);
        document.addEventListener('playerDragEnd', handleTouchDragEnd);

        return () => {
            document.removeEventListener('playerDragStart', handleTouchDragStart);
            document.removeEventListener('playerDragMove', handleTouchDragMove);
            document.removeEventListener('playerDragEnd', handleTouchDragEnd);
        };
    }, [isTouchDragging, finalizeDrop, resolveDropIndex]);

    const headerClass = darkMode
        ? 'border-b border-white/5 bg-slate-900/80'
        : 'border-b border-slate-100 bg-slate-50/90';

    const bodyClass = darkMode
        ? `${isDragOver ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.06] bg-slate-950/30'}`
        : `${isDragOver ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200/80 bg-white'}`;

    return (
        <div className={`${ui.card(darkMode)} overflow-visible`}>
            <div
                className={`flex items-center justify-between px-4 py-3 sm:px-5 ${headerClass}`}
                style={{ boxShadow: `inset 4px 0 0 0 ${tierColor}` }}
            >
                <div className="flex items-center gap-3">
                    <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: tierColor }}
                    >
                        T{tierNumber}
                    </span>
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={tierName}
                                onChange={(e) => setTierName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName();
                                    if (e.key === 'Escape') handleCancelEdit();
                                }}
                                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${darkMode
                                    ? 'border-white/10 bg-slate-800 text-white'
                                    : 'border-slate-200 bg-white text-slate-900'
                                    }`}
                                autoFocus
                            />
                            <button onClick={handleSaveName} className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/10" title="Save name">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button onClick={handleCancelEdit} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10" title="Cancel edit">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h3 className={`text-base font-bold sm:text-lg ${ui.heading(darkMode)}`}>{tierName}</h3>
                            <button
                                onClick={() => setIsEditingName(true)}
                                className={`rounded-lg p-1.5 transition ${darkMode ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                title="Edit tier name"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium sm:text-sm ${ui.muted(darkMode)}`}>
                        {allTierPlayers.length} player{allTierPlayers.length !== 1 ? 's' : ''}
                        {players.length !== allTierPlayers.length && (
                            <span className="opacity-75"> · {players.length} shown</span>
                        )}
                    </span>
                    {allTierPlayers.length === 0 && (
                        <button
                            onClick={() => onRemoveTier(tierNumber)}
                            className={`rounded-lg p-1.5 transition ${darkMode ? 'text-slate-500 hover:bg-white/5 hover:text-rose-400' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                            title="Remove empty tier"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div
                ref={tierRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-t transition-all duration-200 ${bodyClass}`}
            >
                {players.length === 0 ? (
                    <div className={`tier-empty-state ${ui.muted(darkMode)}`}>
                        Drop players here
                    </div>
                ) : (
                    <div className="relative divide-y divide-slate-200/70 dark:divide-white/[0.04]">
                        <div className={`sticky top-0 z-10 hidden items-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider sm:flex sm:px-4 sm:text-[11px] ${darkMode
                            ? 'border-b border-white/5 bg-slate-900/95 text-slate-500 backdrop-blur-md'
                            : 'border-b border-slate-100 bg-white/95 text-slate-400 backdrop-blur-md'
                            }`}>
                            <div className="flex min-w-0 flex-[5] items-center">
                                <div className="w-14 shrink-0 text-center">Rank</div>
                                <div className="w-11 shrink-0 text-center">Photo</div>
                                <div className="min-w-0 flex-1 px-4">Player</div>
                            </div>
                            <div className="flex flex-[4] items-center justify-center gap-4">
                                <ColumnHeader label="Pos" tooltip={BOARD_COLUMN_TOOLTIPS.pos} className="w-16 shrink-0" darkMode={darkMode} />
                                <ColumnHeader label="Team" tooltip={BOARD_COLUMN_TOOLTIPS.team} className="w-12 shrink-0" darkMode={darkMode} />
                                <ColumnHeader label="OL" tooltip={BOARD_COLUMN_TOOLTIPS.ol} className="w-10 shrink-0" darkMode={darkMode} />
                                <ColumnHeader label="Bye" tooltip={BOARD_COLUMN_TOOLTIPS.bye} className="w-10 shrink-0" darkMode={darkMode} />
                            </div>
                            <div className="flex flex-[4] items-center justify-center gap-4">
                                <ColumnHeader label="ECR" tooltip={BOARD_COLUMN_TOOLTIPS.ecr} className="w-14 shrink-0" darkMode={darkMode} />
                                <ColumnHeader label="ADP" tooltip={BOARD_COLUMN_TOOLTIPS.adp} className="w-16 shrink-0" darkMode={darkMode} />
                                <ColumnHeader label="Flags" tooltip={BOARD_COLUMN_TOOLTIPS.flags} className="w-24 shrink-0" darkMode={darkMode} />
                            </div>
                        </div>

                        <div className={`flex items-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider sm:hidden ${darkMode
                            ? 'border-b border-white/5 bg-slate-900/95 text-slate-500'
                            : 'border-b border-slate-100 bg-slate-50 text-slate-400'
                            }`}>
                            <div className="w-8 text-center">#</div>
                            <div className="w-10" />
                            <div className="flex-1 px-2">Player</div>
                            <ColumnHeader label="Pos" tooltip={BOARD_COLUMN_TOOLTIPS.pos} className="w-10" darkMode={darkMode} />
                            <ColumnHeader label="Tm" tooltip={BOARD_COLUMN_TOOLTIPS.team} className="w-10" darkMode={darkMode} />
                            <ColumnHeader label="ADP" tooltip={BOARD_COLUMN_TOOLTIPS.adp} className="w-10" darkMode={darkMode} />
                        </div>

                        {players.map((player, index) => (
                            <div key={player.id} className="relative">
                                {isDragOver && dropIndex === index && (
                                    <div className="drop-indicator -top-px" />
                                )}
                                <Player
                                    player={player}
                                    index={rankByPlayerId.get(player.id) ?? startingRank + index}
                                    onToggleDraft={onToggleDraft}
                                    onToggleRisky={onToggleRisky}
                                    onToggleUpside={onToggleUpside}
                                    onToggleHandcuff={onToggleHandcuff}
                                    onMovePlayer={onMovePlayer}
                                    isFocused={focusPlayerId === player.id}
                                    darkMode={darkMode}
                                />
                            </div>
                        ))}
                        {isDragOver && dropIndex === players.length && (
                            <div className="drop-indicator" />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(Tier);
