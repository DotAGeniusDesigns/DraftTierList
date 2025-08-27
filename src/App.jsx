import React, { useState, useEffect, useRef } from 'react';
import TierList from './components/TierList';
import ExportImport from './components/ExportImport';
import Navbar from './components/Navbar';
import NewPage from './components/NewPage';
import DraftRange from './components/DraftRange';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialPlayers } from './utils/playerData';
import { getTeamLogo } from './utils/teamData';

function App() {
    // Use localStorage hook to persist player data
    const [players, setPlayers] = useLocalStorage('fantasy-football-players', initialPlayers);

    // Merge new database properties with existing localStorage data
    useEffect(() => {
        const mergeNewProperties = () => {
            const currentPlayers = players;
            const databasePlayers = initialPlayers;

            // Create a map of database players by ID for quick lookup
            const databaseMap = new Map(databasePlayers.map(p => [p.id, p]));

            // Update existing players with new properties from database
            const updatedPlayers = currentPlayers.map(player => {
                const databasePlayer = databaseMap.get(player.id);
                if (databasePlayer) {
                    const updatedPlayer = {
                        ...player,
                        // Prioritize database values over localStorage for these properties
                        team: databasePlayer.team, // Always use current team from database
                        teamLogo: getTeamLogo(databasePlayer.team), // Update team logo when team changes
                        adp: databasePlayer.adp, // Always use current ADP from database
                        isInjured: databasePlayer.isInjured,
                        injuryNote: databasePlayer.injuryNote || player.injuryNote || null,
                        isHandcuff: databasePlayer.isHandcuff,
                        isRisky: databasePlayer.isRisky,
                        riskyReason: databasePlayer.riskyReason || player.riskyReason || null,
                        // Update bye week and oline rank from current database
                        byeWeek: databasePlayer.byeWeek,
                        olineRank: databasePlayer.olineRank
                    };

                    // Debug: Log if any of the new properties are true
                    if (databasePlayer.isInjured || databasePlayer.isHandcuff || databasePlayer.isRisky) {
                        console.log(`🔍 Updated ${player.name}:`, {
                            isInjured: databasePlayer.isInjured,
                            isHandcuff: databasePlayer.isHandcuff,
                            isRisky: databasePlayer.isRisky,
                            riskyReason: databasePlayer.riskyReason
                        });
                    }

                    return updatedPlayer;
                }
                return player;
            });

            setPlayers(updatedPlayers);
        };

        mergeNewProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on component mount

    // Dark mode state
    const [darkMode, setDarkMode] = useLocalStorage('dark-mode', false);

    // Hide drafted players state
    const [hideDrafted, setHideDrafted] = useLocalStorage('hide-drafted', false);

    // Position filter state - now an array of selected positions
    const [positionFilters, setPositionFilters] = useLocalStorage('position-filters', []);

    // Dropdown open state
    const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);

    // Export/Import modal state
    const [showExportImport, setShowExportImport] = useState(false);

    // Reset to default confirmation modal state
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Current page state
    const [currentPage, setCurrentPage] = useState('draft-board');

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

    // Handle direct links via URL hash
    useEffect(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash === 'draft-range' || hash === 'draft-board') {
            setCurrentPage(hash);
        }
    }, []);

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

    // Handle importing players
    const handleImportPlayers = (importedPlayers) => {
        setPlayers(importedPlayers);
        setShowExportImport(false);
    };

    // Reset all drafted players
    const handleResetDrafted = () => {
        const updatedPlayers = players.map(player => ({
            ...player,
            drafted: false
        }));
        setPlayers(updatedPlayers);
    };

    // Reset to default database order
    const handleResetToDefault = () => {
        // Clear localStorage and reload fresh data
        localStorage.removeItem('fantasy-football-players');
        window.location.reload();
    };

    // Toggle risky status for a player
    const handleToggleRisky = (playerId, isRisky) => {
        const updatedPlayers = players.map(player =>
            player.id === playerId
                ? { ...player, isRisky }
                : player
        );
        setPlayers(updatedPlayers);
    };

    // Handle page navigation
    const handlePageChange = (pageId) => {
        setCurrentPage(pageId);
        // Update URL hash for direct linking
        window.location.hash = pageId;
    };

    // Get position tag styling
    const getPositionTagStyle = (position) => {
        const baseStyle = 'text-xs font-bold px-2 py-1 rounded';
        switch (position) {
            case 'WR':
                return `${baseStyle} bg-green-100 text-green-800`;
            case 'RB':
                return `${baseStyle} bg-red-100 text-red-800`;
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
            {/* Navigation Bar */}
            <Navbar
                darkMode={darkMode}
                currentPage={currentPage}
                onPageChange={handlePageChange}
            />

            {/* Page Content */}
            {currentPage === 'draft-board' && (
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
                    {/* Header with toggles */}
                    <div className="mb-4 sm:mb-6">
                        {/* Title */}
                        <div className="mb-4">
                            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Fantasy Football 2025 Draft Board
                            </h1>
                            <p className={`text-sm sm:text-base mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Drag players between tiers, mark as drafted, and track risky picks.
                            </p>
                        </div>

                        {/* Controls - mobile optimized */}
                        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
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

                            {/* Toggles container - responsive */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                {/* Export/Import Button */}
                                <button
                                    onClick={() => setShowExportImport(true)}
                                    className={`px-3 py-1 text-sm border rounded-md transition-colors ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    📤 Export/Import
                                </button>

                                {/* Hide Drafted Toggle */}
                                <div className="flex items-center gap-2 text-sm">
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

                                {/* Reset Drafted Button */}
                                <button
                                    onClick={handleResetDrafted}
                                    className={`px-3 py-1 text-sm border rounded-md transition-colors whitespace-nowrap ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    🔄 Reset Drafted
                                </button>

                                {/* Reset to Default Button */}
                                <button
                                    onClick={() => setShowResetConfirm(true)}
                                    className={`px-3 py-1 text-sm border rounded-md transition-colors whitespace-nowrap ${darkMode
                                        ? 'bg-red-700 border-red-600 text-white hover:bg-red-600'
                                        : 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
                                        }`}
                                >
                                    ⚠️ Reset to Default
                                </button>
                            </div>
                        </div>
                    </div>

                    <TierList
                        players={filteredPlayers}
                        allPlayers={players}
                        onUpdatePlayers={handleUpdatePlayers}
                        onToggleDraft={handleToggleDraft}
                        onToggleRisky={handleToggleRisky}
                        onRemoveTier={handleRemoveTier}
                        darkMode={darkMode}
                    />

                    {/* Export/Import Modal */}
                    {showExportImport && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="max-w-md w-full">
                                <ExportImport
                                    players={players}
                                    onImportPlayers={handleImportPlayers}
                                    darkMode={darkMode}
                                />
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={() => setShowExportImport(false)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                            : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                            }`}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reset to Default Confirmation Modal */}
                    {showResetConfirm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className={`max-w-md w-full p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="text-center mb-6">
                                    <div className="text-4xl mb-4">⚠️</div>
                                    <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Reset to Default?
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        This will clear all your custom tier arrangements and draft status,
                                        then reload the default database order. This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setShowResetConfirm(false)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                            : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleResetToDefault}
                                        className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                                    >
                                        Yes, Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Draft Range Page */}
            {currentPage === 'draft-range' && (
                <DraftRange darkMode={darkMode} setDarkMode={setDarkMode} />
            )}

            {/* New Tool Page */}
            {currentPage === 'new-tool' && (
                <NewPage darkMode={darkMode} />
            )}

            {/* Global Modals (available on all pages) */}
            {/* Export/Import Modal */}
            {showExportImport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="max-w-md w-full">
                        <ExportImport
                            players={players}
                            onImportPlayers={handleImportPlayers}
                            darkMode={darkMode}
                        />
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setShowExportImport(false)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                    }`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App; 