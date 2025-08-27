// Backup system for user's custom draft order and multiple draft boards
// Automatically saves snapshots and allows restoration

const BACKUP_KEY = 'fantasy-football-backups';
const DRAFT_BOARDS_KEY = 'fantasy-football-draft-boards';
const MAX_BACKUPS = 10; // Keep last 10 backups
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Create a new backup
export const createBackup = (players, reason = 'automatic') => {
    try {
        const timestamp = new Date().toISOString();
        const backup = {
            timestamp,
            reason,
            players: players.map(player => ({
                id: player.id,
                tier: player.tier,
                drafted: player.drafted,
                risky: player.risky,
                // Don't backup database properties that change
                // Only backup user customizations
            })),
            playerCount: players.length,
            firstPlayer: players[0]?.name || 'None',
            lastPlayer: players[players.length - 1]?.name || 'None'
        };

        // Get existing backups
        const existingBackups = getBackups();

        // Add new backup
        existingBackups[timestamp] = backup;

        // Remove old backups if we exceed the limit
        const backupTimestamps = Object.keys(existingBackups).sort().reverse();
        if (backupTimestamps.length > MAX_BACKUPS) {
            const backupsToRemove = backupTimestamps.slice(MAX_BACKUPS);
            backupsToRemove.forEach(timestamp => {
                delete existingBackups[timestamp];
            });
        }

        // Save back to localStorage
        localStorage.setItem(BACKUP_KEY, JSON.stringify(existingBackups));

        console.log(`Backup created: ${reason} at ${timestamp}`);
        return true;
    } catch (error) {
        console.error('Failed to create backup:', error);
        return false;
    }
};

// Get all available backups
export const getBackups = () => {
    try {
        const backups = localStorage.getItem(BACKUP_KEY);
        return backups ? JSON.parse(backups) : {};
    } catch (error) {
        console.error('Failed to get backups:', error);
        return {};
    }
};

// Get a specific backup by timestamp
export const getBackup = (timestamp) => {
    const backups = getBackups();
    return backups[timestamp] || null;
};

// Restore players from a backup
export const restoreFromBackup = (backup, currentPlayers) => {
    try {
        if (!backup || !backup.players) {
            throw new Error('Invalid backup data');
        }

        // Create a map of current players for reference
        const currentPlayerMap = new Map(currentPlayers.map(p => [p.id, p]));

        // Restore the backup, preserving current database properties
        const restoredPlayers = backup.players.map(backupPlayer => {
            const currentPlayer = currentPlayerMap.get(backupPlayer.id);
            if (currentPlayer) {
                // Restore user customizations but keep current database data
                return {
                    ...currentPlayer, // Keep all current database properties
                    tier: backupPlayer.tier, // Restore user's custom tier
                    drafted: backupPlayer.drafted, // Restore draft status
                    risky: backupPlayer.risky, // Restore risky status
                };
            }
            // If player no longer exists in database, skip them
            return null;
        }).filter(Boolean); // Remove null entries

        return restoredPlayers;
    } catch (error) {
        console.error('Failed to restore from backup:', error);
        return null;
    }
};

// Check if we need to create a backup
export const shouldCreateBackup = () => {
    try {
        const backups = getBackups();
        const timestamps = Object.keys(backups).sort().reverse();

        if (timestamps.length === 0) {
            return true; // No backups exist, create one
        }

        const lastBackupTime = new Date(timestamps[0]);
        const now = new Date();
        const timeSinceLastBackup = now - lastBackupTime;

        return timeSinceLastBackup >= BACKUP_INTERVAL;
    } catch (error) {
        console.error('Failed to check backup timing:', error);
        return true; // If there's an error, create a backup to be safe
    }
};

// Get backup summary for display
export const getBackupSummary = () => {
    const backups = getBackups();
    const timestamps = Object.keys(backups).sort().reverse();

    return timestamps.map(timestamp => {
        const backup = backups[timestamp];
        return {
            timestamp,
            reason: backup.reason,
            playerCount: backup.playerCount,
            firstPlayer: backup.firstPlayer,
            lastPlayer: backup.lastPlayer,
            date: new Date(timestamp).toLocaleDateString(),
            time: new Date(timestamp).toLocaleTimeString()
        };
    });
};

// Delete a specific backup
export const deleteBackup = (timestamp) => {
    try {
        const backups = getBackups();
        if (backups[timestamp]) {
            delete backups[timestamp];
            localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to delete backup:', error);
        return false;
    }
};

// Clear all backups
export const clearAllBackups = () => {
    try {
        localStorage.removeItem(BACKUP_KEY);
        return true;
    } catch (error) {
        console.error('Failed to clear backups:', error);
        return false;
    }
};

// ===== DRAFT BOARD MANAGEMENT =====

// Save current draft board as a named board
export const saveDraftBoard = (players, name, description = '') => {
    try {
        const timestamp = new Date().toISOString();
        const draftBoard = {
            id: timestamp,
            name,
            description,
            timestamp,
            players: players.map(player => ({
                id: player.id,
                tier: player.tier,
                drafted: player.drafted,
                risky: player.risky,
            })),
            playerCount: players.length,
            firstPlayer: players[0]?.name || 'None',
            lastPlayer: players[players.length - 1]?.name || 'None'
        };

        // Get existing draft boards
        const existingBoards = getDraftBoards();

        // Add new board
        existingBoards[timestamp] = draftBoard;

        // Save back to localStorage
        localStorage.setItem(DRAFT_BOARDS_KEY, JSON.stringify(existingBoards));

        console.log(`Draft board saved: ${name} at ${timestamp}`);
        return true;
    } catch (error) {
        console.error('Failed to save draft board:', error);
        return false;
    }
};

// Get all saved draft boards
export const getDraftBoards = () => {
    try {
        const boards = localStorage.getItem(DRAFT_BOARDS_KEY);
        return boards ? JSON.parse(boards) : {};
    } catch (error) {
        console.error('Failed to get draft boards:', error);
        return {};
    }
};

// Get a specific draft board by ID
export const getDraftBoard = (boardId) => {
    const boards = getDraftBoards();
    return boards[boardId] || null;
};

// Load a draft board
export const loadDraftBoard = (boardId, currentPlayers) => {
    try {
        const board = getDraftBoard(boardId);
        if (!board || !board.players) {
            throw new Error('Invalid draft board data');
        }

        // Create a map of current players for reference
        const currentPlayerMap = new Map(currentPlayers.map(p => [p.id, p]));

        // Load the board, preserving current database properties
        const loadedPlayers = board.players.map(boardPlayer => {
            const currentPlayer = currentPlayerMap.get(boardPlayer.id);
            if (currentPlayer) {
                // Load user customizations but keep current database data
                return {
                    ...currentPlayer, // Keep all current database properties
                    tier: boardPlayer.tier, // Load user's custom tier
                    drafted: boardPlayer.drafted, // Load draft status
                    risky: boardPlayer.risky, // Load risky status
                };
            }
            // If player no longer exists in database, skip them
            return null;
        }).filter(Boolean); // Remove null entries

        return loadedPlayers;
    } catch (error) {
        console.error('Failed to load draft board:', error);
        return null;
    }
};

// Delete a draft board
export const deleteDraftBoard = (boardId) => {
    try {
        const boards = getDraftBoards();
        if (boards[boardId]) {
            delete boards[boardId];
            localStorage.setItem(DRAFT_BOARDS_KEY, JSON.stringify(boards));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to delete draft board:', error);
        return false;
    }
};

// Get draft board summary for display
export const getDraftBoardSummary = () => {
    const boards = getDraftBoards();
    const boardIds = Object.keys(boards).sort().reverse();

    return boardIds.map(boardId => {
        const board = boards[boardId];
        return {
            id: boardId,
            name: board.name,
            description: board.description,
            timestamp: board.timestamp,
            playerCount: board.playerCount,
            firstPlayer: board.firstPlayer,
            lastPlayer: board.lastPlayer,
            date: new Date(board.timestamp).toLocaleDateString(),
            time: new Date(board.timestamp).toLocaleTimeString()
        };
    });
};
