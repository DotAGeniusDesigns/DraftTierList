import React, { useState, useRef, useEffect } from 'react';
import { getOlineRank } from '../utils/teamData';

const Player = ({ player, index, onToggleDraft, onMovePlayer, onToggleRisky, darkMode }) => {
    const [isDragging, setIsDragging] = useState(false);
    const playerRef = useRef(null);

    // Toggle states for the new buttons - initialize from player data
    const [isHandcuff, setIsHandcuff] = useState(player.isHandcuff || false);
    const [isInjured, setIsInjured] = useState(player.isInjured || false);
    const [isRisky, setIsRisky] = useState(player.isRisky || false);

    // Debug logging for injured players
    useEffect(() => {
        if (player.isInjured) {
            console.log(`🔴 INJURED PLAYER: ${player.name}`, {
                isInjured: player.isInjured,
                injuryNote: player.injuryNote,
                byeWeek: player.byeWeek,
                olineRank: player.olineRank
            });
        }
    }, [player]);



    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleDraft(player.id);
    };

    const handleDragStart = (e) => {
        console.log('🎯 DRAG START for player:', player.name, 'at index:', index);
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
            console.log('🎯 DROP detected:', playerId, 'onto', player.id, 'at index:', index);

            if (playerId !== player.id) {
                // Moving to a different player's tier
                onMovePlayer && onMovePlayer(playerId, player.tier, index);
            }
        } catch (error) {
            console.error('Error parsing drag data:', error);
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Touch event handlers for mobile
    const handleTouchStart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDragging(true);

        // Store drag data
        const dragData = {
            playerId: player.id,
            sourceIndex: index,
            sourceTier: player.tier
        };

        // Dispatch custom drag start event
        const dragStartEvent = new CustomEvent('playerDragStart', {
            detail: dragData,
            bubbles: true
        });
        document.dispatchEvent(dragStartEvent);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        // Prevent scrolling during drag
        e.preventDefault();
        e.stopPropagation();

        const touch = e.touches[0];

        // Dispatch custom drag move event
        const dragMoveEvent = new CustomEvent('playerDragMove', {
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
        });
        document.dispatchEvent(dragMoveEvent);
    };

    const handleTouchEnd = (e) => {
        if (!isDragging) return;

        // Prevent any default behavior
        e.preventDefault();
        e.stopPropagation();

        const touch = e.changedTouches[0];

        // Dispatch custom drag end event
        const dragEndEvent = new CustomEvent('playerDragEnd', {
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
        });
        document.dispatchEvent(dragEndEvent);

        setIsDragging(false);
    };

    // Toggle button handlers
    const handleToggleHandcuff = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsHandcuff(!isHandcuff);
    };

    const handleToggleInjured = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsInjured(!isInjured);
    };

    const handleToggleRisky = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsRisky(!isRisky);
        // Update the player data in parent component
        if (onToggleRisky) {
            onToggleRisky(player.id, !isRisky);
        }
    };


    return (
        <div
            ref={playerRef}
            draggable="true"
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`
                relative p-2 sm:p-3 border-b cursor-grab active:cursor-grabbing transition-all duration-200
                ${isDragging ? 'opacity-50 scale-105 z-50' : ''}
                ${darkMode
                    ? `border-gray-700 ${player.drafted ? 'bg-gray-800 opacity-60' : 'bg-gray-900 hover:bg-gray-800'}`
                    : `border-gray-200 ${player.drafted ? 'bg-gray-100 opacity-60' : 'bg-white hover:bg-gray-50'}`
                }
            `}
            onClick={handleClick}
            style={{ userSelect: 'none' }}
            data-player-id={player.id}
        >
            {/* Draft indicator */}
            {player.drafted && (
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
            )}

            {/* Player info - reorganized columns */}
            <div className="flex items-center gap-2 sm:gap-0">
                {/* Rank */}
                <div className={`w-8 sm:w-16 text-center font-bold text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    {index}
                </div>

                {/* Photo */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                        src={player.photo}
                        alt={player.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
                        }`} style={{ display: 'none' }}>
                        {player.name.split(' ').map(n => n[0]).join('')}
                    </div>
                </div>

                {/* Player name - mobile optimized */}
                <div className="flex-1 min-w-0 px-2 sm:px-4">
                    <div className={`font-semibold text-sm ${player.drafted ? 'line-through' : ''} ${darkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                        {player.name}
                    </div>
                </div>

                {/* Position */}
                <div className="w-16 sm:w-20 text-center mx-1 sm:mx-2">
                    <span className={`text-xs font-bold px-1 sm:px-2 py-1 rounded ${player.drafted
                        ? 'bg-gray-300 text-gray-600'
                        : player.position === 'WR'
                            ? 'bg-green-100 text-green-800'
                            : player.position === 'RB'
                                ? 'bg-blue-100 text-blue-800'
                                : player.position === 'QB'
                                    ? 'bg-orange-100 text-orange-800'
                                    : player.position === 'TE'
                                        ? 'bg-purple-100 text-purple-800'
                                        : player.position === 'DST'
                                            ? 'bg-gray-200 text-gray-700'
                                            : player.position === 'K'
                                                ? 'bg-pink-100 text-pink-800'
                                                : 'bg-gray-200 text-gray-700'
                        }`}>
                        {player.position}
                    </span>
                </div>

                {/* Team logo */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    <img
                        src={player.teamLogo}
                        alt={player.team}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            console.error(`Failed to load team logo for ${player.team}:`, player.teamLogo);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`} style={{ display: 'none' }}>
                        {player.team}
                    </div>
                </div>

                {/* O-Line Ranking */}
                <div className="w-12 sm:w-16 text-center">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {player.olineRank || getOlineRank(player.team) || '--'}
                    </span>
                </div>

                {/* Bye week */}
                <div className="w-12 sm:w-16 text-center">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        {player.byeWeek}
                    </span>
                </div>

                {/* Toggle Buttons */}
                <div className="flex items-center gap-1 sm:gap-2 mx-1 sm:mx-2">
                    {/* Injured Button */}
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

                    {/* Risky Button */}
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

                    {/* Handcuff Button */}
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
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                        </svg>
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Handcuff
                        </span>
                    </button>
                </div>

                {/* Drag handle - larger on mobile for better touch */}
                <div className={`w-8 sm:w-12 transition-colors flex-shrink-0 ml-1 sm:ml-2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default Player; 