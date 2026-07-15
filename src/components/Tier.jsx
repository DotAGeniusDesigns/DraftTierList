import React, { useState, useRef, useEffect, useMemo } from 'react';
import Player from './Player';
import { getTierDisplayName, TIER_NAMES_UPDATED_EVENT } from '../utils/tierNames';

const Tier = ({
    tierNumber,
    players,
    allTierPlayers,
    onToggleDraft,
    onToggleRisky,
    onToggleInjured,
    onToggleHandcuff,
    onRemoveTier,
    onRenameTier,
    onMovePlayer,
    startingRank,
    darkMode,
    tierNamesVersion = 0,
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [dropIndex, setDropIndex] = useState(null);
    const [isTouchDragging, setIsTouchDragging] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tierName, setTierName] = useState(() => getTierDisplayName(tierNumber));
    const tierRef = useRef(null);
    const dropIndexRef = useRef(null);

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

    const resolveDropIndex = (y, containerHeight) => {
        const headerHeight = 48;
        const padding = 12;
        const availableHeight = Math.max(containerHeight - headerHeight, 1);
        const rowCount = Math.max(players.length, 1);
        const dynamicDropZoneHeight = availableHeight / rowCount;
        const adjustedY = y - padding;
        const newIndex = Math.max(0, Math.floor(adjustedY / dynamicDropZoneHeight));
        return Math.min(newIndex, players.length);
    };

    const finalizeDrop = (playerId, sourceTier, index) => {
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
    };

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
    }, [isTouchDragging, players, tierNumber, onMovePlayer]);

    return (
        <div className="mb-6">
            <div className={`flex items-center justify-between p-3 rounded-t-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}`}>
                <div className="flex items-center gap-3">
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
                                className={`px-2 py-1 text-lg font-bold rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                autoFocus
                            />
                            <button onClick={handleSaveName} className="p-1 rounded hover:bg-gray-700 text-green-400" title="Save name">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button onClick={handleCancelEdit} className="p-1 rounded hover:bg-gray-700 text-red-400" title="Cancel edit">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">{tierName}</h3>
                            <button onClick={() => setIsEditingName(true)} className="p-1 rounded hover:bg-gray-700 text-gray-400" title="Edit tier name">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-300'}`}>
                        {allTierPlayers.length} player{allTierPlayers.length !== 1 ? 's' : ''}
                        {players.length !== allTierPlayers.length && (
                            <span className="opacity-75"> ({players.length} shown)</span>
                        )}
                    </span>
                    {allTierPlayers.length === 0 && (
                        <button
                            onClick={() => onRemoveTier(tierNumber)}
                            className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-800'}`}
                            title="Remove empty tier"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
                className={`border rounded-b-lg transition-all duration-200 ${darkMode
                    ? `${isDragOver ? 'bg-gray-800 border-gray-600' : 'bg-gray-900 border-gray-700'}`
                    : `${isDragOver ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'}`
                    }`}
            >
                {players.length === 0 ? (
                    <div className={`flex items-center justify-center h-16 border-b ${darkMode ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-200'}`}>
                        <p className="text-sm">Drop players here</p>
                    </div>
                ) : (
                    <div className="relative">
                        <div className={`sm:hidden flex items-center p-3 border-b text-xs font-semibold sticky top-0 z-10 ${darkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-300'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                            }`}>
                            <div className="w-8 text-center">RK</div>
                            <div className="w-10 text-center"></div>
                            <div className="flex-1 px-3">PLAYER</div>
                            <div className="w-10 text-center">POS</div>
                            <div className="w-10 text-center">TM</div>
                            <div className="w-8 text-center">ADP</div>
                        </div>

                        <div className={`hidden sm:flex items-center p-3 pl-1 border-b text-xs font-semibold sticky top-0 z-10 ${darkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-300'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                            }`}>
                            <div className="w-8 sm:w-16 text-center">RANK</div>
                            <div className="w-10 sm:w-12 text-center">PHOTO</div>
                            <div className="flex-1 px-2 sm:px-4">PLAYER</div>
                            <div className="w-16 sm:w-20 text-center mx-1 sm:mx-2">POS</div>
                            <div className="w-10 sm:w-12 text-center">TEAM</div>
                            <div className="w-12 sm:w-16 text-center">O-LINE</div>
                            <div className="w-12 sm:w-16 text-center">BYE</div>
                            <div className="w-12 sm:w-16 text-center">ECR</div>
                            <div className="w-12 sm:w-16 text-center">ADP</div>
                            <div className="w-20 sm:w-24 text-center mx-1 sm:mx-2">NOTES</div>
                        </div>

                        {players.map((player, index) => (
                            <div key={player.id} className="relative">
                                {isDragOver && dropIndex === index && (
                                    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-10"></div>
                                )}
                                <Player
                                    player={player}
                                    index={rankByPlayerId.get(player.id) ?? startingRank + index}
                                    onToggleDraft={onToggleDraft}
                                    onToggleRisky={onToggleRisky}
                                    onToggleInjured={onToggleInjured}
                                    onToggleHandcuff={onToggleHandcuff}
                                    onMovePlayer={onMovePlayer}
                                    darkMode={darkMode}
                                />
                            </div>
                        ))}
                        {isDragOver && dropIndex === players.length && (
                            <div className="h-0.5 bg-blue-500"></div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(Tier);
