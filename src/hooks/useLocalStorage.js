import { useState, useEffect, useCallback } from 'react';

// Custom hook for localStorage with error handling
export const useLocalStorage = (key, initialValue) => {
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

    // Stable setter (same API as useState) that persists to localStorage.
    // Using the functional updater form keeps the identity stable across
    // renders so consumers can memoize handlers without stale-closure bugs.
    const setValue = useCallback((value) => {
        setStoredValue(prev => {
            const valueToStore = value instanceof Function ? value(prev) : value;
            try {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
            return valueToStore;
        });
    }, [key]);

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