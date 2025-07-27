import React, { useState } from 'react';
import TierList from './components/TierList';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialPlayers } from './utils/playerData';

function App() {
    // Use localStorage hook to persist player data
    const [players, setPlayers] = useLocalStorage('fantasy-football-players', initialPlayers);

    // Dark mode state
    const [darkMode, setDarkMode] = useLocalStorage('dark-mode', false);

    // Hide drafted players state
    const [hideDrafted, setHideDrafted] = useLocalStorage('hide-drafted', false);

    // Toggle draft status for a player
    const handleToggleDraft = (playerId) => {
        const updatedPlayers = players.map(player =>
            player.id === playerId
                ? { ...player, drafted: !player.drafted }
                : player
        );
        setPlayers(updatedPlayers);
    };

    // Update players (for drag and drop)
    const handleUpdatePlayers = (updatedPlayers) => {
        setPlayers(updatedPlayers);
    };

    // Remove an empty tier
    const handleRemoveTier = (tierNumber) => {
        // Move all players from the tier to tier 1
        const updatedPlayers = players.map(player =>
            player.tier === tierNumber
                ? { ...player, tier: 1 }
                : player
        );
        setPlayers(updatedPlayers);
    };

    // Filter players based on hide drafted setting
    const filteredPlayers = hideDrafted
        ? players.filter(player => !player.drafted)
        : players;

    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header with toggles */}
                <div className="mb-6 flex items-center justify-between">
                    <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Fantasy Football Draft Tier List
                    </h1>

                    <div className="flex items-center gap-4">
                        {/* Hide Drafted Toggle */}
                        <div className="flex items-center gap-2">
                            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Hide Drafted
                            </label>
                            <button
                                onClick={() => setHideDrafted(!hideDrafted)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hideDrafted
                                        ? 'bg-blue-600'
                                        : darkMode
                                            ? 'bg-gray-600'
                                            : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hideDrafted ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center gap-2">
                            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Dark Mode
                            </label>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode
                                        ? 'bg-blue-600'
                                        : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>

                <TierList
                    players={filteredPlayers}
                    onUpdatePlayers={handleUpdatePlayers}
                    onToggleDraft={handleToggleDraft}
                    onRemoveTier={handleRemoveTier}
                    darkMode={darkMode}
                />
            </div>
        </div>
    );
}

export default App; 