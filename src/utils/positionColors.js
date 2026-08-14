// User-customizable position accent colors, persisted to localStorage.
// Mirrors the tierNames.js pattern: a storage key, a change event, and
// plain get/save/reset helpers that components (or the context provider)
// can call without needing to know about React.

export const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

export const POSITION_COLORS_KEY = 'fantasy-football-position-colors';
export const POSITION_COLORS_UPDATED_EVENT = 'position-colors-updated';

// 20 visually distinct swatches spanning the hue wheel, offered as presets
// so picks stay distinguishable from each other instead of drifting toward
// near-duplicate shades.
export const POSITION_COLOR_PRESETS = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Yellow', hex: '#eab308' },
    { name: 'Lime', hex: '#84cc16' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Teal', hex: '#14b8a6' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Sky', hex: '#0ea5e9' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Fuchsia', hex: '#d946ef' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Brown', hex: '#92400e' },
    { name: 'Slate', hex: '#64748b' },
    { name: 'Charcoal', hex: '#1e293b' },
];

export const DEFAULT_POSITION_COLORS = {
    QB: '#f59e0b',
    RB: '#f43f5e',
    WR: '#10b981',
    TE: '#8b5cf6',
    K: '#d946ef',
    DST: '#64748b',
};

export const getPositionColors = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(POSITION_COLORS_KEY) || '{}');
        return { ...DEFAULT_POSITION_COLORS, ...stored };
    } catch {
        return { ...DEFAULT_POSITION_COLORS };
    }
};

export const savePositionColor = (position, hex) => {
    const current = getPositionColors();
    current[position] = hex;
    localStorage.setItem(POSITION_COLORS_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(POSITION_COLORS_UPDATED_EVENT));
};

export const resetPositionColors = () => {
    localStorage.removeItem(POSITION_COLORS_KEY);
    window.dispatchEvent(new CustomEvent(POSITION_COLORS_UPDATED_EVENT));
};
