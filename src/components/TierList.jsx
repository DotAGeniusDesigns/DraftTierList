import React from 'react';
import Tier from './Tier';

const TierList = ({ players, allPlayers, onUpdatePlayers, onToggleDraft, onToggleRisky, onRemoveTier, onAddTier, onRenameTier, darkMode }) => {
    // Group players by tier (use allPlayers for ranking calculation)
    const playersByTier = allPlayers.reduce((acc, player) => {
        if (!acc[player.tier]) {
            acc[player.tier] = [];
        }
        acc[player.tier].push(player);
        return acc;
    }, {});

    // Get all tier numbers from players and from localStorage tier names
    const tierNames = JSON.parse(localStorage.getItem('fantasy-football-tier-names') || '{}');
    const tiersFromNames = Object.keys(tierNames).map(Number);
    const tiersFromPlayers = Object.keys(playersByTier).map(Number);

    // Combine both sets and remove duplicates
    const allTierNumbers = [...new Set([...tiersFromNames, ...tiersFromPlayers])];
    const tierNumbers = allTierNumbers.sort((a, b) => a - b);

    // Calculate starting rank for each tier (cumulative) - using allPlayers
    let cumulativeRank = 1;
    const tierRanks = {};
    tierNumbers.forEach(tierNumber => {
        tierRanks[tierNumber] = cumulativeRank;
        const playerCount = playersByTier[tierNumber] ? playersByTier[tierNumber].length : 0;
        console.log(`Tier ${tierNumber}: startingRank = ${cumulativeRank}, players = ${playerCount}`);
        cumulativeRank += playerCount;
    });

    // Create a set of filtered player IDs for quick lookup
    const filteredPlayerIds = new Set(players.map(p => p.id));

    const handleMovePlayer = (playerId, newTier, targetIndex = null) => {
        console.log('Moving player:', playerId, 'to tier:', newTier, 'at index:', targetIndex);

        // Find the player being moved
        const playerToMove = allPlayers.find(p => p.id === playerId);
        if (!playerToMove) return;

        // Remove the player from the current position
        let updatedPlayers = allPlayers.filter(p => p.id !== playerId);

        // Get players in the target tier
        const targetTierPlayers = updatedPlayers.filter(p => p.tier === newTier);

        // If targetIndex is provided, insert at that position
        if (targetIndex !== null && targetIndex !== undefined) {
            targetTierPlayers.splice(targetIndex, 0, { ...playerToMove, tier: newTier });
        } else {
            // Otherwise, add to the end of the tier
            targetTierPlayers.push({ ...playerToMove, tier: newTier });
        }

        // Get all other players (not in target tier)
        const otherPlayers = updatedPlayers.filter(p => p.tier !== newTier);

        // Combine all players
        updatedPlayers = [...otherPlayers, ...targetTierPlayers];

        console.log('Updated players:', updatedPlayers);
        onUpdatePlayers(updatedPlayers);
    };

    return (
        <div className="space-y-8">
            {/* Tiers */}
            {tierNumbers.map(tierNumber => {
                // Get all players in this tier (unfiltered) - handle case where tier might not exist yet
                const allTierPlayers = playersByTier[tierNumber] || [];

                // Filter players in this tier to only show filtered players
                const tierPlayers = allTierPlayers.filter(player =>
                    filteredPlayerIds.has(player.id)
                );

                // Always render tier even if it has no visible players
                // This allows empty tiers to be visible and manageable

                return (
                    <Tier
                        key={tierNumber}
                        tierNumber={tierNumber}
                        players={tierPlayers}
                        allTierPlayers={allTierPlayers}
                        onToggleDraft={onToggleDraft}
                        onToggleRisky={onToggleRisky}
                        onRemoveTier={onRemoveTier}
                        onAddTier={onAddTier}
                        onRenameTier={onRenameTier}
                        onMovePlayer={handleMovePlayer}
                        startingRank={tierRanks[tierNumber] || 1}
                        darkMode={darkMode}
                    />
                );
            })}
        </div>
    );
};

export default TierList; 