import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import TierList from './components/TierList';
import ExportImport from './components/ExportImport';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import NewPage from './components/NewPage';
import DraftRange from './components/DraftRange';
import Streamers from './components/Streamers';
import InterestingPlayers from './components/InterestingPlayers';
import BackupManager from './components/BackupManager';
import BurgerMenu from './components/BurgerMenu';
import DraftBoardSearch from './components/DraftBoardSearch';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialPlayers } from './utils/playerData';
import { getTeamLogo } from './utils/teamData';
import { createBackup, shouldCreateBackup } from './utils/backupSystem';
import { getPositionFilterTagClass } from './utils/playerStyles';
import { saveTierName, clearTierNames, getTierNames } from './utils/tierNames';
import { ui } from './utils/uiTheme';
import { LEGACY_HASH_ROUTES } from './utils/routes';

function App() {
    const navigate = useNavigate();
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

    // Bumps when tier names change so TierList re-reads localStorage
    const [tierNamesVersion, setTierNamesVersion] = useState(0);

    const [focusPlayerId, setFocusPlayerId] = useState(null);

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

    // Redirect old hash URLs (e.g. #draft-range) to real routes
    useEffect(() => {
        const hash = window.location.hash.replace('#', '').trim();
        const legacyPath = LEGACY_HASH_ROUTES[hash];
        if (legacyPath) {
            navigate(legacyPath, { replace: true });
            window.history.replaceState(null, '', legacyPath);
        }
    }, [navigate]);

    // Keep tier name labels in sync across all tier headers
    useEffect(() => {
        const handleTierNamesUpdated = () => setTierNamesVersion(v => v + 1);
        window.addEventListener('tier-names-updated', handleTierNamesUpdated);
        return () => window.removeEventListener('tier-names-updated', handleTierNamesUpdated);
    }, []);

    // Sync dark mode to <html> for global CSS hooks
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

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

    const handleJumpToPlayer = useCallback((player) => {
        if (!player) return;

        if (hideDrafted && player.drafted) {
            setHideDrafted(false);
        }
        if (positionFilters.length > 0 && !positionFilters.includes(player.position)) {
            setPositionFilters((prev) => [...prev, player.position]);
        }

        setFocusPlayerId(player.id);
    }, [hideDrafted, positionFilters, setHideDrafted, setPositionFilters]);

    useEffect(() => {
        if (!focusPlayerId) return undefined;

        const scrollTimer = window.setTimeout(() => {
            const element = document.querySelector(`[data-player-id="${focusPlayerId}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);

        const clearTimer = window.setTimeout(() => {
            setFocusPlayerId(null);
        }, 2800);

        return () => {
            window.clearTimeout(scrollTimer);
            window.clearTimeout(clearTimer);
        };
    }, [focusPlayerId, filteredPlayers]);

    const draftStats = useMemo(() => {
        const drafted = players.filter(p => p.drafted).length;
        return {
            total: players.length,
            drafted,
            available: players.length - drafted,
        };
    }, [players]);

    return (
        <div className={ui.page(darkMode)}>
            <ScrollToTop />
            <Navbar
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
            />

            <Routes>
                <Route path="/" element={<Navigate to="/draft-board" replace />} />
                <Route
                    path="/draft-board"
                    element={(
                <div className="container mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
                    <div className="mb-6">
                        <div className="mb-5">
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">
                                2026 Season
                            </p>
                            <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${ui.heading(darkMode)}`}>
                                <span className="text-gradient-brand">Draft Board</span>
                            </h1>
                            <p className={`mt-2 max-w-2xl text-sm sm:text-base ${ui.muted(darkMode)}`}>
                                Drag players between tiers, mark picks as drafted, and flag risky or injured players.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className={ui.statPill(darkMode, 'default')}>{draftStats.total} total</span>
                                <span className={ui.statPill(darkMode, 'success')}>{draftStats.available} available</span>
                                <span className={ui.statPill(darkMode, 'muted')}>{draftStats.drafted} drafted</span>
                            </div>
                        </div>

                        <div className={`${ui.toolbar(darkMode)} flex flex-col gap-3`}>
                            <DraftBoardSearch
                                players={players}
                                darkMode={darkMode}
                                onSelectPlayer={handleJumpToPlayer}
                            />

                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsPositionDropdownOpen(!isPositionDropdownOpen)}
                                    className={ui.btn(darkMode)}
                                >
                                    <span>{getPositionFilterDisplay()}</span>
                                    <svg className={`h-4 w-4 transition-transform ${isPositionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isPositionDropdownOpen && (
                                    <div className={`absolute left-0 top-full z-20 mt-2 w-52 p-2 ${ui.dropdown(darkMode)}`}>
                                        {['QB', 'RB', 'WR', 'TE', 'K', 'DST'].map(position => (
                                            <label
                                                key={position}
                                                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={positionFilters.includes(position)}
                                                    onChange={() => handlePositionFilterChange(position)}
                                                    className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500/30"
                                                />
                                                <span className={getPositionTagStyle(position)}>
                                                    {position}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2.5">
                                    <label className={`text-sm font-medium ${ui.muted(darkMode)}`}>
                                        Hide drafted
                                    </label>
                                    <button
                                        onClick={() => setHideDrafted(!hideDrafted)}
                                        className={ui.toggle(darkMode, hideDrafted)}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${hideDrafted ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <button onClick={handleResetDrafted} className={ui.btn(darkMode)}>
                                    Reset drafted
                                </button>

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
                    </div>

                    <TierList
                        players={filteredPlayers}
                        allPlayers={players}
                        focusPlayerId={focusPlayerId}
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
                        <div className={ui.modalOverlay}>
                            <div className={ui.modal(darkMode)}>
                                <div className="mb-6 text-center">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-3xl">
                                        ⚠️
                                    </div>
                                    <h3 className={`mb-2 text-lg font-bold ${ui.heading(darkMode)}`}>
                                        Reset to Default?
                                    </h3>
                                    <p className={`text-sm leading-relaxed ${ui.muted(darkMode)}`}>
                                        This will clear all your custom tier arrangements and draft status,
                                        then reload the default database order. This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex justify-center gap-3">
                                    <button onClick={() => setShowResetConfirm(false)} className={ui.btn(darkMode)}>
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleResetToDefault}
                                        className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                                    >
                                        Yes, reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                    )}
                />
                <Route
                    path="/draft-range"
                    element={(
                        <DraftRange
                            darkMode={darkMode}
                            allPlayers={players}
                        />
                    )}
                />
                <Route
                    path="/streamers"
                    element={<Streamers darkMode={darkMode} />}
                />
                <Route
                    path="/interesting-players"
                    element={<InterestingPlayers darkMode={darkMode} />}
                />
                <Route
                    path="/draft-scheduler"
                    element={<NewPage darkMode={darkMode} />}
                />
                <Route path="*" element={<Navigate to="/draft-board" replace />} />
            </Routes>

            {/* Global Modals (available on all pages) */}
            {/* Export/Import Modal */}
            {showExportImport && (
                <div className={ui.modalOverlay}>
                    <div className="w-full max-w-md">
                        <ExportImport
                            players={players}
                            onImportPlayers={handleImportPlayers}
                            darkMode={darkMode}
                        />
                        <div className="mt-4 text-center">
                            <button onClick={() => setShowExportImport(false)} className={ui.btn(darkMode)}>
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