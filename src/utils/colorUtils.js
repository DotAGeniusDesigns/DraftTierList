// Small hex-color helpers for turning a single user-picked accent color into
// the tint/text/ring triad the position badges need, without baking a fixed
// set of Tailwind color classes at build time.

const hexToRgb = (hex) => {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const int = parseInt(full, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

export const hexToRgba = (hex, alpha = 1) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const mix = (hex, targetHex, weight) => {
    const a = hexToRgb(hex);
    const b = hexToRgb(targetHex);
    const r = Math.round(a.r + (b.r - a.r) * weight);
    const g = Math.round(a.g + (b.g - a.g) * weight);
    const bl = Math.round(a.b + (b.b - a.b) * weight);
    return `rgb(${r}, ${g}, ${bl})`;
};

export const lighten = (hex, weight) => mix(hex, '#ffffff', weight);
export const darken = (hex, weight) => mix(hex, '#000000', weight);
