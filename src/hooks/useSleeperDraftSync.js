import { useEffect, useRef, useState } from 'react';
import { fetchDraft, fetchDraftPicks } from '../utils/sleeperSync';

const MAX_ERROR_BACKOFF_MS = 15_000;
const DEFAULT_HIDDEN_INTERVAL_MS = 10_000;

// Polls a Sleeper draft for picks while `enabled` is true.
//
// A self-scheduling timeout is used instead of setInterval so a slow response
// can never stack requests on top of each other. Successful polls are scheduled
// from the start of the previous cycle, so request time no longer gets added to
// the target cadence.
export const useSleeperDraftSync = ({
    draftId,
    enabled,
    intervalMs = 1500,
    hiddenIntervalMs = DEFAULT_HIDDEN_INTERVAL_MS,
    onPicks,
}) => {
    const [status, setStatus] = useState('idle'); // idle | connecting | live | error
    const [error, setError] = useState(null);
    const [draft, setDraft] = useState(null);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);

    // Held in a ref so a new callback identity each render doesn't restart the
    // poll loop and drop us back to "connecting" mid-draft.
    const onPicksRef = useRef(onPicks);
    useEffect(() => {
        onPicksRef.current = onPicks;
    }, [onPicks]);

    useEffect(() => {
        if (!enabled || !draftId) {
            setStatus('idle');
            setError(null);
            setDraft(null);
            setLastSyncedAt(null);
            return undefined;
        }

        let cancelled = false;
        let timer = null;
        let inFlight = false;
        let immediateAfterFlight = false;
        let errorStreak = 0;
        const controller = new AbortController();

        setStatus('connecting');
        setError(null);

        // Draft settings don't change once it's underway — fetched once, and a
        // failure here is non-fatal since picks are what actually matter.
        fetchDraft(draftId, { signal: controller.signal })
            .then((meta) => {
                if (!cancelled) setDraft(meta);
            })
            .catch(() => {});

        const visibleInterval = () => (
            document.visibilityState === 'hidden' ? hiddenIntervalMs : intervalMs
        );

        const schedule = (delay) => {
            if (cancelled) return;
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(poll, Math.max(0, delay));
        };

        const poll = async () => {
            if (cancelled) return;
            if (inFlight) {
                immediateAfterFlight = true;
                return;
            }

            inFlight = true;
            timer = null;
            const cycleStartedAt = Date.now();
            let delay;

            try {
                const picks = await fetchDraftPicks(draftId, { signal: controller.signal });
                if (cancelled) return;

                errorStreak = 0;
                setStatus('live');
                setError(null);
                setLastSyncedAt(Date.now());
                onPicksRef.current?.(picks);
                delay = visibleInterval() - (Date.now() - cycleStartedAt);
            } catch (err) {
                if (cancelled || err.name === 'AbortError') return;

                // A single network blip should not create the old nine-second
                // blind spot. Backoff grows only for consecutive failures.
                errorStreak += 1;
                setStatus('error');
                setError(err.message);
                delay = Math.max(
                    visibleInterval(),
                    Math.min(intervalMs * (2 ** errorStreak), MAX_ERROR_BACKOFF_MS),
                );
            } finally {
                inFlight = false;

                if (!cancelled) {
                    if (immediateAfterFlight) {
                        immediateAfterFlight = false;
                        schedule(0);
                    } else if (delay !== undefined) {
                        schedule(delay);
                    }
                }
            }
        };

        const requestImmediatePoll = () => {
            if (cancelled) return;
            if (inFlight) {
                immediateAfterFlight = true;
                return;
            }
            schedule(0);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestImmediatePoll();
            } else if (!inFlight) {
                schedule(hiddenIntervalMs);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', requestImmediatePoll);
        window.addEventListener('online', requestImmediatePoll);
        poll();

        return () => {
            cancelled = true;
            controller.abort();
            if (timer) window.clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', requestImmediatePoll);
            window.removeEventListener('online', requestImmediatePoll);
        };
    }, [draftId, enabled, hiddenIntervalMs, intervalMs]);

    return { status, error, draft, lastSyncedAt };
};
