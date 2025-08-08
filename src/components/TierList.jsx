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