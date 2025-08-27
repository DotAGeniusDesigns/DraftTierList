import React from 'react';
import Tier from './Tier';

const TierList = ({ players, allPlayers, onUpdatePlayers, onToggleDraft, onToggleRisky, onRemoveTier, darkMode }) => {
    // Group players by tier (use allPlayers for ranking calculation)
    const playersByTier = allPlayers.reduce((acc, player) => {
        if (!acc[player.tier]) {
            acc[player.tier] = [];
        }
        acc[player.tier].push(player);
        return acc;
    }, {});

    // Get all tier numbers and sort them
    const tierNumbers = Object.keys(playersByTier)
        .map(Number)
        .sort((a, b) => a - b);

    // Calculate starting rank for each tier (cumulative) - using allPlayers
    let cumulativeRank = 1;
    const tierRanks = {};
    tierNumbers.forEach(tierNumber => {
        tierRanks[tierNumber] = cumulativeRank;
        console.log(`Tier ${tierNumber}: startingRank = ${cumulativeRank}, players = ${playersByTier[tierNumber].length}`);
        cumulativeRank += playersByTier[tierNumber].length;
    });

    // Create a set of filtered player IDs for quick lookup
    const filteredPlayerIds = new Set(players.map(p => p.id));

    const handleMovePlayer = (playerId, newTier, targetIndex = null) => {
        console.log('Moving player:', playerId, 'to tier:', newTier, 'at index:', targetIndex);

        // Find the player being moved in the current players state (preserves custom order)
        const playerToMove = players.find(p => p.id === playerId);
        if (!playerToMove) return;

        // Create a copy of the current players array to preserve order
        let updatedPlayers = [...players];

        // Find the current position of the player
        const currentIndex = updatedPlayers.findIndex(p => p.id === playerId);
        if (currentIndex === -1) return;

        // Remove the player from their current position
        updatedPlayers.splice(currentIndex, 1);

        // Find where to insert the player in the target tier
        let insertIndex = 0;

        // If targetIndex is provided, calculate the actual insert position
        if (targetIndex !== null && targetIndex !== undefined) {
            // Find the first player in the target tier
            const firstTargetTierIndex = updatedPlayers.findIndex(p => p.tier === newTier);
            if (firstTargetTierIndex !== -1) {
                insertIndex = firstTargetTierIndex + targetIndex;
            } else {
                // If no players in target tier, insert at the end
                insertIndex = updatedPlayers.length;
            }
        } else {
            // Find the last player in the target tier
            const lastTargetTierIndex = updatedPlayers.findLastIndex(p => p.tier === newTier);
            if (lastTargetTierIndex !== -1) {
                insertIndex = lastTargetTierIndex + 1;
            } else {
                // If no players in target tier, insert at the end
                insertIndex = updatedPlayers.length;
            }
        }

        // Insert the player at the calculated position
        updatedPlayers.splice(insertIndex, 0, { ...playerToMove, tier: newTier });

        console.log('Updated players (preserving order):', updatedPlayers);
        onUpdatePlayers(updatedPlayers);
    };

    return (
        <div className="space-y-8">
            {/* Tiers */}
            {tierNumbers.map(tierNumber => {
                // Get all players in this tier (unfiltered)
                const allTierPlayers = playersByTier[tierNumber];

                // Filter players in this tier to only show filtered players
                const tierPlayers = allTierPlayers.filter(player =>
                    filteredPlayerIds.has(player.id)
                );

                // Only render tier if it has visible players
                if (tierPlayers.length === 0) return null;

                return (
                    <Tier
                        key={tierNumber}
                        tierNumber={tierNumber}
                        players={tierPlayers}
                        allTierPlayers={allTierPlayers}
                        onToggleDraft={onToggleDraft}
                        onToggleRisky={onToggleRisky}
                        onRemoveTier={onRemoveTier}
                        onMovePlayer={handleMovePlayer}
                        startingRank={tierRanks[tierNumber]}
                        darkMode={darkMode}
                    />
                );
            })}
        </div>
    );
};

export default TierList; 