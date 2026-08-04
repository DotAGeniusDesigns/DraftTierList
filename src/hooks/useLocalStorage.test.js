import { act, renderHook } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

const setVisibility = (value) => {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value,
    });
};

describe('useLocalStorage delayed persistence', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.useFakeTimers();
        setVisibility('visible');
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('updates React state immediately and persists after the delay', () => {
        const { result } = renderHook(() => useLocalStorage(
            'board',
            [],
            { writeDelayMs: 300 },
        ));

        act(() => {
            result.current[1]([{ id: 'player-1' }]);
        });
        expect(result.current[0]).toEqual([{ id: 'player-1' }]);
        expect(localStorage.getItem('board')).toBeNull();

        act(() => {
            jest.advanceTimersByTime(299);
        });
        expect(localStorage.getItem('board')).toBeNull();

        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(JSON.parse(localStorage.getItem('board'))).toEqual([{ id: 'player-1' }]);
    });

    it('coalesces rapid updates into one write', () => {
        const setItem = jest.spyOn(Storage.prototype, 'setItem');
        const { result } = renderHook(() => useLocalStorage(
            'board',
            [],
            { writeDelayMs: 300 },
        ));

        act(() => {
            result.current[1]([{ id: 'player-1' }]);
            result.current[1]([{ id: 'player-2' }]);
            result.current[1]([{ id: 'player-3' }]);
        });
        act(() => {
            jest.advanceTimersByTime(300);
        });

        expect(setItem).toHaveBeenCalledTimes(1);
        expect(JSON.parse(localStorage.getItem('board'))).toEqual([{ id: 'player-3' }]);
        setItem.mockRestore();
    });

    it('flushes a pending write before a tab is suspended', () => {
        const { result } = renderHook(() => useLocalStorage(
            'board',
            [],
            { writeDelayMs: 300 },
        ));

        act(() => {
            result.current[1]([{ id: 'player-1' }]);
        });
        setVisibility('hidden');
        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });

        expect(JSON.parse(localStorage.getItem('board'))).toEqual([{ id: 'player-1' }]);
    });
});
