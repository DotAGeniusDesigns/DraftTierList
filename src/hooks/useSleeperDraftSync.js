import { useEffect, useRef, useState } from 'react';
import { fetchDraft, fetchDraftPicks } from '../utils/sleeperSync';

const ERROR_BACKOFF_MULTIPLIER = 3;

// Polls a Sleeper draft for picks while `enabled` is true.
//
// A self-scheduling timeout is used instead of setInterval so a slow response
// can never stack requests on top of each other, and every in-flight fetch is
// aborted on teardown.
export const useSleeperDraftSync = ({ draftId, enabled, intervalMs = 3000, onPicks }) => {
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

        const poll = async () => {
            let delay = intervalMs;

            try {
                const picks = await fetchDraftPicks(draftId, { signal: controller.signal });
                if (cancelled) return;

                setStatus('live');
                setError(null);
                setLastSyncedAt(Date.now());
                onPicksRef.current?.(picks);
            } catch (err) {
                if (cancelled || err.name === 'AbortError') return;

                // Keep polling through transient failures — a dropped request
                // mid-draft should recover on its own, just less eagerly.
                setStatus('error');
                setError(err.message);
                delay = intervalMs * ERROR_BACKOFF_MULTIPLIER;
            }

            if (!cancelled) {
                timer = window.setTimeout(poll, delay);
            }
        };

        poll();

        return () => {
            cancelled = true;
            controller.abort();
            if (timer) window.clearTimeout(timer);
        };
    }, [draftId, enabled, intervalMs]);

    return { status, error, draft, lastSyncedAt };
};
