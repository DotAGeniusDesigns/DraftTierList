import React, { useEffect, useMemo } from 'react';
import Tier from './Tier';
import { getTierNames } from '../utils/tierNames';

// While a touch-drag is active, Player.jsx locks touchAction to 'none' so the
// browser's native scroll gesture doesn't hijack the drag — which means
// without this, a phone screen (showing ~1-2 tiers at a time) makes it
// impossible to drag a player into a tier that isn't already on screen.
// This nudges the window on our own via rAF whenever the touch point nears
// the top/bottom edge, using the same custom playerDrag* events Tier.jsx
// listens to for drop-index tracking.
const EDGE_ZONE_PX = 72;
const MAX_SCROLL_SPEED = 16;

function useTouchDragAutoScroll() {
    useEffect(() => {
        let rafId = null;
        let scrollSpeed = 0;

        const tick = () => {
            if (scrollSpeed !== 0) {
                window.scrollBy(0, scrollSpeed);
            }
            rafId = window.requestAnimationFrame(tick);
        };

        const handleDragStart = () => {
            if (rafId === null) rafId = window.requestAnimationFrame(tick);
        };

        const handleDragMove = (e) => {
            const { clientY } = e.detail || {};
            if (typeof clientY !== 'number') return;

            if (clientY < EDGE_ZONE_PX) {
                scrollSpeed = -Math.ceil(((EDGE_ZONE_PX - clientY) / EDGE_ZONE_PX) * MAX_SCROLL_SPEED);
            } else if (clientY > window.innerHeight - EDGE_ZONE_PX) {
                scrollSpeed = Math.ceil(((clientY - (window.innerHeight - EDGE_ZONE_PX)) / EDGE_ZONE_PX) * MAX_SCROLL_SPEED);
            } else {
                scrollSpeed = 0;
            }
        };

        const stop = () => {
            scrollSpeed = 0;
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        document.addEventListener('playerDragStart', handleDragStart);
        document.addEventListener('playerDragMove', handleDragMove);
        document.addEventListener('playerDragEnd', stop);

        return () => {
            document.removeEventListener('playerDragStart', handleDragStart);
            document.removeEventListener('playerDragMove', handleDragMove);
            document.removeEventListener('playerDragEnd', stop);
            stop();
        };
    }, []);
}

const TierList = ({
    players,
    allPlayers,
    onMovePlayer,
    onToggleDraft,
    onToggleRisky,
    onToggleUpside,
    onToggleHandcuff,
    onRemoveTier,
    onRenameTier,
    darkMode,
    tierNamesVersion = 0,
    focusPlayerId = null,
}) => {
    useTouchDragAutoScroll();

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
        <div className="space-y-5 sm:space-y-6">
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
                        onToggleUpside={onToggleUpside}
                        onToggleHandcuff={onToggleHandcuff}
                        onRemoveTier={onRemoveTier}
                        onRenameTier={onRenameTier}
                        onMovePlayer={onMovePlayer}
                        startingRank={tierRanks[tierNumber] || 1}
                        focusPlayerId={focusPlayerId}
                        darkMode={darkMode}
                        tierNamesVersion={tierNamesVersion}
                    />
                );
            })}
        </div>
    );
};

export default TierList;
