import React, { useMemo } from 'react';
import Tier from './Tier';
import { getTierNames } from '../utils/tierNames';

const TierList = ({
    players,
    allPlayers,
    onMovePlayer,
    onToggleDraft,
    onToggleRisky,
    onToggleInjured,
    onToggleHandcuff,
    onRemoveTier,
    onRenameTier,
    darkMode,
    tierNamesVersion = 0,
}) => {
    const tierNames = useMemo(() => {
        void tierNamesVersion;
        return getTierNames();
    }, [tierNamesVersion]);

    const { playersByTier, tierNumbers, tierRanks, filteredPlayerIds } = useMemo(() => {
        const grouped = allPlayers.reduce((acc, player) => {
            if (!acc[player.tier]) {
                acc[player.tier] = [];
            }
            acc[player.tier].push(player);
            return acc;
        }, {});

        const tiersFromNames = Object.keys(tierNames).map(Number);
        const tiersFromPlayers = Object.keys(grouped).map(Number);
        const allTierNumbers = [...new Set([...tiersFromNames, ...tiersFromPlayers])];
        const sortedTiers = allTierNumbers.sort((a, b) => a - b);

        let cumulativeRank = 1;
        const ranks = {};
        sortedTiers.forEach(tierNumber => {
            ranks[tierNumber] = cumulativeRank;
            const playerCount = grouped[tierNumber] ? grouped[tierNumber].length : 0;
            cumulativeRank += playerCount;
        });

        return {
            playersByTier: grouped,
            tierNumbers: sortedTiers,
            tierRanks: ranks,
            filteredPlayerIds: new Set(players.map(p => p.id)),
        };
    }, [allPlayers, players, tierNames]);

    return (
        <div className="space-y-8">
            {tierNumbers.map(tierNumber => {
                const allTierPlayers = playersByTier[tierNumber] || [];
                const tierPlayers = allTierPlayers.filter(player =>
                    filteredPlayerIds.has(player.id)
                );

                return (
                    <Tier
                        key={tierNumber}
                        tierNumber={tierNumber}
                        players={tierPlayers}
                        allTierPlayers={allTierPlayers}
                        onToggleDraft={onToggleDraft}
                        onToggleRisky={onToggleRisky}
                        onToggleInjured={onToggleInjured}
                        onToggleHandcuff={onToggleHandcuff}
                        onRemoveTier={onRemoveTier}
                        onRenameTier={onRenameTier}
                        onMovePlayer={onMovePlayer}
                        startingRank={tierRanks[tierNumber] || 1}
                        darkMode={darkMode}
                        tierNamesVersion={tierNamesVersion}
                    />
                );
            })}
        </div>
    );
};

export default TierList;
