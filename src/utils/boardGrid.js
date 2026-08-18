// Column widths (px) shared by the draft board's desktop column header
// (Tier.jsx) and every player row (Player.jsx). Both build their CSS grid
// from this one array, so a column can never drift out of alignment with
// its header — the previous flex "bucket" layout needed matching
// flex-grow/shrink/gap values hand-kept in sync across two files, which is
// exactly what kept breaking.
//
// Rank, Photo, Player, Pos, Team, OL, Bye, ECR, ADP, Flags
const COLUMN_WIDTHS = [36, 40, 200, 56, 44, 28, 28, 48, 56, 40];

export const BOARD_GRID_GAP = 10;

export const BOARD_GRID_TEMPLATE = COLUMN_WIDTHS.map((w) => `${w}px`).join(' ');

// No `display` here on purpose — that has to stay a Tailwind class
// (`hidden` / `board:grid`) so the mobile/desktop switch still works. An
// inline style's `display` would win over both regardless of viewport,
// since inline styles beat class selectors no matter what media query
// they're under.
export const boardGridStyle = {
    gridTemplateColumns: BOARD_GRID_TEMPLATE,
    columnGap: `${BOARD_GRID_GAP}px`,
};

// Total width the grid needs to render without any column shrinking below
// its defined size — used only to sanity-check the `board` breakpoint in
// tailwind.config.js stays wide enough. Not imported anywhere at runtime.
export const BOARD_GRID_MIN_CONTENT_WIDTH = COLUMN_WIDTHS.reduce((a, b) => a + b, 0)
    + BOARD_GRID_GAP * (COLUMN_WIDTHS.length - 1);
