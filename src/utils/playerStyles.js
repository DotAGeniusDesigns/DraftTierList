// Shared position badge styles for light and dark mode. Layout/shape stays
// as static Tailwind classes; the color itself comes from a user-editable
// hex map (see utils/positionColors.js + context/PositionColorsContext) so
// it can't be baked in as fixed Tailwind color classes.
import { hexToRgba, lighten, darken } from './colorUtils';
import { DEFAULT_POSITION_COLORS } from './positionColors';

const badgeBase = 'inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-xs sm:px-2.5 sm:py-1';

const colorFor = (position, colors) => colors[position] || colors.DEFAULT || DEFAULT_POSITION_COLORS.DST || '#64748b';

// Returns { className, style } for spreading onto the badge, e.g.
// <span {...getPositionTagProps(player.position, { darkMode, colors })}>
export const getPositionTagProps = (position, { drafted = false, darkMode = false, colors = DEFAULT_POSITION_COLORS } = {}) => {
    if (drafted) {
        return {
            className: `${badgeBase} ${darkMode ? 'bg-slate-700/60 text-slate-400' : 'bg-slate-200 text-slate-500'}`,
        };
    }

    const hex = colorFor(position, colors);
    return {
        className: badgeBase,
        style: {
            backgroundColor: hexToRgba(hex, darkMode ? 0.16 : 0.1),
            color: darkMode ? lighten(hex, 0.35) : darken(hex, 0.25),
            boxShadow: `inset 0 0 0 1px ${hexToRgba(hex, darkMode ? 0.3 : 0.22)}`,
        },
    };
};

// Solid-fill position coloring for a draft-board grid cell — same hue as the
// row badge above, just heavier since the cell itself is the thing being
// scanned for position at a glance, not a small chip next to text.
export const getPositionCellProps = (position, darkMode = false, colors = DEFAULT_POSITION_COLORS) => {
    const hex = colorFor(position, colors);

    return {
        style: darkMode
            ? {
                backgroundColor: hexToRgba(hex, 0.2),
                borderColor: hexToRgba(hex, 0.32),
                color: lighten(hex, 0.55),
            }
            : {
                backgroundColor: lighten(hex, 0.85),
                borderColor: lighten(hex, 0.6),
                color: darken(hex, 0.5),
            },
    };
};

export const getPositionFilterTagProps = (position, colors = DEFAULT_POSITION_COLORS) => {
    const hex = colorFor(position, colors);
    return {
        className: 'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
        style: {
            backgroundColor: hexToRgba(hex, 0.1),
            color: darken(hex, 0.25),
            boxShadow: `inset 0 0 0 1px ${hexToRgba(hex, 0.22)}`,
        },
    };
};
