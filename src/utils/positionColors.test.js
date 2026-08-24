import {
    DEFAULT_POSITION_COLORS,
    DRAFTKIT_COLORS_KEY,
    DRAFTKIT_LINK_KEY,
    POSITION_COLORS_KEY,
    getDraftKitColors,
    getDraftKitColorsLinked,
    getPositionColors,
    resetDraftKitColors,
    saveDraftKitColor,
    savePositionColor,
    setDraftKitColorsLinked,
} from './positionColors';

beforeEach(() => localStorage.clear());

describe('draft kit position colors', () => {
    it('is linked to the board until told otherwise', () => {
        expect(getDraftKitColorsLinked()).toBe(true);
    });

    it('reads the board colors when it has none of its own', () => {
        savePositionColor('RB', '#a855f7');
        expect(getDraftKitColors().RB).toBe('#a855f7');
    });

    it('seeds from the board on the first unlink, so nothing jumps on screen', () => {
        savePositionColor('RB', '#a855f7');
        setDraftKitColorsLinked(false);
        expect(getDraftKitColorsLinked()).toBe(false);
        expect(getDraftKitColors().RB).toBe('#a855f7');
    });

    it('keeps the board untouched once unlinked', () => {
        savePositionColor('RB', '#a855f7');
        setDraftKitColorsLinked(false);
        saveDraftKitColor('RB', '#3b82f6');
        expect(getDraftKitColors().RB).toBe('#3b82f6');
        expect(getPositionColors().RB).toBe('#a855f7');
    });

    it('remembers its own set across a relink, so toggling loses nothing', () => {
        setDraftKitColorsLinked(false);
        saveDraftKitColor('RB', '#3b82f6');
        setDraftKitColorsLinked(true);
        expect(getDraftKitColorsLinked()).toBe(true);
        // Relinked, the kit reads the board again...
        expect(getPositionColors().RB).toBe(DEFAULT_POSITION_COLORS.RB);
        // ...but its own pick is still on disk for the next unlink.
        expect(JSON.parse(localStorage.getItem(DRAFTKIT_COLORS_KEY)).RB).toBe('#3b82f6');
        setDraftKitColorsLinked(false);
        expect(getDraftKitColors().RB).toBe('#3b82f6');
    });

    it('resetting the kit drops back to the board colors', () => {
        savePositionColor('RB', '#a855f7');
        setDraftKitColorsLinked(false);
        saveDraftKitColor('RB', '#3b82f6');
        resetDraftKitColors();
        expect(getDraftKitColors().RB).toBe('#a855f7');
    });

    it('relinking clears the flag rather than storing a second truthy value', () => {
        setDraftKitColorsLinked(false);
        setDraftKitColorsLinked(true);
        expect(localStorage.getItem(DRAFTKIT_LINK_KEY)).toBeNull();
    });

    it('survives corrupt storage without throwing', () => {
        localStorage.setItem(POSITION_COLORS_KEY, 'not json');
        localStorage.setItem(DRAFTKIT_COLORS_KEY, 'not json either');
        expect(getPositionColors()).toEqual(DEFAULT_POSITION_COLORS);
        expect(getDraftKitColors()).toEqual(DEFAULT_POSITION_COLORS);
    });
});
