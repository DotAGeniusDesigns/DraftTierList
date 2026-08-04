import { act, renderHook } from '@testing-library/react';
import { fetchDraft, fetchDraftPicks } from '../utils/sleeperSync';
import { useSleeperDraftSync } from './useSleeperDraftSync';

jest.mock('../utils/sleeperSync', () => ({
    fetchDraft: jest.fn(),
    fetchDraftPicks: jest.fn(),
}));

const setVisibility = (value) => {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value,
    });
};

const flushPromises = async () => {
    await act(async () => {
        await Promise.resolve();
    });
};

describe('useSleeperDraftSync', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        setVisibility('visible');
        fetchDraft.mockResolvedValue({});
        fetchDraftPicks.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('keeps the visible cadence anchored to poll start time', async () => {
        let resolveFirstPoll;
        fetchDraftPicks
            .mockImplementationOnce(() => new Promise((resolve) => {
                resolveFirstPoll = resolve;
            }))
            .mockResolvedValue([]);

        renderHook(() => useSleeperDraftSync({
            draftId: 'draft-1',
            enabled: true,
            intervalMs: 1500,
            hiddenIntervalMs: 10_000,
            onPicks: jest.fn(),
        }));

        expect(fetchDraftPicks).toHaveBeenCalledTimes(1);
        act(() => {
            jest.advanceTimersByTime(400);
        });
        await act(async () => {
            resolveFirstPoll([]);
            await Promise.resolve();
        });

        act(() => {
            jest.advanceTimersByTime(1099);
        });
        expect(fetchDraftPicks).toHaveBeenCalledTimes(1);

        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(fetchDraftPicks).toHaveBeenCalledTimes(2);
    });

    it('slows while hidden and polls immediately when visible again', async () => {
        renderHook(() => useSleeperDraftSync({
            draftId: 'draft-1',
            enabled: true,
            intervalMs: 1500,
            hiddenIntervalMs: 10_000,
            onPicks: jest.fn(),
        }));
        await flushPromises();

        setVisibility('hidden');
        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
            jest.advanceTimersByTime(2000);
        });
        expect(fetchDraftPicks).toHaveBeenCalledTimes(1);

        setVisibility('visible');
        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
            jest.advanceTimersByTime(0);
        });
        expect(fetchDraftPicks).toHaveBeenCalledTimes(2);
    });

    it('retries the first transient failure after three seconds', async () => {
        fetchDraftPicks
            .mockRejectedValueOnce(new Error('temporary failure'))
            .mockResolvedValue([]);

        renderHook(() => useSleeperDraftSync({
            draftId: 'draft-1',
            enabled: true,
            intervalMs: 1500,
            onPicks: jest.fn(),
        }));
        await flushPromises();

        act(() => {
            jest.advanceTimersByTime(2999);
        });
        expect(fetchDraftPicks).toHaveBeenCalledTimes(1);

        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(fetchDraftPicks).toHaveBeenCalledTimes(2);
    });

    it('aborts in-flight requests and timers on teardown', () => {
        let requestSignal;
        fetchDraftPicks.mockImplementation((draftId, options) => {
            requestSignal = options.signal;
            return new Promise(() => {});
        });

        const { unmount } = renderHook(() => useSleeperDraftSync({
            draftId: 'draft-1',
            enabled: true,
            onPicks: jest.fn(),
        }));

        expect(requestSignal.aborted).toBe(false);
        unmount();
        expect(requestSignal.aborted).toBe(true);

        act(() => {
            jest.runOnlyPendingTimers();
        });
        expect(fetchDraftPicks).toHaveBeenCalledTimes(1);
    });
});
