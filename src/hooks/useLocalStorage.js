import {
    useState, useEffect, useCallback, useRef,
} from 'react';

const NO_PENDING_VALUE = Symbol('no-pending-local-storage-value');

// Custom hook for localStorage with error handling
export const useLocalStorage = (key, initialValue, { writeDelayMs = 0 } = {}) => {
    const pendingValueRef = useRef(NO_PENDING_VALUE);
    const writeTimerRef = useRef(null);

    // Get from local storage then parse stored json or return initialValue
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const persistValue = useCallback((value) => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key]);

    const flushPendingValue = useCallback(() => {
        if (writeTimerRef.current) {
            window.clearTimeout(writeTimerRef.current);
            writeTimerRef.current = null;
        }
        if (pendingValueRef.current === NO_PENDING_VALUE) return;

        persistValue(pendingValueRef.current);
        pendingValueRef.current = NO_PENDING_VALUE;
    }, [persistValue]);

    const schedulePersistence = useCallback((value) => {
        if (writeDelayMs <= 0) {
            persistValue(value);
            return;
        }

        pendingValueRef.current = value;
        if (writeTimerRef.current) window.clearTimeout(writeTimerRef.current);
        writeTimerRef.current = window.setTimeout(flushPendingValue, writeDelayMs);
    }, [flushPendingValue, persistValue, writeDelayMs]);

    // Stable setter (same API as useState) that persists to localStorage.
    // Using the functional updater form keeps the identity stable across
    // renders so consumers can memoize handlers without stale-closure bugs.
    const setValue = useCallback((value) => {
        setStoredValue(prev => {
            const valueToStore = value instanceof Function ? value(prev) : value;
            schedulePersistence(valueToStore);
            return valueToStore;
        });
    }, [schedulePersistence]);

    // Debounced board writes still need to survive tab switches, navigation,
    // refreshes and mobile browser suspension.
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flushPendingValue();
        };

        window.addEventListener('pagehide', flushPendingValue);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('pagehide', flushPendingValue);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            flushPendingValue();
        };
    }, [flushPendingValue]);

    // Sync with localStorage changes from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.error(`Error parsing localStorage value for key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue];
}; 