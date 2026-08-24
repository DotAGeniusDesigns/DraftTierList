import React, {
    createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import {
    DEFAULT_POSITION_COLORS,
    POSITION_COLORS_UPDATED_EVENT,
    getPositionColors,
    savePositionColor,
    resetPositionColors,
    getDraftKitColors,
    getDraftKitColorsLinked,
    saveDraftKitColor,
    resetDraftKitColors,
    setDraftKitColorsLinked,
} from '../utils/positionColors';

// Position badge colors live in localStorage (see utils/positionColors.js)
// so the picker modal and every badge-rendering component (Player, draft
// board grid, offseason hub, filter dropdown) stay in sync without prop
// drilling a colors map through routes that don't otherwise share state.
const PositionColorsContext = createContext(null);

export const PositionColorsProvider = ({ children }) => {
    const [colors, setColors] = useState(getPositionColors);
    // The Draft Kit can keep its own map. It shares the board's update event, so
    // one listener keeps both in sync — including across tabs via `storage`.
    const [kitColors, setKitColors] = useState(getDraftKitColors);
    const [kitLinked, setKitLinked] = useState(getDraftKitColorsLinked);

    useEffect(() => {
        const sync = () => {
            setColors(getPositionColors());
            setKitColors(getDraftKitColors());
            setKitLinked(getDraftKitColorsLinked());
        };
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

    const setKitColor = useCallback((position, hex) => {
        saveDraftKitColor(position, hex);
    }, []);

    const resetKitColors = useCallback(() => {
        resetDraftKitColors();
    }, []);

    const setLinked = useCallback((linked) => {
        setDraftKitColorsLinked(linked);
    }, []);

    const value = useMemo(() => ({
        colors,
        setColor,
        resetColors,
        kit: {
            // Linked is the default, and while linked the Draft Kit picker edits
            // the board's map directly — that is what makes "change it from
            // either page" true rather than two maps that happen to agree.
            colors: kitLinked ? colors : kitColors,
            setColor: kitLinked ? setColor : setKitColor,
            resetColors: kitLinked ? resetColors : resetKitColors,
            linked: kitLinked,
            setLinked,
        },
    }), [colors, setColor, resetColors, kitColors, kitLinked, setKitColor, resetKitColors, setLinked]);

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
    return context || {
        colors: DEFAULT_POSITION_COLORS,
        setColor: () => {},
        resetColors: () => {},
        kit: {
            colors: DEFAULT_POSITION_COLORS,
            setColor: () => {},
            resetColors: () => {},
            linked: true,
            setLinked: () => {},
        },
    };
};

/** The Draft Kit's view: the board's colors while linked, its own when not. */
export const useDraftKitPositionColors = () => usePositionColors().kit;
