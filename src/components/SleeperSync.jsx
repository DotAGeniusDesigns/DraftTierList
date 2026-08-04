import React, {
    useCallback, useMemo, useRef, useState,
} from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSleeperDraftSync } from '../hooks/useSleeperDraftSync';
import { buildPlayerIndex, describePick, matchPick, parseDraftId } from '../utils/sleeperSync';
import { ui } from '../utils/uiTheme';

const STATUS_META = {
    idle: { dot: 'bg-slate-400', label: 'Not connected' },
    connecting: { dot: 'bg-amber-400 animate-pulse', label: 'Connecting...' },
    live: { dot: 'bg-emerald-500 animate-pulse', label: 'Live' },
    error: { dot: 'bg-rose-500', label: 'Reconnecting' },
};

const formatAgo = (timestamp) => {
    if (!timestamp) return null;
    const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.round(seconds / 60)}m ago`;
};

const pickSignature = (picks) => picks.map((pick, index) => [
    pick.pick_no ?? index,
    pick.player_id ?? '',
    pick.metadata?.first_name ?? '',
    pick.metadata?.last_name ?? '',
    pick.metadata?.position ?? '',
    pick.metadata?.team ?? '',
].join(':')).join('|');

const SleeperSync = ({ players, darkMode, onMarkDrafted }) => {
    // Persisted so a refresh mid-draft reconnects instead of losing the session.
    const [draftId, setDraftId] = useLocalStorage('sleeper-draft-id', '');
    const [enabled, setEnabled] = useLocalStorage('sleeper-sync-enabled', false);

    const [input, setInput] = useState(draftId);
    const [expanded, setExpanded] = useState(false);
    const [inputError, setInputError] = useState(null);
    const [matchedCount, setMatchedCount] = useState(0);
    const [unmatched, setUnmatched] = useState([]);

    // Drafted/tier/flag changes do not affect matching. Keeping the index stable
    // lets unchanged Sleeper payloads reuse their previous matching result.
    const playerIdentityKey = useMemo(
        () => players.map((player) => [
            player.id,
            player.name,
            player.position,
            player.team,
            player.photo,
        ].join(':')).join('|'),
        [players],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const index = useMemo(() => buildPlayerIndex(players), [playerIdentityKey]);
    const matchCacheRef = useRef({
        index: null,
        signature: null,
        matched: [],
        missed: [],
    });

    // Compared against each poll so that "Reset drafted" re-applies cleanly on
    // the next tick rather than the sync going permanently quiet.
    const draftedIds = useMemo(
        () => new Set(players.filter((player) => player.drafted).map((player) => player.id)),
        [players],
    );

    const handlePicks = useCallback((picks) => {
        const signature = pickSignature(picks);
        let { matched, missed } = matchCacheRef.current;

        if (
            matchCacheRef.current.index !== index
            || matchCacheRef.current.signature !== signature
        ) {
            matched = [];
            missed = [];

            picks.forEach((pick) => {
                const playerId = matchPick(pick, index);
                if (playerId) {
                    matched.push(playerId);
                } else {
                    missed.push(describePick(pick));
                }
            });

            matchCacheRef.current = {
                index,
                signature,
                matched,
                missed,
            };
        }

        setMatchedCount((previous) => (
            previous === matched.length ? previous : matched.length
        ));
        setUnmatched((prev) => {
            const unchanged =
                prev.length === missed.length && prev.every((value, i) => value === missed[i]);
            return unchanged ? prev : missed;
        });

        // Only ever adds. Players marked drafted by hand are never un-marked,
        // and writes are skipped entirely when nothing new has been picked.
        const fresh = matched.filter((playerId) => !draftedIds.has(playerId));
        if (fresh.length > 0) onMarkDrafted(fresh);
    }, [index, draftedIds, onMarkDrafted]);

    const { status, error, draft, lastSyncedAt } = useSleeperDraftSync({
        draftId: enabled ? draftId : null,
        enabled,
        intervalMs: 1500,
        hiddenIntervalMs: 10_000,
        onPicks: handlePicks,
    });

    const handleConnect = () => {
        const parsed = parseDraftId(input);
        if (!parsed) {
            setInputError('Paste a Sleeper draft link (sleeper.com/draft/nfl/...) or the numeric draft ID.');
            return;
        }

        setInputError(null);
        setDraftId(parsed);
        setEnabled(true);
        setExpanded(false);
    };

    const handleDisconnect = () => {
        setEnabled(false);
        setMatchedCount(0);
        setUnmatched([]);
    };

    const meta = STATUS_META[status] || STATUS_META.idle;
    const ago = formatAgo(lastSyncedAt);

    const inputClass = darkMode
        ? 'border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-emerald-500/30'
        : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-500/20';

    return (
        <div className={`${ui.card(darkMode)} mb-5 p-3 sm:p-4`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />

                <span className={`text-sm font-semibold ${ui.heading(darkMode)}`}>
                    Sleeper live sync
                </span>

                {enabled ? (
                    <span className={`text-xs sm:text-sm ${ui.muted(darkMode)}`}>
                        {meta.label}
                        {matchedCount > 0 && ` · ${matchedCount} pick${matchedCount === 1 ? '' : 's'} synced`}
                        {ago && ` · ${ago}`}
                    </span>
                ) : (
                    <span className={`text-xs sm:text-sm ${ui.muted(darkMode)}`}>
                        Auto-check players as they're drafted
                    </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                    {enabled ? (
                        <button type="button" onClick={handleDisconnect} className={ui.btn(darkMode)}>
                            Disconnect
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setExpanded((value) => !value)}
                            className={ui.btnPrimary()}
                        >
                            {expanded ? 'Cancel' : 'Connect'}
                        </button>
                    )}
                </div>
            </div>

            {enabled && draft?.metadata?.name && (
                <p className={`mt-2 text-xs ${ui.muted(darkMode)}`}>
                    {draft.metadata.name}
                    {draft.settings?.teams && ` · ${draft.settings.teams} teams`}
                    {draft.settings?.rounds && ` · ${draft.settings.rounds} rounds`}
                </p>
            )}

            {enabled && status === 'error' && error && (
                <p className={`mt-2 text-xs font-medium ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}>
                    {error}
                </p>
            )}

            {enabled && unmatched.length > 0 && (
                <div className={`mt-3 p-3 ${ui.cardInset(darkMode)}`}>
                    <p className={`text-xs font-semibold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                        {unmatched.length} pick{unmatched.length === 1 ? '' : 's'} not on your board — mark
                        {unmatched.length === 1 ? ' it' : ' them'} by hand if you need to:
                    </p>
                    <p className={`mt-1 text-xs leading-relaxed ${ui.muted(darkMode)}`}>
                        {unmatched.join(', ')}
                    </p>
                </div>
            )}

            {!enabled && expanded && (
                <div className="mt-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            type="text"
                            value={input}
                            onChange={(event) => {
                                setInput(event.target.value);
                                setInputError(null);
                            }}
                            onKeyDown={(event) => event.key === 'Enter' && handleConnect()}
                            placeholder="https://sleeper.com/draft/nfl/123456789012345678"
                            aria-label="Sleeper draft link or ID"
                            className={`w-full rounded-xl border px-3.5 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 ${inputClass}`}
                        />
                        <button type="button" onClick={handleConnect} className={`${ui.btnPrimary()} shrink-0`}>
                            Start syncing
                        </button>
                    </div>

                    {inputError ? (
                        <p className={`mt-2 text-xs font-medium ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}>
                            {inputError}
                        </p>
                    ) : (
                        <p className={`mt-2 text-xs ${ui.muted(darkMode)}`}>
                            Open your draft on Sleeper and paste the address bar here. Works with mock drafts
                            too. Picks only ever get checked off — nothing you've marked is undone.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default SleeperSync;
