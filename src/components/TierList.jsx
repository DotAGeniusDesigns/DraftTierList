import React, { useEffect, useMemo } from 'react';
import Tier from './Tier';
import { getTierNames } from '../utils/tierNames';

// Scroll the window when a drag is held near the top or bottom edge of the
// viewport, so a player can be dropped into a tier that isn't on screen.
//
// Two drag pipelines feed it. Touch: Player.jsx locks touchAction to 'none'
// so the browser's scroll gesture doesn't hijack the drag, which means the
// page can't scroll at all without this — positions come from the custom
// playerDrag* events Tier.jsx also listens to. Mouse: native HTML5 drags
// don't reliably auto-scroll the window (and never did here), so document
// `dragover` feeds the same loop. In both cases the rAF loop keeps scrolling
// while the pointer holds still inside the edge zone, because `dragover`
// only re-fires on movement.
const EDGE_ZONE_PX = 72;
const MAX_SCROLL_SPEED = 16;

function useDragAutoScroll() {
    useEffect(() => {
        let rafId = null;
        let scrollSpeed = 0;

        const tick = () => {
            if (scrollSpeed !== 0) {
                window.scrollBy(0, scrollSpeed);
            }
            rafId = window.requestAnimationFrame(tick);
        };

        const ensureLoop = () => {
            if (rafId === null) rafId = window.requestAnimationFrame(tick);
        };

        const updateSpeed = (clientY) => {
            if (typeof clientY !== 'number') return;

            if (clientY < EDGE_ZONE_PX) {
                scrollSpeed = -Math.ceil(((EDGE_ZONE_PX - clientY) / EDGE_ZONE_PX) * MAX_SCROLL_SPEED);
            } else if (clientY > window.innerHeight - EDGE_ZONE_PX) {
                scrollSpeed = Math.ceil(((clientY - (window.innerHeight - EDGE_ZONE_PX)) / EDGE_ZONE_PX) * MAX_SCROLL_SPEED);
            } else {
                scrollSpeed = 0;
            }
        };

        const handleTouchDragMove = (e) => {
            updateSpeed((e.detail || {}).clientY);
        };

        const handleNativeDragOver = (e) => {
            ensureLoop();
            updateSpeed(e.clientY);
        };

        const stop = () => {
            scrollSpeed = 0;
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        document.addEventListener('playerDragStart', ensureLoop);
        document.addEventListener('playerDragMove', handleTouchDragMove);
        document.addEventListener('playerDragEnd', stop);
        document.addEventListener('dragover', handleNativeDragOver);
        document.addEventListener('drop', stop);
        document.addEventListener('dragend', stop);

        return () => {
            document.removeEventListener('playerDragStart', ensureLoop);
            document.removeEventListener('playerDragMove', handleTouchDragMove);
            document.removeEventListener('playerDragEnd', stop);
            document.removeEventListener('dragover', handleNativeDragOver);
            document.removeEventListener('drop', stop);
            document.removeEventListener('dragend', stop);
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
    onToggleFavorite,
    onToggleDND,
    onRemoveTier,
    onRenameTier,
    darkMode,
    tierNamesVersion = 0,
    focusPlayerId = null,
}) => {
    useDragAutoScroll();

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
                        onToggleFavorite={onToggleFavorite}
                        onToggleDND={onToggleDND}
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
