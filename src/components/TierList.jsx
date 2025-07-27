import React from 'react';
import Tier from './Tier';

const TierList = ({ players, onUpdatePlayers, onToggleDraft, onRemoveTier, darkMode }) => {
    // Group players by tier
    const playersByTier = players.reduce((acc, player) => {
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

    // Calculate starting rank for each tier (cumulative)
    let cumulativeRank = 1;
    const tierRanks = {};
    tierNumbers.forEach(tierNumber => {
        tierRanks[tierNumber] = cumulativeRank;
        console.log(`Tier ${tierNumber}: startingRank = ${cumulativeRank}, players = ${playersByTier[tierNumber].length}`);
        cumulativeRank += playersByTier[tierNumber].length;
    });

    const handleMovePlayer = (playerId, newTier, targetIndex = null) => {
        console.log('Moving player:', playerId, 'to tier:', newTier, 'at index:', targetIndex);

        // Find the player being moved
        const playerToMove = players.find(p => p.id === playerId);
        if (!playerToMove) return;

        // Remove the player from the current position
        let updatedPlayers = players.filter(p => p.id !== playerId);

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
            {tierNumbers.map(tierNumber => (
                <Tier
                    key={tierNumber}
                    tierNumber={tierNumber}
                    players={playersByTier[tierNumber]}
                    onToggleDraft={onToggleDraft}
                    onRemoveTier={onRemoveTier}
                    onMovePlayer={handleMovePlayer}
                    startingRank={tierRanks[tierNumber]}
                    darkMode={darkMode}
                />
            ))}
        </div>
    );
};

export default TierList; 