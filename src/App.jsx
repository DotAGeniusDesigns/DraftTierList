import React, { useState, useEffect, useRef } from 'react';
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

    // Position filter state - now an array of selected positions
    const [positionFilters, setPositionFilters] = useLocalStorage('position-filters', []);

    // Dropdown open state
    const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);

    // Ref for the dropdown container
    const dropdownRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsPositionDropdownOpen(false);
            }
        };

        if (isPositionDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPositionDropdownOpen]);

    // Global touch event handler to prevent scrolling during drag
    useEffect(() => {
        let isDragging = false;

        const handleGlobalTouchStart = (e) => {
            // Check if the touch target is a draggable element
            const target = e.target.closest('[draggable="true"]');
            if (target) {
                isDragging = true;
            }
        };

        const handleGlobalTouchMove = (e) => {
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const handleGlobalTouchEnd = () => {
            isDragging = false;
        };

        // Add global touch event listeners
        document.addEventListener('touchstart', handleGlobalTouchStart, { passive: false });
        document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
        document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });

        return () => {
            document.removeEventListener('touchstart', handleGlobalTouchStart);
            document.removeEventListener('touchmove', handleGlobalTouchMove);
            document.removeEventListener('touchend', handleGlobalTouchEnd);
        };
    }, []);

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

    // Handle position filter checkbox changes
    const handlePositionFilterChange = (position) => {
        setPositionFilters(prev => {
            if (prev.includes(position)) {
                // Remove position if already selected
                return prev.filter(p => p !== position);
            } else {
                // Add position if not selected
                return [...prev, position];
            }
        });
    };

    // Get position tag styling
    const getPositionTagStyle = (position) => {
        const baseStyle = 'text-xs font-bold px-2 py-1 rounded';
        switch (position) {
            case 'WR':
                return `${baseStyle} bg-green-100 text-green-800`;
            case 'RB':
                return `${baseStyle} bg-blue-100 text-blue-800`;
            case 'QB':
                return `${baseStyle} bg-orange-100 text-orange-800`;
            case 'TE':
                return `${baseStyle} bg-purple-100 text-purple-800`;
            case 'DST':
                return `${baseStyle} bg-gray-200 text-gray-700`;
            case 'K':
                return `${baseStyle} bg-pink-100 text-pink-800`;
            default:
                return `${baseStyle} bg-gray-200 text-gray-700`;
        }
    };

    // Get display text for dropdown
    const getPositionFilterDisplay = () => {
        if (positionFilters.length === 6) {
            return 'All Positions';
        } else if (positionFilters.length === 0) {
            return 'Positions';
        } else {
            return `${positionFilters.length} Position${positionFilters.length > 1 ? 's' : ''}`;
        }
    };

    // Filter players based on hide drafted setting and position filters
    const filteredPlayers = players.filter(player => {
        // First filter by draft status
        if (hideDrafted && player.drafted) {
            return false;
        }

        // Then filter by position (if any positions are selected)
        if (positionFilters.length > 0 && !positionFilters.includes(player.position)) {
            return false;
        }

        return true;
    });

    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
                {/* Header with toggles */}
                <div className="mb-4 sm:mb-6">
                    {/* Title and controls container */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <h1 className={`text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Fantasy Football Draft Tier List
                        </h1>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* Position Filters Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsPositionDropdownOpen(!isPositionDropdownOpen)}
                                    className={`px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                >
                                    <span>{getPositionFilterDisplay()}</span>
                                    <svg className={`w-4 h-4 transition-transform ${isPositionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isPositionDropdownOpen && (
                                    <div className={`absolute top-full left-0 mt-1 w-48 rounded-md shadow-lg z-10 ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
                                        }`}>
                                        <div className="py-1">
                                            {['QB', 'RB', 'WR', 'TE', 'K', 'DST'].map(position => (
                                                <label key={position} className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                                    }`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={positionFilters.includes(position)}
                                                        onChange={() => handlePositionFilterChange(position)}
                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <span className={getPositionTagStyle(position)}>
                                                        {position}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Toggles container */}
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