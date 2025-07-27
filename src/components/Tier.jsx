import React, { useState } from 'react';
import Player from './Player';

const Tier = ({ tierNumber, players, onToggleDraft, onRemoveTier, onMovePlayer, startingRank, darkMode }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [dropIndex, setDropIndex] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);

        // Calculate drop position based on mouse position, accounting for scroll
        const rect = e.currentTarget.getBoundingClientRect();
        // Use pageY to get position relative to document, then calculate relative to container
        const y = e.pageY - rect.top - window.pageYOffset;

        // Calculate dynamic drop zone height based on actual container height
        const containerHeight = rect.height;
        const headerHeight = 48; // Approximate header height (p-3 = 12px top + 12px bottom + ~24px content)
        const availableHeight = containerHeight - headerHeight;
        const dynamicDropZoneHeight = availableHeight / players.length;

        const padding = 12; // Padding of the container

        // Calculate which position the drop would be at
        const adjustedY = y - padding;
        const newIndex = Math.max(0, Math.floor(adjustedY / dynamicDropZoneHeight));

        // Simply use the calculated index without adjustment here
        // The adjustment will be handled in the drop function
        setDropIndex(Math.min(newIndex, players.length));
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

            let finalDropIndex = dropIndex !== null ? dropIndex : 0;

            // Adjust for same-tier dragging
            if (sourceTier === tierNumber) {
                const draggedPlayerIndex = players.findIndex(p => p.id === playerId);
                if (draggedPlayerIndex !== -1 && finalDropIndex > draggedPlayerIndex) {
                    // When dragging down within the same tier, we need to account for 
                    // the fact that the dragged item will be removed first
                    finalDropIndex = finalDropIndex - 1;
                }
            }

            console.log('Drop in tier:', playerId, 'to tier', tierNumber, 'at index:', finalDropIndex);
            if (playerId) {
                onMovePlayer && onMovePlayer(playerId, tierNumber, finalDropIndex);
            }
        } catch (error) {
            console.error('Error parsing drag data in tier:', error);
        }
        setDropIndex(null);
    };

    return (
        <div className="mb-6">
            {/* Clean Tier Header */}
            <div className={`flex items-center justify-between p-3 rounded-t-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}`}>
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">Tier {tierNumber}</h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-300'}`}>
                        {players.length} player{players.length !== 1 ? 's' : ''}
                    </span>
                    {players.length === 0 && (
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

            {/* Clean Tier Content */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border rounded-b-lg transition-all duration-200 ${darkMode
                    ? `${isDragOver ? 'bg-gray-800 border-gray-600' : 'bg-gray-900 border-gray-700'}`
                    : `${isDragOver ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'}`
                    }`}
            >
                {players.length === 0 ? (
                    <div className={`flex items-center justify-center h-16 border-b ${darkMode ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-200'
                        }`}>
                        <div className="text-center">
                            <p className="text-sm">Drop players here</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Column Headers */}
                        <div className={`flex items-center p-3 border-b text-xs font-semibold ${darkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-300'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                            }`}>
                            <div className="w-16 text-center">RANK</div>
                            <div className="w-12 text-center">PHOTO</div>
                            <div className="flex-1 px-12">PLAYER</div>
                            <div className="w-12 text-center">TEAM</div>
                            <div className="w-24 text-center mx-4">POS</div>
                            <div className="w-24 text-center">BYE</div>
                            <div className="w-12 ml-2"></div>
                        </div>

                        {/* Players List */}
                        {players.map((player, index) => (
                            <div key={player.id} className="relative">
                                {/* Drop indicator */}
                                {isDragOver && dropIndex === index && (
                                    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-10"></div>
                                )}
                                <Player
                                    player={player}
                                    index={startingRank + index}
                                    onToggleDraft={onToggleDraft}
                                    onMovePlayer={onMovePlayer}
                                    darkMode={darkMode}
                                />
                            </div>
                        ))}
                        {/* Drop indicator at the end */}
                        {isDragOver && dropIndex === players.length && (
                            <div className="h-0.5 bg-blue-500"></div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tier; 