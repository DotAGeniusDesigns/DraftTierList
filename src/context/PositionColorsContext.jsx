import React, {
    createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import {
    DEFAULT_POSITION_COLORS,
    POSITION_COLORS_UPDATED_EVENT,
    getPositionColors,
    savePositionColor,
    resetPositionColors,
} from '../utils/positionColors';

// Position badge colors live in localStorage (see utils/positionColors.js)
// so the picker modal and every badge-rendering component (Player, draft
// board grid, offseason hub, filter dropdown) stay in sync without prop
// drilling a colors map through routes that don't otherwise share state.
const PositionColorsContext = createContext(null);

export const PositionColorsProvider = ({ children }) => {
    const [colors, setColors] = useState(getPositionColors);

    useEffect(() => {
        const sync = () => setColors(getPositionColors());
        window.addEventListener(POSITION_COLORS_UPDATED_EVENT, sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener(POSITION_COLORS_UPDATED_EVENT, sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const setColor = useCallback((position, hex) => {
        savePositionColor(position, hex);
    }, []);

    const resetColors = useCallback(() => {
        resetPositionColors();
    }, []);

    const value = useMemo(() => ({ colors, setColor, resetColors }), [colors, setColor, resetColors]);

    return (
        <PositionColorsContext.Provider value={value}>
            {children}
        </PositionColorsContext.Provider>
    );
};

export const usePositionColors = () => {
    const context = useContext(PositionColorsContext);
    // Falls back gracefully for anything rendered outside the provider
    // (unlikely, but cheaper than a hard crash for a cosmetic feature).
    return context || { colors: DEFAULT_POSITION_COLORS, setColor: () => {}, resetColors: () => {} };
};
