import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TierList from './components/TierList';
import ExportImport from './components/ExportImport';
import Navbar from './components/Navbar';
import NewPage from './components/NewPage';
import DraftRange from './components/DraftRange';
import Streamers from './components/Streamers';
import InterestingPlayers from './components/InterestingPlayers';
import BackupManager from './components/BackupManager';
import BurgerMenu from './components/BurgerMenu';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialPlayers } from './utils/playerData';
import { getTeamLogo } from './utils/teamData';
import { createBackup, shouldCreateBackup } from './utils/backupSystem';
import { getPositionFilterTagClass } from './utils/playerStyles';
import { saveTierName, clearTierNames, getTierNames } from './utils/tierNames';

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

            // Update existing players with new properties from database and remove deleted players
            const updatedPlayers = currentPlayers
                .filter(player => {
                    // Only keep players that still exist in the database
                    return databaseMap.has(player.id);
                })
                .map(player => {
                    const databasePlayer = databaseMap.get(player.id);
                    if (databasePlayer) {
                        const updatedPlayer = {
                            ...player,
                            team: databasePlayer.team,
                            photo: databasePlayer.photo,
                            teamLogo: getTeamLogo(databasePlayer.team),
                            adp: databasePlayer.adp,
                            ecr: databasePlayer.ecr,
                            byeWeek: databasePlayer.byeWeek,
                            olineRank: databasePlayer.olineRank,
                            // User-controlled flags stay on the saved board
                            drafted: player.drafted,
                            tier: player.tier,
                            isInjured: player.isInjured,
                            isHandcuff: player.isHandcuff,
                            isRisky: player.isRisky,
                            injuryNote: player.injuryNote || databasePlayer.injuryNote || null,
                            riskyReason: player.riskyReason || databasePlayer.riskyReason || null,
                        };

                        return updatedPlayer;
                    }
                    return player;
                });

            // Append any players that are new to the database so a returning
            // user (with a saved board from a prior season) still sees them.
            const storedIds = new Set(currentPlayers.map(p => p.id));
            const newPlayers = databasePlayers.filter(p => !storedIds.has(p.id));

            setPlayers([...updatedPlayers, ...newPlayers]);
        };

        mergeNewProperties();

        // Check if we need to create a backup
        if (shouldCreateBackup()) {
            createBackup(players, 'automatic');
        }
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

    // Backup manager modal state
    const [showBackupManager, setShowBackupManager] = useState(false);

    // Reset to default confirmation modal state
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Current page state
    const [currentPage, setCurrentPage] = useState('draft-board');

    // Bumps when tier names change so TierList re-reads localStorage
    const [tierNamesVersion, setTierNamesVersion] = useState(0);

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
        if (hash === 'draft-range' || hash === 'draft-board' || hash === 'streamers' || hash === 'interesting-players') {
            setCurrentPage(hash);
        }
    }, []);

    // Keep tier name labels in sync across all tier headers
    useEffect(() => {
        const handleTierNamesUpdated = () => setTierNamesVersion(v => v + 1);
        window.addEventListener('tier-names-updated', handleTierNamesUpdated);
        return () => window.removeEventListener('tier-names-updated', handleTierNamesUpdated);
    }, []);

    // Toggle draft status for a player
    const handleToggleDraft = useCallback((playerId) => {
        setPlayers(prev => prev.map(player =>
            player.id === playerId
                ? { ...player, drafted: !player.drafted }
                : player
        ));
    }, [setPlayers]);

    // Move a player to another tier / position (drag and drop)
    const handleMovePlayer = useCallback((playerId, newTier, targetIndex = null) => {
        setPlayers(prev => {
            const playerToMove = prev.find(p => p.id === playerId);
            if (!playerToMove) return prev;

            const without = prev.filter(p => p.id !== playerId);
            const targetTierPlayers = without.filter(p => p.tier === newTier);
            const moved = { ...playerToMove, tier: newTier };

            if (targetIndex !== null && targetIndex !== undefined) {
                targetTierPlayers.splice(targetIndex, 0, moved);
            } else {
                targetTierPlayers.push(moved);
            }

            const otherPlayers = without.filter(p => p.tier !== newTier);
            const updated = [...otherPlayers, ...targetTierPlayers];

            createBackup(updated, 'player reorder');
            return updated;
        });
    }, [setPlayers]);

    // Remove an empty tier
    const handleRemoveTier = useCallback((tierNumber) => {
        // Move all players from the tier to tier 1
        setPlayers(prev => prev.map(player =>
            player.tier === tierNumber
                ? { ...player, tier: 1 }
                : player
        ));
    }, [setPlayers]);

    // Add a new tier
    const handleAddTier = useCallback(() => {
        setPlayers(prev => {
            const tierNames = getTierNames();
            const tiersFromPlayers = prev.map(p => p.tier);
            const tiersFromNames = Object.keys(tierNames).map(Number);
            const allTiers = [...tiersFromPlayers, ...tiersFromNames];
            const maxTier = allTiers.length > 0 ? Math.max(...allTiers) : 0;
            const newTierNumber = maxTier + 1;

            saveTierName(newTierNumber, `Tier ${newTierNumber}`);
            return [...prev];
        });
    }, [setPlayers]);

    // Rename a tier
    const handleRenameTier = useCallback((tierNumber, newName) => {
        saveTierName(tierNumber, newName);
        setPlayers(prev => [...prev]);
    }, [setPlayers]);

    // Handle position filter checkbox changes
    const handlePositionFilterChange = useCallback((position) => {
        setPositionFilters(prev => {
            if (prev.includes(position)) {
                // Remove position if already selected
                return prev.filter(p => p !== position);
            } else {
                // Add position if not selected
                return [...prev, position];
            }
        });
    }, [setPositionFilters]);

    // Handle importing players
    const handleImportPlayers = (importedPlayers) => {
        setPlayers(importedPlayers);
        setShowExportImport(false);
    };

    // Handle restore from backup
    const handleRestoreFromBackup = (restoredPlayers) => {
        setPlayers(restoredPlayers);
        setShowBackupManager(false);
    };

    // Reset all drafted players
    const handleResetDrafted = useCallback(() => {
        setPlayers(prev => prev.map(player => ({
            ...player,
            drafted: false
        })));
    }, [setPlayers]);

    // Reset to default database order
    const handleResetToDefault = () => {
        clearTierNames();
        localStorage.removeItem('fantasy-football-players');
        window.location.reload();
    };

    // Toggle risky status for a player
    const handleToggleRisky = useCallback((playerId, isRisky) => {
        setPlayers(prev => prev.map(player =>
            player.id === playerId
                ? { ...player, isRisky }
                : player
        ));
    }, [setPlayers]);

    const handleToggleInjured = useCallback((playerId, isInjured) => {
        setPlayers(prev => prev.map(player =>
            player.id === playerId
                ? { ...player, isInjured }
                : player
        ));
    }, [setPlayers]);

    const handleToggleHandcuff = useCallback((playerId, isHandcuff) => {
        setPlayers(prev => prev.map(player =>
            player.id === playerId
                ? { ...player, isHandcuff }
                : player
        ));
    }, [setPlayers]);

    // Handle page navigation
    const handlePageChange = (pageId) => {
        setCurrentPage(pageId);
        // Update URL hash for direct linking
        window.location.hash = pageId;
    };

    // Get position tag styling
    const getPositionTagStyle = getPositionFilterTagClass;

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

    const filteredPlayers = useMemo(() => players.filter(player => {
        if (hideDrafted && player.drafted) return false;
        if (positionFilters.length > 0 && !positionFilters.includes(player.position)) return false;
        return true;
    }), [players, hideDrafted, positionFilters]);

    const draftStats = useMemo(() => {
        const drafted = players.filter(p => p.drafted).length;
        return {
            total: players.length,
            drafted,
            available: players.length - drafted,
        };
    }, [players]);

    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            {/* Navigation Bar */}
            <Navbar
                darkMode={darkMode}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
            />

            {/* Page Content */}
            {currentPage === 'draft-board' && (
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
                    {/* Header with toggles */}
                    <div className="mb-4 sm:mb-6">
                        {/* Title */}
                        <div className="mb-4">
                            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Fantasy Football 2026 Draft Board
                            </h1>
                            <p className={`text-sm sm:text-base mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Drag players between tiers, mark as drafted, and track risky picks.
                            </p>
                            <div className={`mt-3 flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm`}>
                                <span className={`px-3 py-1 rounded-full ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700 border border-gray-200'}`}>
                                    {draftStats.total} total
                                </span>
                                <span className={`px-3 py-1 rounded-full ${darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                    {draftStats.available} available
                                </span>
                                <span className={`px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                    {draftStats.drafted} drafted
                                </span>
                            </div>
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

                                {/* Burger Menu */}
                                <BurgerMenu
                                    darkMode={darkMode}
                                    onAddTier={handleAddTier}
                                    onShowBackupManager={() => setShowBackupManager(true)}
                                    onShowExportImport={() => setShowExportImport(true)}
                                    onShowResetConfirm={() => setShowResetConfirm(true)}

                                />
                            </div>
                        </div>
                    </div>

                    <TierList
                        players={filteredPlayers}
                        allPlayers={players}
                        onMovePlayer={handleMovePlayer}
                        onToggleDraft={handleToggleDraft}
                        onToggleRisky={handleToggleRisky}
                        onToggleInjured={handleToggleInjured}
                        onToggleHandcuff={handleToggleHandcuff}
                        onRemoveTier={handleRemoveTier}
                        onRenameTier={handleRenameTier}
                        darkMode={darkMode}
                        tierNamesVersion={tierNamesVersion}
                    />

                    {/* Backup Manager Modal */}
                    {showBackupManager && (
                        <BackupManager
                            players={players}
                            onRestorePlayers={handleRestoreFromBackup}
                            darkMode={darkMode}
                            onClose={() => setShowBackupManager(false)}
                        />
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
                <DraftRange
                    darkMode={darkMode}
                    players={players}
                    allPlayers={players}
                />
            )}

            {/* Streamers Page */}
            {currentPage === 'streamers' && (
                <Streamers darkMode={darkMode} />
            )}

            {/* Interesting Players Page */}
            {currentPage === 'interesting-players' && (
                <InterestingPlayers darkMode={darkMode} />
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