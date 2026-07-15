import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getOlineRank } from '../utils/teamData';
import { getPositionTagClass } from '../utils/playerStyles';

const Player = ({
    player,
    index,
    onToggleDraft,
    onMovePlayer,
    onToggleRisky,
    onToggleInjured,
    onToggleHandcuff,
    darkMode,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const longPressTimerRef = useRef(null);
    const touchStartRef = useRef(null);

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
            sourceTier: player.tier
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
                    sourceTier: player.tier
                },
                bubbles: true
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
                    sourceTier: player.tier
                }
            },
            bubbles: true
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
                    sourceTier: player.tier
                }
            },
            bubbles: true
        }));

        setIsDragging(false);
        setIsLongPressing(false);
    };

    const handleTouchCancel = () => {
        clearLongPress();
        setIsLongPressing(false);
        setIsDragging(false);
    };

    const handleToggleInjured = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleInjured?.(player.id, !player.isInjured);
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

    const isInjured = player.isInjured || false;
    const isRisky = player.isRisky || false;
    const isHandcuff = player.isHandcuff || false;

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
                relative p-3 sm:p-3 border-b cursor-grab active:cursor-grabbing transition-all duration-200
                ${isDragging ? 'opacity-50 scale-105 z-50' : ''}
                ${isLongPressing ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                ${darkMode
                    ? `border-gray-700 ${player.drafted ? 'bg-gray-800 opacity-60' : 'bg-gray-900 hover:bg-gray-800'}`
                    : `border-gray-200 ${player.drafted ? 'bg-gray-100 opacity-60' : 'bg-white hover:bg-gray-50'}`
                }
            `}
            onClick={handleClick}
            style={{ userSelect: 'none', touchAction: isLongPressing ? 'none' : 'pan-y' }}
            data-player-id={player.id}
        >
            {player.drafted && (
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
            )}

            <div className="flex items-center gap-1 sm:gap-0">
                <div className={`w-8 sm:w-16 text-center font-bold text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {index}
                </div>

                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                        src={player.photo}
                        alt={player.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div
                        className={`w-full h-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'}`}
                        style={{ display: 'none' }}
                    >
                        {initials}
                    </div>
                </div>

                <div className="flex-1 min-w-0 px-1 sm:px-4">
                    <div className={`font-semibold text-sm truncate ${player.drafted ? 'line-through' : ''} ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {player.name}
                    </div>
                </div>

                <div className="w-10 sm:w-20 text-center mx-1 sm:mx-2">
                    <span className={getPositionTagClass(player.position, { drafted: player.drafted, darkMode })}>
                        {player.position}
                    </span>
                </div>

                <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    {player.teamLogo ? (
                        <img
                            src={player.teamLogo}
                            alt={player.team}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div
                        className={`w-full h-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}
                        style={{ display: player.teamLogo ? 'none' : 'flex' }}
                    >
                        {player.team}
                    </div>
                </div>

                <div className="hidden sm:block w-12 sm:w-16 text-center">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {player.olineRank || getOlineRank(player.team) || '--'}
                    </span>
                </div>

                <div className="hidden sm:block w-12 sm:w-16 text-center">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {player.byeWeek ?? '--'}
                    </span>
                </div>

                <div className="hidden sm:block w-12 sm:w-16 text-center">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {player.ecr ? (
                            <>
                                {player.ecr}
                                {index !== player.ecr && (
                                    <span className={`ml-1 ${index < player.ecr
                                        ? (darkMode ? 'text-red-400' : 'text-red-600')
                                        : (darkMode ? 'text-green-400' : 'text-green-600')
                                        }`}>
                                        ({index < player.ecr ? '+' : '-'}{Math.abs(index - player.ecr).toFixed(0)})
                                    </span>
                                )}
                            </>
                        ) : '--'}
                    </span>
                </div>

                <div className="w-8 sm:w-16 text-center">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {player.adp ? (
                            <>
                                {player.adp.toFixed(1)}
                                {Math.abs(index - player.adp) > 0.1 && (
                                    <span className={`ml-1 ${index < player.adp
                                        ? (darkMode ? 'text-red-400' : 'text-red-600')
                                        : (darkMode ? 'text-green-400' : 'text-green-600')
                                        }`}>
                                        ({index < player.adp ? '+' : ''}{Math.abs(index - player.adp).toFixed(1)})
                                    </span>
                                )}
                            </>
                        ) : '--'}
                    </span>
                </div>

                <div className="hidden sm:flex items-center gap-1 sm:gap-2 mx-1 sm:mx-2">
                    <button
                        onClick={handleToggleInjured}
                        className={`relative p-1 rounded transition-colors group ${isInjured
                            ? 'text-red-500 bg-red-100'
                            : darkMode
                                ? 'text-gray-400 hover:text-red-400'
                                : 'text-gray-500 hover:text-red-500'
                            }`}
                        title="Injured"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-52 text-center leading-relaxed z-50">
                            {player.injuryNote ? `Injured: ${player.injuryNote}` : 'Injured'}
                        </span>
                    </button>

                    <button
                        onClick={handleToggleRisky}
                        className={`relative p-1 rounded transition-colors group ${isRisky
                            ? 'text-yellow-600 bg-yellow-100'
                            : darkMode
                                ? 'text-gray-400 hover:text-yellow-400'
                                : 'text-gray-500 hover:text-yellow-600'
                            }`}
                        title="Risky"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979.446.743.736 1.79.736 3.021 0 1.23-.29 2.278-.736 3.021C10.792 13.807 10.304 14 10 14c-.304 0-.792-.193-1.264-.979C8.29 12.278 8 11.23 8 10c0-1.231.29-2.278.736-3.021zM10 16a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-52 text-center leading-relaxed z-50">
                            {player.riskyReason ? `Risky: ${player.riskyReason}` : 'Risky'}
                        </span>
                    </button>

                    <button
                        onClick={handleToggleHandcuff}
                        className={`relative p-1 rounded transition-colors group ${isHandcuff
                            ? 'text-blue-500 bg-blue-100'
                            : darkMode
                                ? 'text-gray-400 hover:text-blue-400'
                                : 'text-gray-500 hover:text-blue-500'
                            }`}
                        title="Handcuff"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Handcuff
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Player);
