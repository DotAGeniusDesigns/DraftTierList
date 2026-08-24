import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Navigate, Route, Routes, useLocation, useNavigate, useSearchParams,
} from 'react-router-dom';
import TierList from './components/TierList';
import PositionColorPicker from './components/PositionColorPicker';
import ExportImport from './components/ExportImport';
import Navbar from './components/Navbar';
import RouteHead from './components/RouteHead';
import NewPage from './components/NewPage';
import DraftRange from './components/DraftRange';
import Streamers from './components/Streamers';
import OffseasonHub from './components/OffseasonHub';
import InterestingPlayers from './components/InterestingPlayers';
import BackupManager from './components/BackupManager';
import BurgerMenu from './components/BurgerMenu';
import DraftModeBar from './components/DraftModeBar';
import DraftBoardGrid from './components/DraftBoardGrid';
import DraftBoardSearch from './components/DraftBoardSearch';
import SharedBoardBanner from './components/SharedBoardBanner';
import SleeperSync from './components/SleeperSync';
import Footer from './components/Footer';
import ProfilePage from './components/ProfilePage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ConfirmEmailPage from './components/auth/ConfirmEmailPage';
import RecoverEmailPage from './components/auth/RecoverEmailPage';
import RequireAuth from './components/auth/RequireAuth';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsOfService from './components/legal/TermsOfService';
import NotFoundPage from './components/NotFoundPage';
// League Hub is not linked from the navbar yet (still being built out), but
// its routes are live so it can be used and tested directly by URL.
import LeagueHubCreate from './components/LeagueHubCreate';
import LeagueHubManage from './components/LeagueHubManage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialPlayers, migratePlayerId, getRankingsForFormat, buildDefaultPlayers } from './utils/playerData';
import { playerDatabase } from './utils/playerDatabase';
import { getTeamLogo } from './utils/teamData';
import {
    createBackup, flushScheduledBackup, scheduleBackup, shouldCreateBackup,
} from './utils/backupSystem';
import { getPositionFilterTagProps } from './utils/playerStyles';
import { usePositionColors } from './context/PositionColorsContext';
import {
    saveTierName, clearTierNames, getTierNames, replaceTierNames,
} from './utils/tierNames';
import { ui } from './utils/uiTheme';
import { LEGACY_HASH_ROUTES } from './utils/routes';
import { decodeSharedBoard, SHARE_PARAM } from './utils/exportImport';
import { decodeCloudBoard, setActiveBoardId } from './utils/cloudBoards';
import {
    DEFAULT_SCORING_FORMAT,
    getScoringFormatLabel,
    SCORING_FORMAT_OPTIONS,
} from './utils/scoringFormats';
import { useAuth } from './context/AuthContext';

const DraftLottery = React.lazy(() => import('./components/DraftLottery'));
const LeagueHub = React.lazy(() => import('./components/LeagueHub'));
// Lazy on purpose: DraftKit pulls in playerStats.js (~700KB of season history),
// which would otherwise more than double the main bundle for every visitor.
const DraftKit = React.lazy(() => import('./components/DraftKit'));

// The five user-set flags, in the order they appear on a player row.
const FLAG_FILTERS = {
    upside: { label: 'Upside', field: 'isUpside', tone: 'text-emerald-500' },
    risky: { label: 'Risky', field: 'isRisky', tone: 'text-amber-500' },
    handcuff: { label: 'Handcuff', field: 'isHandcuff', tone: 'text-sky-500' },
    favorite: { label: 'Favorite', field: 'isFavorite', tone: 'text-yellow-500' },
    dnd: { label: 'Do Not Draft', field: 'isDND', tone: 'text-rose-500' },
};

const DRAFT_MODE_TEAM_SIZES = [8, 10, 12, 14, 16];

const FLAG_ICONS = {
    upside: 'M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z',
    risky: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979.446.743.736 1.79.736 3.021 0 1.23-.29 2.278-.736 3.021C10.792 13.807 10.304 14 10 14c-.304 0-.792-.193-1.264-.979C8.29 12.278 8 11.23 8 10c0-1.231.29-2.278.736-3.021zM10 16a1 1 0 100-2 1 1 0 000 2z',
    handcuff: 'M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z',
    favorite: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    dnd: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z',
};

function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { mustChangePassword } = useAuth();
    // Use localStorage hook to persist player data
    const [players, setPlayers] = useLocalStorage(
        'fantasy-football-players',
        initialPlayers,
        { writeDelayMs: 300 },
    );

    // A reset-only session cannot use account APIs until it chooses a real
    // password. Keep navigation aligned with that server-side restriction.
    useEffect(() => {
        if (mustChangePassword && location.pathname !== '/profile') {
            navigate('/profile?change-password=1', { replace: true });
        }
    }, [location.pathname, mustChangePassword, navigate]);

    // Merge new database properties with existing localStorage data
    useEffect(() => {
        const mergeNewProperties = () => {
            const currentPlayers = players;
            const databasePlayers = initialPlayers;

            // Create a map of database players by ID for quick lookup
            const databaseMap = new Map(databasePlayers.map(p => [p.id, p]));

            // Update existing players with new properties from database and remove deleted players
            const updatedPlayers = currentPlayers
                .map(player => {
                    // Rescue saved entries whose id changed in the database,
                    // otherwise the filter below would treat them as deleted.
                    const id = migratePlayerId(player.id);
                    return id === player.id ? player : { ...player, id };
                })
                .filter(player => {
                    // Only keep players that still exist in the database
                    return databaseMap.has(player.id);
                })
                .map(player => {
                    const databasePlayer = databaseMap.get(player.id);
                    if (databasePlayer) {
                        // isInjured/injuryStamp are retired — the injury report
                        // now drives the badge and the flag means upside — so
                        // they're dropped rather than carried forward.
                        const { isInjured, injuryStamp, ...saved } = player;
                        const updatedPlayer = {
                            ...saved,
                            team: databasePlayer.team,
                            photo: databasePlayer.photo,
                            teamLogo: getTeamLogo(databasePlayer.team),
                            adp: databasePlayer.adp,
                            ecr: databasePlayer.ecr,
                            byeWeek: databasePlayer.byeWeek,
                            olineRank: databasePlayer.olineRank,
                            injury: databasePlayer.injury || null,
                            // User-controlled flags stay on the saved board
                            drafted: player.drafted,
                            draftedAt: player.draftedAt ?? null,
                            tier: player.tier,
                            isUpside: player.isUpside,
                            isHandcuff: player.isHandcuff,
                            isRisky: player.isRisky,
                            isFavorite: player.isFavorite,
                            isDND: player.isDND,
                            injuryNote: player.injuryNote || databasePlayer.injuryNote || null,
                            riskyReason: player.riskyReason || databasePlayer.riskyReason || null,
                        };

                        return updatedPlayer;
                    }
                    return player;
                });

            // Append any players that are new to the database so a returning
            // user (with a saved board from a prior season) still sees them.
            // Read ids off the merged list, not the raw saved one, so a player
            // whose id was migrated above isn't re-added as a duplicate.
            const storedIds = new Set(updatedPlayers.map(p => p.id));
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

    // Position badge colors (user-editable, see PositionColorsContext)
    const { colors: positionColors } = usePositionColors();
    const [showPositionColorPicker, setShowPositionColorPicker] = useState(false);

    // Hide drafted players state
    const [hideDrafted, setHideDrafted] = useLocalStorage('hide-drafted', false);

    // Draft Mode: a live pick tracker for the board. Persisted so a page
    // refresh mid-draft doesn't lose where things stand.
    const [draftModeActive, setDraftModeActive] = useLocalStorage('draft-mode-active', false);
    const [draftModeTeams, setDraftModeTeams] = useLocalStorage('draft-mode-teams', 12);
    const [showDraftModeGrid, setShowDraftModeGrid] = useState(false);

    // Position filter state - now an array of selected positions
    const [positionFilters, setPositionFilters] = useLocalStorage('position-filters', []);

    // Flag filter state - any of the user-set flags, matched as an OR
    const [flagFilters, setFlagFilters] = useLocalStorage('flag-filters', []);

    const [scoringFormat, setScoringFormat] = useLocalStorage(
        'scoring-format',
        DEFAULT_SCORING_FORMAT,
    );

    // Re-derive each player's ECR/ADP for the active scoring format. The board
    // itself (tiers, order, drafted status) never changes — only these two
    // numbers do. Runs on mount too, which corrects a returning visitor's
    // non-default stored format immediately after the initial database merge.
    useEffect(() => {
        setPlayers((prev) => prev.map((player) => {
            const databasePlayer = playerDatabase[player.id];
            if (!databasePlayer) return player;
            const { ecr, adp } = getRankingsForFormat(databasePlayer, scoringFormat);
            if (player.ecr === ecr && player.adp === adp) return player;
            return { ...player, ecr, adp };
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scoringFormat]);

    // Dropdown open state
    const [isScoringDropdownOpen, setIsScoringDropdownOpen] = useState(false);
    const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);
    const [isFlagDropdownOpen, setIsFlagDropdownOpen] = useState(false);

    // Export/Import modal state
    const [showExportImport, setShowExportImport] = useState(false);

    // Backup manager modal state
    const [showBackupManager, setShowBackupManager] = useState(false);

    // Reset to default confirmation modal state
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Draft Mode needs a clean slate to count picks accurately, so starting
    // it while players are already marked drafted asks for confirmation first.
    const [showDraftModeStartConfirm, setShowDraftModeStartConfirm] = useState(false);

    // Bumps when tier names change so TierList re-reads localStorage
    const [tierNamesVersion, setTierNamesVersion] = useState(0);

    // Monotonic clock for draftedAt stamps. Two picks landing in the same JS
    // millisecond (two quick clicks, or a Sleeper poll batch-marking several
    // players at once) would otherwise tie under plain Date.now(), and
    // Draft Mode's "last pick" lookup would silently pick the wrong one.
    const lastDraftedAtRef = useRef(0);
    const nextDraftedAt = useCallback(() => {
        const now = Date.now();
        lastDraftedAtRef.current = now > lastDraftedAtRef.current
            ? now
            : lastDraftedAtRef.current + 1;
        return lastDraftedAtRef.current;
    }, []);

    const [focusPlayerId, setFocusPlayerId] = useState(null);

    // Board decoded from a ?board=... share link, pending the visitor's decision
    const [sharedBoard, setSharedBoard] = useState(null);
    const [shareError, setShareError] = useState(null);

    // Refs for the dropdown containers
    const scoringDropdownRef = useRef(null);
    const dropdownRef = useRef(null);
    const flagDropdownRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (scoringDropdownRef.current && !scoringDropdownRef.current.contains(event.target)) {
                setIsScoringDropdownOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsPositionDropdownOpen(false);
            }
            if (flagDropdownRef.current && !flagDropdownRef.current.contains(event.target)) {
                setIsFlagDropdownOpen(false);
            }
        };

        if (isScoringDropdownOpen || isPositionDropdownOpen || isFlagDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isScoringDropdownOpen, isPositionDropdownOpen, isFlagDropdownOpen]);

    // Redirect old hash URLs (e.g. #draft-range) to real routes
    useEffect(() => {
        const hash = window.location.hash.replace('#', '').trim();
        const legacyPath = LEGACY_HASH_ROUTES[hash];
        if (legacyPath) {
            navigate(legacyPath, { replace: true });
            window.history.replaceState(null, '', legacyPath);
        }
    }, [navigate]);

    // Decode an incoming share link, then strip the (very long) code from the
    // address bar so a refresh doesn't re-prompt and the URL stays readable.
    useEffect(() => {
        const code = searchParams.get(SHARE_PARAM);
        if (!code) return;

        try {
            setSharedBoard(decodeSharedBoard(code));
            setShareError(null);
        } catch (error) {
            setSharedBoard(null);
            setShareError(error.message);
        }

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete(SHARE_PARAM);
        setSearchParams(nextParams, { replace: true });
    }, [searchParams, setSearchParams]);

    // Keep tier name labels in sync across all tier headers
    useEffect(() => {
        const handleTierNamesUpdated = () => setTierNamesVersion(v => v + 1);
        window.addEventListener('tier-names-updated', handleTierNamesUpdated);
        return () => window.removeEventListener('tier-names-updated', handleTierNamesUpdated);
    }, []);

    useEffect(() => {
        const flushBackup = () => flushScheduledBackup();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flushBackup();
        };

        window.addEventListener('pagehide', flushBackup);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('pagehide', flushBackup);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            flushBackup();
        };
    }, []);

    // Sync dark mode to <html> for global CSS hooks
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    // Toggle draft status for a player. Stamps draftedAt so Draft Mode can
    // tell which pick came last and derive the current pick number from it.
    const handleToggleDraft = useCallback((playerId) => {
        setPlayers(prev => prev.map(player =>
            player.id === playerId
                ? {
                    ...player,
                    drafted: !player.drafted,
                    draftedAt: !player.drafted ? nextDraftedAt() : null,
                }
                : player
        ));
    }, [setPlayers, nextDraftedAt]);

    // Bulk-mark players drafted (Sleeper live sync). Additive only: a pick can
    // never un-draft a player the user checked off by hand. Bails out with the
    // previous array when nothing changed so an idle poll doesn't re-render the
    // board or rewrite localStorage.
    const handleMarkDraftedByIds = useCallback((playerIds) => {
        if (!playerIds || playerIds.length === 0) return;
        // Index within the incoming array, not Date.now(), stamps the order —
        // a single Sleeper poll can mark several picks at once, and they'd
        // otherwise all land on the same millisecond and confuse Draft Mode's
        // "last pick" lookup.
        const orderById = new Map(playerIds.map((id, i) => [id, i]));
        const base = nextDraftedAt();

        setPlayers(prev => {
            let changed = false;
            const next = prev.map(player => {
                if (orderById.has(player.id) && !player.drafted) {
                    changed = true;
                    return { ...player, drafted: true, draftedAt: base + orderById.get(player.id) };
                }
                return player;
            });
            return changed ? next : prev;
        });
    }, [setPlayers, nextDraftedAt]);

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

            scheduleBackup(updated, 'player reorder');
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
        const tierNames = getTierNames();
        const tiersFromPlayers = players.map(p => p.tier);
        const tiersFromNames = Object.keys(tierNames).map(Number);
        const allTiers = [...tiersFromPlayers, ...tiersFromNames];
        const maxTier = allTiers.length > 0 ? Math.max(...allTiers) : 0;
        const newTierNumber = maxTier + 1;

        saveTierName(newTierNumber, `Tier ${newTierNumber}`);
    }, [players]);

    // Rename a tier
    const handleRenameTier = useCallback((tierNumber, newName) => {
        saveTierName(tierNumber, newName);
    }, []);

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

    const handleFlagFilterChange = useCallback((key) => {
        setFlagFilters(prev => (
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        ));
    }, [setFlagFilters]);

    // Adopt a shared board. The visitor's own board is backed up first so
    // "Use this board" is always recoverable from the Backups modal.
    const handleUseSharedBoard = useCallback(() => {
        if (!sharedBoard) return;

        createBackup(players, 'before applying shared board');
        setPlayers(sharedBoard.players);
        replaceTierNames(sharedBoard.tierNames);
        if (sharedBoard.scoringFormat) setScoringFormat(sharedBoard.scoringFormat);
        setActiveBoardId(null);

        setSharedBoard(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [sharedBoard, players, setPlayers, setScoringFormat]);

    // Load a board saved to the user's account. Same shape as adopting a
    // shared board — including the safety backup — since the incoming board
    // replaces whatever is currently on screen.
    const handleLoadCloudBoard = useCallback((code, boardName) => {
        const decoded = decodeCloudBoard(code);

        createBackup(players, `before loading "${boardName || 'saved board'}"`);
        setPlayers(decoded.players);
        replaceTierNames(decoded.tierNames);
        if (decoded.scoringFormat) setScoringFormat(decoded.scoringFormat);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [players, setPlayers, setScoringFormat]);

    // Handle importing players
    const handleImportPlayers = (importedPlayers, importedScoringFormat = null) => {
        createBackup(players, 'before importing board');
        setPlayers(importedPlayers);
        if (importedScoringFormat) setScoringFormat(importedScoringFormat);
        replaceTierNames();
        setActiveBoardId(null);
        setShowExportImport(false);
    };

    // Handle restore from backup
    const handleRestoreFromBackup = (restoredPlayers) => {
        createBackup(players, 'before restoring board');
        setPlayers(restoredPlayers);
        replaceTierNames();
        setActiveBoardId(null);
        setShowBackupManager(false);
    };

    // Reset all drafted players
    const handleResetDrafted = useCallback(() => {
        setPlayers(prev => {
            createBackup(prev, 'before resetting drafted players');
            return prev.map(player => ({
                ...player,
                drafted: false,
                draftedAt: null,
            }));
        });
    }, [setPlayers]);

    // Reset to the default ranking for the active scoring format: sorted by
    // that format's ECR with shared tier boundaries applied by rank position.
    const handleResetToDefault = () => {
        createBackup(players, 'before resetting to default');
        clearTierNames();
        setActiveBoardId(null);
        setPlayers(buildDefaultPlayers(scoringFormat));
        setShowResetConfirm(false);
    };

    // Toggle risky status for a player
    const handleToggleRisky = useCallback((playerId, isRisky) => {
        setPlayers(prev => prev.map(player =>
            player.id === playerId
                ? { ...player, isRisky }
                : player
        ));
    }, [setPlayers]);

    const handleToggleUpside = useCallback((playerId, isUpside) => {
        setPlayers(prev => prev.map(player =>
            player.id === playerId
                ? { ...player, isUpside }
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

    // Favorite and Do Not Draft are opposite calls on the same player, so
    // setting one clears the other rather than letting a row carry both.
    const handleToggleFavorite = useCallback((playerId, isFavorite) => {
        setPlayers(prev => prev.map(player =>
            player.id === playerId
                ? { ...player, isFavorite, isDND: isFavorite ? false : player.isDND }
                : player
        ));
    }, [setPlayers]);

    const handleToggleDND = useCallback((playerId, isDND) => {
        setPlayers(prev => prev.map(player =>
            player.id === playerId
                ? { ...player, isDND, isFavorite: isDND ? false : player.isFavorite }
                : player
        ));
    }, [setPlayers]);

    // Get position tag styling
    const getPositionTagStyle = (position) => getPositionFilterTagProps(position, positionColors);

    // Get display text for dropdown
    const getFlagFilterDisplay = () => {
        if (flagFilters.length === 0) return 'Flags';
        if (flagFilters.length === 1) return FLAG_FILTERS[flagFilters[0]].label;
        return `${flagFilters.length} Flags`;
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

    // Flags are matched as an OR: ticking Upside and Handcuff asks for the
    // players carrying either, not the handful carrying both.
    const filteredPlayers = useMemo(() => players.filter(player => {
        if (hideDrafted && player.drafted) return false;
        if (positionFilters.length > 0 && !positionFilters.includes(player.position)) return false;
        if (flagFilters.length > 0 && !flagFilters.some(key => player[FLAG_FILTERS[key].field])) return false;
        return true;
    }), [players, hideDrafted, positionFilters, flagFilters]);

    const handleJumpToPlayer = useCallback((player) => {
        if (!player) return;

        if (hideDrafted && player.drafted) {
            setHideDrafted(false);
        }
        if (positionFilters.length > 0 && !positionFilters.includes(player.position)) {
            setPositionFilters((prev) => [...prev, player.position]);
        }
        // Jumping to an unflagged player would otherwise scroll to a row the
        // active flag filter has hidden.
        if (flagFilters.length > 0 && !flagFilters.some(key => player[FLAG_FILTERS[key].field])) {
            setFlagFilters([]);
        }

        setFocusPlayerId(player.id);
    }, [hideDrafted, positionFilters, flagFilters, setHideDrafted, setPositionFilters, setFlagFilters]);

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

    // Draft Mode's live numbers. The "current" pick is one past the last
    // drafted player, derived from the count rather than tracked separately
    // so undoing a pick (un-drafting someone) self-corrects for free. "Last
    // pick" is whichever drafted player has the newest draftedAt stamp —
    // players drafted before this feature existed have no stamp and are
    // excluded, so they just won't show up as the "last" one.
    const draftModeStats = useMemo(() => {
        let lastPick = null;
        for (const player of players) {
            if (!player.drafted || !player.draftedAt) continue;
            if (!lastPick || player.draftedAt > lastPick.draftedAt) lastPick = player;
        }
        return {
            draftedCount: draftStats.drafted,
            lastPickName: lastPick ? lastPick.name : null,
        };
    }, [players, draftStats.drafted]);

    // Entry point for the "Start Draft Mode" button: only interrupt with a
    // confirmation if there's actually something to lose.
    const handleRequestStartDraftMode = useCallback(() => {
        if (draftStats.drafted > 0) {
            setShowDraftModeStartConfirm(true);
        } else {
            setDraftModeActive(true);
        }
    }, [draftStats.drafted, setDraftModeActive]);

    // Draft Mode's pick count and "last pick" both depend on every drafted
    // player having a draftedAt stamp, so a pre-existing drafted player with
    // none would silently throw off the numbering. Clearing drafted status
    // (not tiers — those stay put) keeps pick tracking accurate from pick 1.
    const handleConfirmStartDraftMode = useCallback(() => {
        setPlayers(prev => {
            createBackup(prev, 'before starting draft mode');
            return prev.map(player => ({
                ...player,
                drafted: false,
                draftedAt: null,
            }));
        });
        setDraftModeActive(true);
        setShowDraftModeStartConfirm(false);
    }, [setPlayers, setDraftModeActive]);

    return (
        <div className={ui.page(darkMode)}>
            <RouteHead />
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
                    <SharedBoardBanner
                        darkMode={darkMode}
                        board={sharedBoard}
                        onApply={handleUseSharedBoard}
                        onDismiss={() => setSharedBoard(null)}
                    />

                    {shareError && (
                        <div
                            className={`mb-5 flex items-start justify-between gap-3 rounded-2xl border p-4 ${
                                darkMode
                                    ? 'border-rose-500/25 bg-rose-500/[0.07]'
                                    : 'border-rose-200 bg-rose-50'
                            }`}
                        >
                            <p className={`text-sm ${darkMode ? 'text-rose-200' : 'text-rose-700'}`}>
                                {shareError}
                            </p>
                            <button
                                type="button"
                                onClick={() => setShareError(null)}
                                className={`shrink-0 text-sm font-semibold ${
                                    darkMode ? 'text-rose-300 hover:text-rose-100' : 'text-rose-600 hover:text-rose-800'
                                }`}
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    <div className="mb-6">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                            <div>
                                <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${ui.heading(darkMode)}`}>
                                    <span className="text-gradient-brand">Draft Board</span>
                                </h1>
                                <p className={`mt-1.5 max-w-2xl text-sm sm:text-base ${ui.muted(darkMode)}`}>
                                    Drag players between tiers, mark picks as drafted, and flag upside, risky or handcuff players.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className={ui.statPill(darkMode, 'default')}>{draftStats.total} total</span>
                                <span className={ui.statPill(darkMode, 'success')}>{draftStats.available} available</span>
                                <span className={ui.statPill(darkMode, 'muted')}>{draftStats.drafted} drafted</span>
                            </div>
                        </div>

                        <div className={`${ui.toolbar(darkMode)} flex flex-col gap-3`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <DraftBoardSearch
                                    players={players}
                                    darkMode={darkMode}
                                    onSelectPlayer={handleJumpToPlayer}
                                />

                                {!draftModeActive && (
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={draftModeTeams}
                                            onChange={(e) => setDraftModeTeams(Number(e.target.value))}
                                            className={ui.btn(darkMode)}
                                            aria-label="Teams in your draft"
                                        >
                                            {DRAFT_MODE_TEAM_SIZES.map((size) => (
                                                <option key={size} value={size}>{size} teams</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleRequestStartDraftMode}
                                            className={ui.btnPrimary()}
                                        >
                                            Start Draft Mode
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={`flex flex-col gap-3 border-t pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${darkMode ? 'border-white/[0.06]' : 'border-slate-200/80'}`}>
                            <div className="flex flex-wrap items-center gap-3">
                            <div className="relative" ref={scoringDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsScoringDropdownOpen(!isScoringDropdownOpen)}
                                    className={ui.btn(darkMode)}
                                >
                                    <span>{getScoringFormatLabel(scoringFormat)}</span>
                                    <svg className={`h-4 w-4 transition-transform ${isScoringDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isScoringDropdownOpen && (
                                    <div className={`absolute left-0 top-full z-20 mt-2 w-52 p-2 ${ui.dropdown(darkMode)}`}>
                                        {SCORING_FORMAT_OPTIONS.map((option) => (
                                            <label
                                                key={option.id}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                                                    option.enabled
                                                        ? (darkMode ? 'cursor-pointer hover:bg-white/5' : 'cursor-pointer hover:bg-slate-50')
                                                        : 'cursor-not-allowed opacity-45'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="scoring-format"
                                                    checked={scoringFormat === option.id}
                                                    disabled={!option.enabled}
                                                    onChange={() => {
                                                        if (!option.enabled) return;
                                                        setScoringFormat(option.id);
                                                        setIsScoringDropdownOpen(false);
                                                    }}
                                                    className="h-4 w-4 border-slate-300 text-emerald-500 focus:ring-emerald-500/30 disabled:cursor-not-allowed"
                                                />
                                                <span className={`text-sm font-medium ${ui.heading(darkMode)}`}>
                                                    {option.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

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
                                                <span {...getPositionTagStyle(position)}>
                                                    {position}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={flagDropdownRef}>
                                <button
                                    onClick={() => setIsFlagDropdownOpen(!isFlagDropdownOpen)}
                                    className={ui.btn(darkMode)}
                                >
                                    <span>{getFlagFilterDisplay()}</span>
                                    <svg className={`h-4 w-4 transition-transform ${isFlagDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isFlagDropdownOpen && (
                                    <div className={`absolute left-0 top-full z-20 mt-2 w-52 p-2 ${ui.dropdown(darkMode)}`}>
                                        {Object.entries(FLAG_FILTERS).map(([key, flag]) => (
                                            <label
                                                key={key}
                                                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={flagFilters.includes(key)}
                                                    onChange={() => handleFlagFilterChange(key)}
                                                    className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500/30"
                                                />
                                                <svg className={`h-4 w-4 ${flag.tone}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                                    <path fillRule="evenodd" d={FLAG_ICONS[key]} clipRule="evenodd" />
                                                </svg>
                                                <span className={`text-sm font-medium ${ui.heading(darkMode)}`}>
                                                    {flag.label}
                                                </span>
                                            </label>
                                        ))}
                                        {flagFilters.length > 0 && (
                                            <button
                                                onClick={() => setFlagFilters([])}
                                                className={`mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${ui.muted(darkMode)} ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                            >
                                                Clear flag filters
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
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
                                    onShowPositionColorPicker={() => setShowPositionColorPicker(true)}
                                />
                            </div>
                            </div>
                        </div>
                    </div>

                    {draftModeActive && (
                        <DraftModeBar
                            darkMode={darkMode}
                            teamCount={draftModeTeams}
                            draftedCount={draftModeStats.draftedCount}
                            lastPickName={draftModeStats.lastPickName}
                            onShowGrid={() => setShowDraftModeGrid(true)}
                            onEnd={() => setDraftModeActive(false)}
                        />
                    )}

                    {showDraftModeGrid && (
                        <DraftBoardGrid
                            darkMode={darkMode}
                            players={players}
                            teamCount={draftModeTeams}
                            onClose={() => setShowDraftModeGrid(false)}
                        />
                    )}

                    <SleeperSync
                        players={players}
                        darkMode={darkMode}
                        onMarkDrafted={handleMarkDraftedByIds}
                    />

                    <TierList
                        players={filteredPlayers}
                        allPlayers={players}
                        focusPlayerId={focusPlayerId}
                        onMovePlayer={handleMovePlayer}
                        onToggleDraft={handleToggleDraft}
                        onToggleRisky={handleToggleRisky}
                        onToggleUpside={handleToggleUpside}
                        onToggleHandcuff={handleToggleHandcuff}
                        onToggleFavorite={handleToggleFavorite}
                        onToggleDND={handleToggleDND}
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

                    {showPositionColorPicker && (
                        <PositionColorPicker
                            darkMode={darkMode}
                            onClose={() => setShowPositionColorPicker(false)}
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
                                        Your scoring is set to <strong>{getScoringFormatLabel(scoringFormat)}</strong>.
                                        Reset to the default ranking by ECR for this scoring? This will clear all
                                        your custom tier arrangements and draft status. This action cannot be undone.
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

                    {/* Start Draft Mode Confirmation Modal */}
                    {showDraftModeStartConfirm && (
                        <div className={ui.modalOverlay}>
                            <div className={ui.modal(darkMode)}>
                                <div className="mb-6 text-center">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
                                        ⚠️
                                    </div>
                                    <h3 className={`mb-2 text-lg font-bold ${ui.heading(darkMode)}`}>
                                        Start Draft Mode?
                                    </h3>
                                    <p className={`text-sm leading-relaxed ${ui.muted(darkMode)}`}>
                                        You already have <strong>{draftStats.drafted}</strong> player{draftStats.drafted !== 1 ? 's' : ''} marked drafted.
                                        Draft Mode counts picks from a clean board, so starting it will mark all of them
                                        undrafted again — your tiers and rankings won&apos;t change, only draft status.
                                    </p>
                                </div>
                                <div className="flex justify-center gap-3">
                                    <button onClick={() => setShowDraftModeStartConfirm(false)} className={ui.btn(darkMode)}>
                                        Cancel
                                    </button>
                                    <button onClick={handleConfirmStartDraftMode} className={ui.btnPrimary()}>
                                        Yes, start Draft Mode
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
                    path="/offseason"
                    element={<OffseasonHub darkMode={darkMode} />}
                />
                <Route
                    path="/draft-lottery"
                    element={(
                        <React.Suspense
                            fallback={(
                                <div className="container mx-auto max-w-7xl px-4 py-12">
                                    <p className={`text-sm ${ui.muted(darkMode)}`} role="status">
                                        Loading draft lottery…
                                    </p>
                                </div>
                            )}
                        >
                            <DraftLottery darkMode={darkMode} />
                        </React.Suspense>
                    )}
                />
                <Route
                    path="/draft-kit"
                    element={(
                        <React.Suspense
                            fallback={(
                                <div className="container mx-auto max-w-7xl px-4 py-12">
                                    <p className={`text-sm ${ui.muted(darkMode)}`} role="status">
                                        Loading draft kit…
                                    </p>
                                </div>
                            )}
                        >
                            <DraftKit darkMode={darkMode} allPlayers={players} />
                        </React.Suspense>
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
                {/* League Hub: live at these URLs, but intentionally not in
                    NAV_ROUTES / the navbar yet — still being built out. */}
                <Route
                    path="/league/:id"
                    element={(
                        <React.Suspense
                            fallback={(
                                <div className="container mx-auto max-w-7xl px-4 py-12">
                                    <p className={`text-sm ${ui.muted(darkMode)}`} role="status">
                                        Loading league…
                                    </p>
                                </div>
                            )}
                        >
                            <LeagueHub darkMode={darkMode} />
                        </React.Suspense>
                    )}
                />
                <Route
                    path="/league-hub"
                    element={(
                        <RequireAuth darkMode={darkMode}>
                            <LeagueHubCreate darkMode={darkMode} />
                        </RequireAuth>
                    )}
                />
                <Route
                    path="/league-hub/:id"
                    element={(
                        <RequireAuth darkMode={darkMode}>
                            <LeagueHubManage darkMode={darkMode} />
                        </RequireAuth>
                    )}
                />

                {/* Accounts */}
                <Route path="/login" element={<LoginPage darkMode={darkMode} />} />
                <Route path="/signup" element={<SignupPage darkMode={darkMode} />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage darkMode={darkMode} />} />
                <Route path="/confirm-email" element={<ConfirmEmailPage darkMode={darkMode} />} />
                <Route path="/recover-email" element={<RecoverEmailPage darkMode={darkMode} />} />
                <Route
                    path="/profile"
                    element={(
                        <RequireAuth darkMode={darkMode}>
                            <ProfilePage
                                darkMode={darkMode}
                                players={players}
                                scoringFormat={scoringFormat}
                                onLoadBoard={handleLoadCloudBoard}
                            />
                        </RequireAuth>
                    )}
                />

                {/* Legal */}
                <Route path="/privacy" element={<PrivacyPolicy darkMode={darkMode} />} />
                <Route path="/terms" element={<TermsOfService darkMode={darkMode} />} />

                <Route path="*" element={<NotFoundPage darkMode={darkMode} />} />
            </Routes>

            <Footer darkMode={darkMode} />

            {/* Global Modals (available on all pages) */}
            {/* Export/Import Modal */}
            {showExportImport && (
                <div className={ui.modalOverlay}>
                    <div className="w-full max-w-md">
                        <ExportImport
                            players={players}
                            scoringFormat={scoringFormat}
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