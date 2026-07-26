#!/usr/bin/env python3
"""Generates the social share image and favicons in public/.

Run after any brand change:  python3 scripts/generateOgAssets.py

Outputs:
  public/og-image.png       1200x630 Open Graph / Twitter card
  public/favicon.ico        16/32/48 multi-size fallback
  public/apple-touch-icon.png  180x180
  public/favicon.svg is hand-maintained (mirrors src/components/BrandLogo.jsx)
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")

BG = (11, 15, 22)
INK = (255, 255, 255)
MUTED = (148, 163, 184)
EMERALD = (52, 211, 153)
TEAL = (13, 148, 136)

# Tier colors lifted from src/utils/uiTheme.js TIER_HEX
TIERS = [(239, 68, 68), (249, 115, 22), (234, 179, 8), (34, 197, 94), (59, 130, 246), (139, 92, 246)]

FONT_BOLD = "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf"
FONT_REG = "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf"
FONT_MED = "/usr/share/fonts/truetype/ubuntu/Ubuntu-M.ttf"

SS = 4  # supersample factor for crisp curves


def font(path, size):
    return ImageFont.truetype(path, size)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def diagonal_gradient(size, c1, c2):
    """Emerald->teal gradient running top-left to bottom-right."""
    w, h = size
    small = Image.new("RGB", (64, 64))
    px = small.load()
    for y in range(64):
        for x in range(64):
            px[x, y] = lerp(c1, c2, (x + y) / 126)
    return small.resize(size, Image.LANCZOS)


def brand_mark(size):
    """The Fantasy Toolkit logo mark as an RGBA tile (mirrors BrandLogo.jsx)."""
    s = size * SS
    tile = Image.new("RGBA", (s, s), (0, 0, 0, 0))

    grad = diagonal_gradient((s, s), EMERALD, TEAL).convert("RGBA")
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.26), fill=255)
    tile.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(tile, "RGBA")
    # football body — wider than tall so it doesn't read as a circle
    cx, cy = s / 2, s * 0.55
    rx, ry = s * 0.27, s * 0.155
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(255, 255, 255, 250))
    # laces: one spine plus short cross ticks
    lw = max(1, int(s * 0.024))
    d.line([(cx, cy - ry * 0.6), (cx, cy + ry * 0.6)], fill=TEAL + (255,), width=lw)
    for k in (-0.3, 0.3):
        y = cy + ry * k
        d.line([(cx - rx * 0.3, y), (cx + rx * 0.3, y)], fill=TEAL + (255,), width=lw)
    # small dot above the ball, echoing the SVG mark
    dr = s * 0.045
    d.ellipse([cx - dr, s * 0.185 - dr, cx + dr, s * 0.185 + dr], fill=(255, 255, 255, 230))

    return tile.resize((size, size), Image.LANCZOS)


def glow(img, center, radius, color, strength):
    """Soft radial wash, drawn coarse then upscaled."""
    n = 48
    layer = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    px = layer.load()
    for y in range(n):
        for x in range(n):
            dx, dy = (x - n / 2) / (n / 2), (y - n / 2) / (n / 2)
            dist = min(1.0, (dx * dx + dy * dy) ** 0.5)
            px[x, y] = color + (int(255 * strength * (1 - dist) ** 2),)
    layer = layer.resize((radius * 2, radius * 2), Image.LANCZOS)
    pos = (center[0] - radius, center[1] - radius)
    img.paste(layer, pos, layer)


def build_og():
    # Base stays RGB: ImageDraw only blends translucent fills into RGB images,
    # so an RGBA canvas would make every alpha fill overwrite as solid.
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG)

    glow(img, (140, 90), 460, EMERALD, 0.16)
    glow(img, (1090, 560), 380, TEAL, 0.13)

    # mode="RGBA" makes translucent fills blend instead of overwriting alpha
    d = ImageDraw.Draw(img, "RGBA")

    # stylized tier board on the right
    bx, by, bw = 742, 150, 372
    row_h, gap = 44, 13
    chip_widths = (104, 78, 92)
    for i, color in enumerate(TIERS):
        y = by + i * (row_h + gap)
        d.rounded_rectangle([bx, y, bx + bw, y + row_h], radius=11, fill=(255, 255, 255, 16))
        d.rounded_rectangle([bx, y, bx + 6, y + row_h], radius=3, fill=color + (255,))
        for j, cw in enumerate(chip_widths):
            cx0 = bx + 26 + sum(chip_widths[:j]) + j * 10
            if cx0 + cw > bx + bw - 14:
                break
            d.rounded_rectangle([cx0, y + 14, cx0 + cw, y + row_h - 14], radius=7,
                                fill=(255, 255, 255, 46))

    # left content block
    mark = brand_mark(96)
    img.paste(mark, (80, 92), mark)

    f_title = font(FONT_BOLD, 84)
    d.text((80, 228), "Fantasy", font=f_title, fill=EMERALD)
    d.text((80 + d.textlength("Fantasy ", font=f_title), 228), "Toolkit", font=f_title, fill=INK)
    d.text((84, 340), "2026 FANTASY FOOTBALL DRAFT SUITE", font=font(FONT_MED, 26), fill=MUTED)

    f = font(FONT_MED, 21)
    x, pill_y = 80, 420
    for label in ["Draft Board", "Draft Range", "Offseason HQ", "Draft Lottery"]:
        w = int(d.textlength(label, font=f)) + 32
        d.rounded_rectangle([x, pill_y, x + w, pill_y + 44], radius=22,
                            fill=(255, 255, 255, 20), outline=(255, 255, 255, 48), width=1)
        d.text((x + 16, pill_y + 11), label, font=f, fill=(226, 232, 240))
        x += w + 10

    d.text((80, 524), "fantasy-toolkit.com", font=font(FONT_BOLD, 26), fill=EMERALD)

    img.save(os.path.join(OUT, "og-image.png"), optimize=True)
    print("wrote og-image.png")


def build_icons():
    big = brand_mark(180)
    big.convert("RGB").save(os.path.join(OUT, "apple-touch-icon.png"))
    print("wrote apple-touch-icon.png")

    ico = brand_mark(48)
    ico.save(os.path.join(OUT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
    print("wrote favicon.ico")


if __name__ == "__main__":
    build_og()
    build_icons()
