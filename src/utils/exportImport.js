import LZString from 'lz-string';

// Export tier list data to a compressed string
export const exportTierList = (players) => {
    try {
        // Create export data object
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            players: players.map(player => ({
                id: player.id,
                name: player.name,
                position: player.position,
                team: player.team,
                tier: player.tier,
                drafted: player.drafted,
                photo: player.photo,
                teamLogo: player.teamLogo,
                byeWeek: player.byeWeek
            }))
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(exportData);

        // Compress using LZ-string
        const compressed = LZString.compressToEncodedURIComponent(jsonString);

        return compressed;
    } catch (error) {
        console.error('Export failed:', error);
        throw new Error('Failed to export tier list');
    }
};

// Import tier list data from a compressed string
export const importTierList = (compressedString) => {
    try {
        // Decompress the string
        const jsonString = LZString.decompressFromEncodedURIComponent(compressedString);

        if (!jsonString) {
            throw new Error('Invalid import code');
        }

        // Parse the JSON
        const importData = JSON.parse(jsonString);

        // Validate the data structure
        if (!importData.version || !importData.players || !Array.isArray(importData.players)) {
            throw new Error('Invalid tier list format');
        }

        // Validate each player has required fields
        const validPlayers = importData.players.filter(player =>
            player.id && player.name && player.position && player.team &&
            typeof player.tier === 'number' && typeof player.drafted === 'boolean'
        );

        if (validPlayers.length === 0) {
            throw new Error('No valid players found in import');
        }

        return validPlayers;
    } catch (error) {
        console.error('Import failed:', error);
        throw new Error('Failed to import tier list: ' + error.message);
    }
};

// Validate import code without importing
export const validateImportCode = (compressedString) => {
    try {
        const jsonString = LZString.decompressFromEncodedURIComponent(compressedString);
        if (!jsonString) return false;

        const importData = JSON.parse(jsonString);
        return importData.version && importData.players && Array.isArray(importData.players);
    } catch (error) {
        return false;
    }
};

// Get import info (player count, timestamp, etc.)
export const getImportInfo = (compressedString) => {
    try {
        const jsonString = LZString.decompressFromEncodedURIComponent(compressedString);
        if (!jsonString) return null;

        const importData = JSON.parse(jsonString);
        return {
            playerCount: importData.players?.length || 0,
            timestamp: importData.timestamp,
            version: importData.version
        };
    } catch (error) {
        return null;
    }
}; 