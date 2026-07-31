// Draft-lottery race engine.
//
// Presented as a drive down a 100-yard field: the world is scaled in yards,
// the racers are footballs, and the finish sensor is the goal line. All of
// that is skin — the physics underneath is still the tuned marble race, and
// the gap math in makeCourse depends on it staying that way.
//
// Ported almost verbatim from the standalone marble-race app so the carefully
// tuned physics/course/render logic is preserved (see the extensive notes in
// the original). The only structural change: all DOM-by-id wiring and the
// standalone control/modal markup are removed. The engine now talks to React
// through callbacks (onTimer / onPhase / onFinish) and is driven imperatively
// through the returned controller. Course geometry stays deterministic given a
// seed; Math.random() is used only for gameplay, exactly as before.

import Matter from 'matter-js';
import decomp from 'poly-decomp';

// Default racer colours + placeholder names (shared with the React UI).
export const DEFAULT_COLORS = [
    '#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#a29bfe',
    '#fd79a8', '#fdcb6e', '#00cec9', '#e17055', '#74b9ff',
    '#ff6b81', '#0be881', '#f8b739', '#48dbfb', '#ff5e57',
    '#54a0ff', '#5f27cd', '#01abc4', '#ee5a24', '#6c5ce7',
];

export const DEFAULT_NAMES = [
    'Blitz', 'Gridiron', 'Hail Mary', 'Pigskin', 'Red Zone',
    'Sack City', 'Shotgun', 'Audible', 'Pylon', 'Stiff Arm',
    'Play Action', 'Onside', 'Flea Flick', 'Gunslinger', 'Zone Read',
    'Trench', 'Wildcat', 'Pick Six', 'Sky Hook', 'Bootleg',
];

// ── Field geometry ─────────────────────────────────────────────────────
// The world is a 100-yard field with an end zone below the goal line, so the
// camera scroll reads as a drive downfield rather than a marble drop. W and
// VIEW_H stay load-bearing (see the gap math in makeCourse); the height is
// free, and is now derived from the field rather than picked by hand.
const W = 700;
const VIEW_H = 560;

// Race length is tuned through PX_PER_YARD and GRAVITY alone. Every other
// dimension is derived, so the field always measures exactly 100 yards however
// long the race is set to run.
//
// These two were picked by sweeping both against simulated races: the pair
// below lands a full race at a ~30s median from 4 teams up to 20, while
// leaving finishing order uncorrelated with starting slot (mean finish rank
// stays within noise of fair across every slot). Raising gravity much further
// starts trading that randomness away — balls plough through the pegs instead
// of being deflected by them.
const PX_PER_YARD = 14;
const GRAVITY = 0.14;

const FIELD_YARDS = 100;
const OWN_GOAL_Y = 70;                                   // drive starts here
const GOAL_Y = OWN_GOAL_Y + FIELD_YARDS * PX_PER_YARD;   // goal line = finish sensor
const RED_ZONE_Y = GOAL_Y - 20 * PX_PER_YARD;
// A real end zone is 10 yards, but it also has to hold the lettering and
// uprights, so it stops shrinking below a readable floor.
const END_ZONE_DEPTH = Math.max(240, 10 * PX_PER_YARD);
const H = GOAL_Y + END_ZONE_DEPTH + 30;                  // full world height

const yardsToGoAt = (y) =>
    Math.max(0, Math.min(FIELD_YARDS, (GOAL_Y - y) / PX_PER_YARD));

// Real fields are numbered by distance to the *nearer* goal line — 10..50..10 —
// so a team 70 yards out is standing on the 30, not the 70.
const yardMarker = (yardsToGo) =>
    Math.round(yardsToGo > 50 ? FIELD_YARDS - yardsToGo : yardsToGo);

const pickLabel = (index) => `1.${String(index + 1).padStart(2, '0')}`;

export function makeDefaultTeams(n) {
    return Array.from({ length: n }, (_, i) => ({
        name: `Team ${i + 1}`,
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));
}

export function createMarbleRace(canvas, callbacks = {}) {
    const { onTimer, onPhase, onFinish, onPlay } = callbacks;
    const { Engine, Render, Runner, Bodies, Body, Composite, Events } = Matter;

    // ── State ──────────────────────────────────────────────────────────
    let marbleCount = 4;
    let selColors = DEFAULT_COLORS.slice(0, 4);
    let selNames = DEFAULT_NAMES.slice(0, 4);
    let shuffleStart = false;

    let engine, render, runner;
    let marbles = [];
    let raceStarted = false;
    let finishOrder = [];
    let timerHandle = null;
    let startTime = 0;
    let winScheduled = false;
    let camY = 0;
    let destroyed = false;
    let fieldTexture = null;

    // Play-by-play bookkeeping.
    let playSeq = 0;
    let lastPlayAt = 0;
    let milestoneLeft = FIELD_YARDS;  // next 10-yard mark still uncalled
    let leadIdx = -1;
    let lastLeadChangeAt = 0;

    // The ticker is flavour, not telemetry. Low-priority calls share a cooldown
    // so a 20-team scrum can't flood the feed; scores and lead changes bypass it.
    function emitPlay(text, tone = 'neutral', priority = false) {
        if (!onPlay) return;
        const now = Date.now();
        if (!priority && now - lastPlayAt < 1100) return;
        lastPlayAt = now;
        onPlay({ id: ++playSeq, text, tone });
    }

    let courseSeed = (Math.random() * 1e9) | 0;
    function mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // ── Colour helpers ─────────────────────────────────────────────────
    function lighten(h, a) { const n = parseInt(h.slice(1), 16); return '#' + [Math.min(255, (n >> 16) + a), Math.min(255, ((n >> 8) & 0xff) + a), Math.min(255, (n & 0xff) + a)].map(v => v.toString(16).padStart(2, '0')).join(''); }
    function darken(h, a) { const n = parseInt(h.slice(1), 16); return '#' + [Math.max(0, (n >> 16) - a), Math.max(0, ((n >> 8) & 0xff) - a), Math.max(0, (n & 0xff) - a)].map(v => v.toString(16).padStart(2, '0')).join(''); }
    function hexRgba(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 0xff},${n & 0xff},${a})`; }
    const rnd = (lo, hi) => lo + Math.random() * (hi - lo);

    // ══════════════════════════════════════════════════════════════════
    //  FIELD ART
    // ══════════════════════════════════════════════════════════════════
    // Painted once into an offscreen canvas the full height of the world, then
    // blitted behind the bodies each frame. Baking it means the per-frame cost
    // is a single drawImage no matter how much detail the field carries.
    function buildFieldTexture() {
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const g = c.getContext('2d');

        // Turf, with mowed 5-yard banding so the scroll reads as movement.
        g.fillStyle = '#0b1a10';
        g.fillRect(0, 0, W, H);
        g.fillStyle = '#0e2114';
        const band = 5 * PX_PER_YARD;
        for (let y = OWN_GOAL_Y; y < GOAL_Y; y += band * 2) {
            g.fillRect(0, y, W, Math.min(band, GOAL_Y - y));
        }

        // Red zone — the last 20 yards run hot.
        g.fillStyle = 'rgba(159,18,57,0.17)';
        g.fillRect(0, RED_ZONE_Y, W, GOAL_Y - RED_ZONE_Y);

        // Sidelines
        g.fillStyle = 'rgba(255,255,255,0.10)';
        g.fillRect(18, 0, 3, H);
        g.fillRect(W - 21, 0, 3, H);

        // Inbound hash marks, one per yard.
        g.fillStyle = 'rgba(255,255,255,0.15)';
        for (let i = 0; i <= FIELD_YARDS; i++) {
            const y = OWN_GOAL_Y + i * PX_PER_YARD;
            g.fillRect(W * 0.34, y - 1, 14, 2);
            g.fillRect(W * 0.66 - 14, y - 1, 14, 2);
        }

        // Yard lines and their mirrored numbers.
        for (let k = 0; k <= 10; k++) {
            const y = OWN_GOAL_Y + k * 10 * PX_PER_YARD;
            const toGo = FIELD_YARDS - k * 10;
            const mid = toGo === 50;

            g.fillStyle = `rgba(255,255,255,${mid ? 0.34 : 0.2})`;
            g.fillRect(18, y - (mid ? 2 : 1), W - 39, mid ? 4 : 2);

            const label = yardMarker(toGo);
            if (label === 0) continue; // goal lines are drawn separately
            g.save();
            g.font = `800 ${mid ? 44 : 36}px "DM Sans", system-ui, sans-serif`;
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillStyle = `rgba(255,255,255,${mid ? 0.17 : 0.12})`;
            g.fillText(String(label), 74, y);
            g.fillText(String(label), W - 74, y);
            g.restore();
        }

        // Goal lines: where the drive starts, and where it pays.
        g.fillStyle = 'rgba(255,255,255,0.45)';
        g.fillRect(18, OWN_GOAL_Y - 2, W - 39, 4);
        g.fillStyle = 'rgba(52,211,153,0.9)';
        g.fillRect(18, GOAL_Y - 2, W - 39, 5);

        // The balls drop out of their own end zone.
        g.fillStyle = 'rgba(255,255,255,0.03)';
        g.fillRect(0, 0, W, OWN_GOAL_Y);

        // ── Scoring end zone ──
        const ezTop = GOAL_Y;
        const ezBot = GOAL_Y + END_ZONE_DEPTH;
        const ez = g.createLinearGradient(0, ezTop, 0, ezBot);
        ez.addColorStop(0, 'rgba(16,185,129,0.30)');
        ez.addColorStop(1, 'rgba(6,78,59,0.45)');
        g.fillStyle = ez;
        g.fillRect(0, ezTop, W, END_ZONE_DEPTH);

        g.save();
        g.beginPath();
        g.rect(0, ezTop, W, END_ZONE_DEPTH);
        g.clip();
        g.strokeStyle = 'rgba(255,255,255,0.05)';
        g.lineWidth = 2;
        for (let x = -END_ZONE_DEPTH; x < W + END_ZONE_DEPTH; x += 18) {
            g.beginPath();
            g.moveTo(x, ezBot);
            g.lineTo(x + END_ZONE_DEPTH, ezTop);
            g.stroke();
        }
        g.restore();

        g.save();
        if ('letterSpacing' in g) g.letterSpacing = '10px';
        g.font = '800 46px "Bricolage Grotesque", "DM Sans", system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = 'rgba(209,250,229,0.75)';
        g.fillText('PICK 1.01', W / 2, ezTop + END_ZONE_DEPTH * 0.40);
        g.restore();

        // Back line + uprights
        g.fillStyle = 'rgba(255,255,255,0.3)';
        g.fillRect(18, ezBot - 3, W - 39, 3);
        drawGoalposts(g, W / 2, ezBot - 26);

        // Pylons on all four end-zone corners.
        [[22, ezTop], [W - 22, ezTop], [22, ezBot - 3], [W - 22, ezBot - 3]].forEach(([px, py]) => {
            g.fillStyle = '#fb923c';
            g.fillRect(px - 4, py - 13, 8, 17);
            g.fillStyle = 'rgba(255,255,255,0.3)';
            g.fillRect(px - 4, py - 13, 8, 4);
        });

        return c;
    }

    function drawGoalposts(g, cx, baseY) {
        const spread = 58;
        g.save();
        g.strokeStyle = 'rgba(250,204,21,0.85)';
        g.lineCap = 'round';
        g.lineWidth = 6;
        g.beginPath();               // crossbar
        g.moveTo(cx - spread, baseY);
        g.lineTo(cx + spread, baseY);
        g.stroke();
        g.lineWidth = 5;             // uprights, rising back toward the field
        [-spread, spread].forEach((dx) => {
            g.beginPath();
            g.moveTo(cx + dx, baseY);
            g.lineTo(cx + dx, baseY - 40);
            g.stroke();
        });
        g.lineWidth = 6;             // stem
        g.beginPath();
        g.moveTo(cx, baseY);
        g.lineTo(cx, baseY + 18);
        g.stroke();
        g.restore();
    }

    // The physics body stays a circle — only the art is football-shaped, so the
    // carefully tuned gap/bounce math is untouched.
    function drawFootball(ctx, x, y, r, angle, color) {
        const L = r * 1.2;
        const Hh = r * 0.78;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Quadratic control at 2*Hh puts the curve's apex exactly at Hh.
        ctx.beginPath();
        ctx.moveTo(-L, 0);
        ctx.quadraticCurveTo(0, -2 * Hh, L, 0);
        ctx.quadraticCurveTo(0, 2 * Hh, -L, 0);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, -Hh, 0, Hh);
        grad.addColorStop(0, lighten(color, 48));
        grad.addColorStop(1, darken(color, 36));
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = darken(color, 62);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.82)';
        ctx.lineWidth = 1.4;
        [-1, 1].forEach((s) => {     // tip stripes
            ctx.beginPath();
            ctx.moveTo(s * L * 0.6, -Hh * 0.52);
            ctx.lineTo(s * L * 0.6, Hh * 0.52);
            ctx.stroke();
        });
        ctx.lineWidth = 1.6;         // laces
        ctx.beginPath();
        ctx.moveTo(-L * 0.32, 0);
        ctx.lineTo(L * 0.32, 0);
        ctx.stroke();
        ctx.lineWidth = 1.2;
        for (let i = -2; i <= 2; i++) {
            const lx = i * L * 0.145;
            ctx.beginPath();
            ctx.moveTo(lx, -Hh * 0.36);
            ctx.lineTo(lx, Hh * 0.36);
            ctx.stroke();
        }
        ctx.restore();
    }

    // ══════════════════════════════════════════════════════════════════
    //  COURSE GENERATION (checkerboard of small obstacle nodes)
    // ══════════════════════════════════════════════════════════════════
    function makeCourse() {
        const S = { isStatic: true };
        const out = [];
        const R = mulberry32(courseSeed);
        const ri = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));

        const NODE_R = 13;
        const COLS = 8;
        const COL_DX = (W - 2 * NODE_R) / (COLS - 1);
        const HALF = COL_DX / 2;
        const SLOTS = 2 * (COLS - 1);
        const ROW_DY = 85;
        // Obstacles stop short of the goal line so the end zone stays clear.
        const TOP = 180, BOT = GOAL_Y - 125;
        const slotX = j => NODE_R + j * HALF;

        // Stadium tones rather than arcade neon, so the pegs sit on the turf
        // instead of fighting it.
        const zones = [
            { fillStyle: '#0a1f14', strokeStyle: '#15803d', lineWidth: 2 },
            { fillStyle: '#14210d', strokeStyle: '#4d7c0f', lineWidth: 2 },
            { fillStyle: '#0d1b26', strokeStyle: '#0f766e', lineWidth: 2 },
            { fillStyle: '#1f1206', strokeStyle: '#b45309', lineWidth: 2 },
        ];
        // Crimson is kept out of the shuffle and pinned to the real red zone —
        // a red band anywhere else would read as a fifth random stripe.
        const redZoneSty = { fillStyle: '#1c0d10', strokeStyle: '#9f1239', lineWidth: 2 };
        for (let i = zones.length - 1; i > 0; i--) {
            const j = ri(0, i);
            [zones[i], zones[j]] = [zones[j], zones[i]];
        }
        const zoneH = (BOT - TOP) / zones.length;
        const zoneSty = y => (y >= RED_ZONE_Y
            ? redZoneSty
            : zones[Math.min(zones.length - 1, Math.floor((y - TOP) / zoneH))]);

        const wallSty = { fillStyle: '#06080f', strokeStyle: '#0e1525', lineWidth: 1 };
        out.push(
            Bodies.rectangle(W / 2, -30, W + 120, 60, { ...S, render: wallSty }),
            Bodies.rectangle(-30, H / 2, 60, H + 120, { ...S, render: wallSty }),
            Bodies.rectangle(W + 30, H / 2, 60, H + 120, { ...S, render: wallSty }),
            Bodies.rectangle(W / 2, H + 30, W + 120, 60, { ...S, render: wallSty })
        );

        const opt = (color, rest) => ({ ...S, friction: 0, restitution: rest ?? 1.1, render: { fillStyle: darken(color, 120), strokeStyle: color, lineWidth: 2 } });
        const setRest = (b, r) => { b.restitution = r; b.parts.forEach(p => p.restitution = r); };
        const tag = (b, color, rest) => {
            b.label = 'special'; b.glowColor = color;
            const r = rest ?? 1.1;
            setRest(b, r);
            if (r > 1) { const k = Math.min(4, (r - 1) * 5.5); b.kick = k; b.parts.forEach(p => p.kick = k); }
            out.push(b);
        };
        const reg = (sides, color, ang = 0, rad = 14, rest) => (x, y) => {
            const b = Bodies.polygon(x, y, sides, rad, opt(color, rest));
            Body.setAngle(b, ang);
            // Store the real polygon outline (world coords, constant for a static
            // body) so the bounce cue can trace the shape instead of a circle.
            b.outline = b.vertices.map(v => ({ x: v.x, y: v.y }));
            tag(b, color, rest);
        };
        const shaped = (verts, color, rest) => (x, y) => {
            const b = Bodies.fromVertices(x, y, [verts], opt(color, rest), true);
            // Rebuild the outline from the original (possibly concave) vertex ring,
            // recentred on the body — Body.vertices would only give the convex hull.
            let cx0 = 0, cy0 = 0;
            verts.forEach(v => { cx0 += v.x; cy0 += v.y; });
            cx0 /= verts.length; cy0 /= verts.length;
            b.outline = verts.map(v => ({ x: b.position.x + (v.x - cx0), y: b.position.y + (v.y - cy0) }));
            tag(b, color, rest);
        };
        const starV = (pts, rO, rI) => {
            const v = [];
            for (let i = 0; i < pts * 2; i++) {
                const a = (Math.PI / pts) * i - Math.PI / 2;
                const r = i % 2 === 0 ? rO : rI;
                v.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
            }
            return v;
        };
        const crossV = (() => {
            const a = 15, w = 6;
            return [[-w, -a], [w, -a], [w, -w], [a, -w], [a, w], [w, w], [w, a], [-w, a], [-w, w], [-a, w], [-a, -w], [-w, -w]]
                .map(([x, y]) => ({ x, y }));
        })();
        const gemV = [[0, -15], [9, -5], [9, 7], [0, 15], [-9, 7], [-9, -5]].map(([x, y]) => ({ x, y }));
        // Football — a pointed oval (two circular arcs meeting at sharp tips).
        // Horizontal extent 15 / vertical 7.5 → a smaller envelope than the
        // stars, so the no-fall-through / no-stuck gap math is unaffected.
        const footballV = (() => {
            const L = 15, Hh = 7.5;
            const R = (L * L + Hh * Hh) / (2 * Hh);
            const cy = Hh - R;
            const yTop = (px) => cy + Math.sqrt(Math.max(0, R * R - px * px));
            const N = 5;
            const ring = [{ x: -L, y: 0 }];
            for (let i = 1; i < N; i++) { const px = -L + (2 * L) * (i / N); ring.push({ x: px, y: yTop(px) }); }
            ring.push({ x: L, y: 0 });
            for (let i = N - 1; i >= 1; i--) { const px = -L + (2 * L) * (i / N); ring.push({ x: px, y: -yTop(px) }); }
            return ring;
        })();

        const bumper = (x, y) => tag(Bodies.circle(x, y, NODE_R, opt('#f97316', 1.8)), '#f97316', 1.8);

        const FIRM = [
            reg(3, '#ec4899', -Math.PI / 2, 14, 0.68),
            reg(3, '#fb7185', Math.PI / 2, 14, 0.68),
            reg(4, '#3b82f6', Math.PI / 4, 14, 0.5),
            reg(5, '#8b5cf6', -Math.PI / 2, 14, 0.7),
            reg(5, '#a78bfa', Math.PI / 2, 14, 0.7),
            reg(6, '#10b981', -Math.PI / 2, 14, 0.6),
            reg(6, '#22c55e', 0, 14, 0.6),
            reg(7, '#eab308', -Math.PI / 2, 14, 0.62),
            shaped(footballV, '#a0522d', 0.62),       // football 🏈 (firm)
        ];
        const KICK = [
            reg(4, '#06b6d4', 0, 14, 1.5),
            reg(8, '#0ea5e9', Math.PI / 8, 14, 1.4),
            shaped(starV(5, 15, 6), '#fbbf24', 1.6),
            shaped(starV(6, 15, 7), '#d946ef', 1.6),
            shaped(starV(4, 15, 5), '#ef4444', 1.6),
            shaped(crossV, '#84cc16', 1.5),
            shaped(gemV, '#14b8a6', 1.7),
            shaped(footballV, '#d97706', 1.5),        // football 🏈 (bouncy, shaped ring)
        ];

        function node(x, y, pegSty, forcePeg) {
            const peg = () => { const b = Bodies.circle(x, y, NODE_R, { ...S, friction: 0, render: pegSty }); setRest(b, 0.5); out.push(b); };
            if (forcePeg) { peg(); return; }
            const r = R();
            if (r < 0.62) peg();
            else if (r < 0.88) FIRM[ri(0, FIRM.length - 1)](x, y);
            else if (r < 0.93) bumper(x, y);
            else KICK[ri(0, KICK.length - 1)](x, y);
        }

        let row = 0;
        for (let y = TOP; y <= BOT; y += ROW_DY, row++) {
            const sty = zoneSty(y);
            const start = row % 2 === 0 ? 0 : 1;
            for (let j = start; j <= SLOTS; j += 2)
                node(slotX(j), y, sty, j === 0 || j === SLOTS);
        }

        // No finish-line body: scoring is a position test in checkForScores().

        return out;
    }

    // ══════════════════════════════════════════════════════════════════
    //  PHYSICS BOOTSTRAP
    // ══════════════════════════════════════════════════════════════════
    function setup() {
        if (decomp && Matter.Common && Matter.Common.setDecomp) Matter.Common.setDecomp(decomp);
        engine = Engine.create({ gravity: { y: GRAVITY } });

        render = Render.create({
            canvas,
            engine,
            options: { width: W, height: VIEW_H, wireframes: false, background: '#0d0d10', hasBounds: true },
        });
        render.bounds = { min: { x: 0, y: 0 }, max: { x: W, y: VIEW_H } };

        // Field geometry never changes with the course seed, so bake it once.
        fieldTexture = buildFieldTexture();

        runner = Runner.create();
        Events.on(render, 'afterRender', drawOverlay);
        Events.on(engine, 'collisionStart', onCollision);
        Events.on(engine, 'afterUpdate', afterUpdate);

        Render.run(render);
        resetRace();
    }

    function afterUpdate() {
        if (!raceStarted) return;
        const MAX_V = 24;
        marbles.forEach(m => {
            if (m.finished) return;
            const v = m.body.velocity, sp = Math.hypot(v.x, v.y);
            if (sp > MAX_V) Body.setVelocity(m.body, { x: v.x / sp * MAX_V, y: v.y / sp * MAX_V });
        });
        // Stuck rescue, escalating. Some random courses generate a pocket that a
        // single gentle nudge can't clear, and a ball parked there never scores,
        // so the race can never end. Each failed check pushes harder, and after
        // four the ball is displaced outright — a trap always loses eventually.
        const now = Date.now();
        marbles.forEach(m => {
            if (m.finished || m._stuckT == null) return;
            if (now - m._stuckT < 1500) return;
            const progress = m.body.position.y - m._stuckY;
            m._stuckT = now;
            m._stuckY = m.body.position.y;

            if (progress >= 40) {
                m._stuckCount = 0;
                return;
            }

            m._stuckCount = (m._stuckCount || 0) + 1;
            const power = Math.min(3, m._stuckCount);
            Body.setVelocity(m.body, {
                x: rnd(-2, 2) * power,
                y: (3 + Math.random() * 2) * power,
            });
            if (m._stuckCount >= 4) {
                Body.setPosition(m.body, {
                    x: Math.max(20, Math.min(W - 20, m.body.position.x + rnd(-20, 20))),
                    y: m.body.position.y + 10,
                });
            }
        });

        // Marbles carry no friction, so contact never spins them. Derive a
        // visual tumble from horizontal travel instead — it reads as the ball
        // rolling the way it's moving.
        marbles.forEach(m => { m.spin += m.body.velocity.x * 0.035; });

        checkForScores();
        callPlayByPlay();
    }

    // The goal line is tested as a plane rather than a collision sensor: balls
    // reach MAX_V near the bottom, which is faster than a thin sensor is tall,
    // so a sensor can be tunnelled clean through — stranding that team and
    // hanging the race on a finish that never registers.
    function checkForScores() {
        marbles.forEach(m => {
            if (m.finished || m.body.position.y < GOAL_Y) return;
            m.finished = true;
            m.finishTime = Date.now() - startTime;
            finishOrder.push(m);
            emitPlay(
                `${m.name} finds the end zone — pick ${pickLabel(finishOrder.length - 1)}`,
                'score',
                true,
            );
            if (finishOrder.length >= marbleCount && !winScheduled) {
                winScheduled = true;
                setTimeout(finishRace, 600);
            }
        });
    }

    // ── Play-by-play ───────────────────────────────────────────────────
    function leadingMarble() {
        const active = marbles.filter(m => !m.finished);
        if (active.length === 0) return null;
        return active.reduce((a, b) => (a.body.position.y > b.body.position.y ? a : b));
    }

    function callPlayByPlay() {
        const leader = leadingMarble();
        if (!leader) return;

        // Milestones are called off the leader only — one voice, not N.
        const toGo = yardsToGoAt(leader.body.position.y);
        while (milestoneLeft > 0 && toGo <= milestoneLeft - 10) {
            milestoneLeft -= 10;
            if (milestoneLeft === 50) {
                emitPlay(`${leader.name} crosses midfield`, 'good', true);
            } else if (milestoneLeft === 20) {
                emitPlay(`${leader.name} is inside the RED ZONE`, 'hot', true);
            } else if (milestoneLeft > 0) {
                emitPlay(`${leader.name} down to the ${yardMarker(milestoneLeft)}`, 'neutral');
            }
        }

        // Lead changes stop mattering once anyone has scored.
        if (finishOrder.length > 0) return;

        if (leadIdx === -1) {
            leadIdx = leader.index;
            return;
        }
        if (leader.index === leadIdx) return;

        // Require a real gap, or a two-ball scrum flaps the call every frame.
        const prev = marbles[leadIdx];
        const margin = prev ? leader.body.position.y - prev.body.position.y : Infinity;
        if (margin > 22 && Date.now() - lastLeadChangeAt > 1600) {
            lastLeadChangeAt = Date.now();
            leadIdx = leader.index;
            emitPlay(`${leader.name} takes over the lead`, 'good', true);
        }
    }

    // ── Lifecycle ──────────────────────────────────────────────────────
    function resetRace() {
        Runner.stop(runner);
        clearInterval(timerHandle);
        Composite.clear(engine.world);
        raceStarted = false;
        finishOrder = [];
        marbles = [];
        winScheduled = false;
        camY = 0;
        milestoneLeft = FIELD_YARDS;
        leadIdx = -1;
        lastPlayAt = 0;
        lastLeadChangeAt = 0;
        render.bounds = { min: { x: 0, y: 0 }, max: { x: W, y: VIEW_H } };
        Composite.add(engine.world, makeCourse());
        spawnMarbles();
        onTimer?.('00:00.0');
        onPhase?.('setup');
    }

    function spawnMarbles() {
        const gap = Math.min(60, (W - 130) / Math.max(1, marbleCount - 1));
        const x0 = (W - gap * (marbleCount - 1)) / 2;
        for (let i = 0; i < marbleCount; i++) {
            const color = selColors[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            const body = Bodies.circle(x0 + i * gap, 32, 13, {
                restitution: 0.55, friction: 0, frictionAir: 0.001, density: 0.003,
                label: `marble_${i}`,
                // Drawn by hand as a football in drawOverlay, so the engine's
                // own circle render is suppressed.
                render: { visible: false, fillStyle: color, strokeStyle: lighten(color, 45), lineWidth: 2 },
            });
            const name = (selNames[i] || '').trim() || DEFAULT_NAMES[i % DEFAULT_NAMES.length];
            marbles.push({ body, color, name, index: i, finished: false, finishTime: 0, trail: [], spin: 0 });
            Composite.add(engine.world, body);
        }
    }

    function startRace() {
        if (raceStarted) return;
        raceStarted = true;
        onPhase?.('racing');

        if (shuffleStart) {
            const xs = marbles.map(m => m.body.position.x);
            for (let i = xs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [xs[i], xs[j]] = [xs[j], xs[i]];
            }
            marbles.forEach((m, i) => Body.setPosition(m.body, { x: xs[i], y: m.body.position.y }));
        }

        const t0 = Date.now();
        marbles.forEach(m => {
            Body.setVelocity(m.body, { x: rnd(-0.12, 0.12), y: rnd(0.02, 0.15) });
            m._stuckT = t0;
            m._stuckY = m.body.position.y;
        });
        emitPlay(`Kickoff — ${marbleCount} teams away`, 'good', true);

        Runner.run(runner, engine);
        startTime = Date.now();
        timerHandle = setInterval(() => {
            const ms = Date.now() - startTime, s = Math.floor(ms / 1000);
            onTimer?.(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${Math.floor((ms % 1000) / 100)}`);
        }, 100);
    }

    function newCourse() {
        if (raceStarted) return;
        courseSeed = (Math.random() * 1e9) | 0;
        resetRace();
    }

    // ── Bounce handling ────────────────────────────────────────────────
    function onCollision(event) {
        if (!raceStarted) return;
        event.pairs.forEach(({ bodyA, bodyB }) => {
            const aM = typeof bodyA.label === 'string' && bodyA.label.startsWith('marble_');
            const bM = typeof bodyB.label === 'string' && bodyB.label.startsWith('marble_');
            if (aM === bM) return;
            const marbleBody = aM ? bodyA : bodyB;
            const nodeBody = aM ? bodyB : bodyA;
            const kick = nodeBody.kick || (nodeBody.parent && nodeBody.parent.kick);
            if (!kick) return;
            const m = marbles.find(x => x.body === marbleBody && !x.finished);
            if (!m) return;
            const c = nodeBody.parent || nodeBody;
            let dx = marbleBody.position.x - c.position.x;
            let dy = marbleBody.position.y - c.position.y;
            const len = Math.hypot(dx, dy) || 1;
            dx /= len; dy /= len;
            const v = marbleBody.velocity;
            if (v.x * dx + v.y * dy >= 0) return;
            let nvx = dx * kick + rnd(-1, 1);
            let nvy = dy * kick;
            if (nvy > 0) nvy = Math.min(nvy, Math.max(v.y, 0));
            Body.setVelocity(marbleBody, { x: nvx, y: nvy });

            // Only the hardest contacts are worth calling; the cooldown inside
            // emitPlay keeps a busy board from burying everything else.
            if (kick >= 1.5) {
                emitPlay(
                    `${m.name} takes a big hit at the ${yardMarker(yardsToGoAt(marbleBody.position.y))}`,
                    'hit',
                );
            }
        });
    }

    function buildOrder() {
        const dnf = marbles.filter(m => !m.finished).sort((a, b) => b.body.position.y - a.body.position.y);
        const allRanked = [...finishOrder, ...dnf];
        return allRanked.map(m => ({
            name: m.name,
            color: m.color,
            finished: m.finished,
            finishTime: m.finishTime,
        }));
    }

    function finishRace() {
        if (destroyed) return;
        clearInterval(timerHandle);
        const winner = finishOrder[0] || marbles[0];
        if (winner) emitPlay(`Final — ${winner.name} is on the clock at 1.01`, 'score', true);
        onPhase?.('done');
        onFinish?.(buildOrder());
    }

    // ══════════════════════════════════════════════════════════════════
    //  RENDERING (afterRender overlay)
    // ══════════════════════════════════════════════════════════════════
    function updateCamera() {
        if (marbles.length === 0) return;
        let ref;
        if (finishOrder.length > 0) {
            ref = finishOrder[0];
        } else {
            const active = marbles.filter(m => !m.finished);
            ref = active.length > 0
                ? active.reduce((a, b) => a.body.position.y > b.body.position.y ? a : b)
                : marbles[0];
        }
        // Clamped to the world so the camera can't drift past the back of the
        // end zone — the field texture is only H tall.
        const targetY = Math.max(0, Math.min(H - VIEW_H, ref.body.position.y - VIEW_H * 0.5));
        const speed = raceStarted ? 0.07 : 0.12;
        camY += (targetY - camY) * speed;
        render.bounds.min.y = camY;
        render.bounds.max.y = camY + VIEW_H;
    }

    function drawOverlay() {
        const ctx = render.context;
        const now = Date.now() / 1000;

        // Build a path tracing a shape's outline (world-space points) scaled
        // outward from its centre, so both the glow and the bounce cue hug the
        // actual shape (triangle, star, …) instead of a generic circle.
        const pathScaledOutline = (outline, cx, cy, s) => {
            ctx.beginPath();
            for (let i = 0; i < outline.length; i++) {
                const vx = cx + (outline[i].x - cx) * s;
                const vy = cy + (outline[i].y - cy) * s;
                if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
            }
            ctx.closePath();
        };

        updateCamera();

        // Matter clears the canvas to transparent before drawing bodies, so
        // compositing the field underneath what's already there puts it behind
        // the course without a second render pass.
        if (fieldTexture) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.drawImage(fieldTexture, 0, camY, W, VIEW_H, 0, 0, W, VIEW_H);
            ctx.restore();
        }

        if (raceStarted) {
            marbles.forEach(m => {
                m.trail.push({ x: m.body.position.x, y: m.body.position.y });
                if (m.trail.length > 18) m.trail.shift();
            });
        }

        ctx.save();
        ctx.translate(0, -camY);

        Composite.allBodies(engine.world).forEach(body => {
            if (!body.glowColor) return;
            const { x, y } = body.position;
            // Cull nodes outside the visible camera window — no point spending
            // draw calls on the hundreds of nodes above/below the viewport.
            if (y < camY - 60 || y > camY + VIEW_H + 60) return;
            const kick = body.kick || 0;
            const spring = Math.min(1, kick / 4);
            const pulse = 0.8 + 0.2 * Math.sin(now * 3 + x * 0.05);

            // Soft identity glow — a cheap radial gradient (a soft aura, not a hard
            // circle). The shape-matching happens on the crisp bounce ring below.
            const glowR = (body.circleRadius || 15) * (2.4 + spring * 0.7);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
            g.addColorStop(0, hexRgba(body.glowColor, (0.34 + 0.24 * spring) * pulse));
            g.addColorStop(0.5, hexRgba(body.glowColor, 0.13 * pulse));
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            if (kick > 0) {
                // Express the old pixel offsets as scale factors so the cue can be
                // drawn either as the shape's own outline (polygons/stars/cross/gem)
                // or as a circle for genuine circular nodes (the bumper).
                const sr = body.circleRadius || 14;
                const ringBase = 1 + 4 / sr;

                // (1) white breathing ring
                const breatheScale = ringBase + (1.5 / sr) * Math.sin(now * 3 + x * 0.05);
                ctx.save();
                ctx.lineWidth = 1.6 + spring * 1.2;
                ctx.strokeStyle = `rgba(255,255,255,${0.32 + 0.3 * spring})`;
                if (body.outline) { pathScaledOutline(body.outline, x, y, breatheScale); ctx.stroke(); }
                else { ctx.beginPath(); ctx.arc(x, y, sr * breatheScale, 0, Math.PI * 2); ctx.stroke(); }
                ctx.restore();

                // (2) soft expanding ping — same shape, slowly growing
                const period = 1.9 - spring * 0.6;
                const t = ((now + x * 0.013) % period) / period;
                const pingScale = ringBase + (t * (10 + spring * 16)) / sr;
                ctx.save();
                ctx.globalAlpha = (1 - t) * (0.18 + 0.16 * spring);
                ctx.lineWidth = 1.75;
                ctx.strokeStyle = lighten(body.glowColor, 40);
                if (body.outline) { pathScaledOutline(body.outline, x, y, pingScale); ctx.stroke(); }
                else { ctx.beginPath(); ctx.arc(x, y, sr * pingScale, 0, Math.PI * 2); ctx.stroke(); }
                ctx.restore();
            }
        });

        // (The goal line, end zone and uprights live in the baked field texture.)

        // Trails
        marbles.forEach(m => {
            if (m.trail.length < 2) return;
            ctx.save();
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            for (let t = 1; t < m.trail.length; t++) {
                const p = t / m.trail.length;
                ctx.beginPath();
                ctx.moveTo(m.trail[t - 1].x, m.trail[t - 1].y);
                ctx.lineTo(m.trail[t].x, m.trail[t].y);
                ctx.strokeStyle = m.color;
                ctx.globalAlpha = p * 0.4;
                ctx.lineWidth = p * 9;
                ctx.stroke();
            }
            ctx.restore();
        });

        // Footballs
        marbles.forEach(m => {
            const { x, y } = m.body.position;
            const r = 13;

            // Team-coloured aura, so identity still reads against dark turf.
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.3);
            g.addColorStop(0, m.color + '99'); g.addColorStop(1, 'transparent');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            drawFootball(ctx, x, y, r, m.spin, m.color);

            const pos = finishOrder.indexOf(m);
            ctx.save();
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
            if (pos >= 0) {
                // Once a team scores, its label becomes the pick it just won.
                ctx.font = '700 11px "DM Sans", system-ui, sans-serif';
                ctx.fillStyle = pos === 0 ? '#fbbf24' : 'rgba(244,244,245,0.88)';
                ctx.fillText(pickLabel(pos), x, y - r - 7);
            } else {
                ctx.font = 'bold 10px "DM Sans", Arial';
                ctx.fillStyle = m.color;
                ctx.fillText(m.name, x, y - r - 7);
            }
            ctx.restore();
        });

        if (!raceStarted) {
            ctx.save();
            ctx.font = '600 13px "DM Sans", system-ui, sans-serif';
            ctx.fillStyle = 'rgba(244,244,245,0.32)'; ctx.textAlign = 'center';
            ctx.fillText('Kick off to set your draft order', W / 2, 150);
            ctx.restore();
        }

        ctx.restore(); // end world-space

        // Live leaderboard (screen space)
        if (raceStarted) {
            const ranked = [...marbles].sort((a, b) => {
                if (a.finished && !b.finished) return -1;
                if (!a.finished && b.finished) return 1;
                if (a.finished && b.finished) return a.finishTime - b.finishTime;
                return b.body.position.y - a.body.position.y;
            });
            const panelW = 172;
            const panelX = W - panelW - 8;
            const bh = 22 + ranked.length * 18;
            ctx.save();
            ctx.fillStyle = 'rgba(18,18,22,0.82)';
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(panelX, 8, panelW, bh, 10); } else ctx.rect(panelX, 8, panelW, bh);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(panelX, 8, panelW, bh, 10); ctx.stroke(); }
            ctx.font = '700 9px "DM Sans", system-ui, sans-serif'; ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(244,244,245,0.4)';
            ctx.fillText('DRAFT ORDER', panelX + 12, 22);
            ranked.forEach((m, i) => {
                const yy = 38 + i * 18;
                ctx.textAlign = 'left';
                ctx.font = '600 11px "DM Sans", system-ui, sans-serif';
                ctx.fillStyle = 'rgba(244,244,245,0.4)';
                ctx.fillText(`${i + 1}`, panelX + 10, yy);
                ctx.fillStyle = m.color;
                ctx.beginPath(); ctx.arc(panelX + 26, yy - 4, 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = m.finished ? 'rgba(244,244,245,0.55)' : 'rgba(244,244,245,0.92)';
                ctx.fillText(m.name, panelX + 36, yy);

                // Distance still to travel, in the language of the field.
                ctx.textAlign = 'right';
                ctx.font = '600 10px "DM Sans", system-ui, sans-serif';
                ctx.fillStyle = m.finished ? 'rgba(52,211,153,0.9)' : 'rgba(244,244,245,0.42)';
                ctx.fillText(
                    m.finished ? pickLabel(finishOrder.indexOf(m)) : `${Math.ceil(yardsToGoAt(m.body.position.y))} yd`,
                    panelX + panelW - 10,
                    yy,
                );
            });
            ctx.restore();
        }

        // Field-position strip (screen space)
        if (raceStarted) {
            const barW = W - 20, barH = 10, bx = 10, by = VIEW_H - 18;
            const ezW = 26;
            const driveW = barW - ezW;
            ctx.save();

            ctx.fillStyle = 'rgba(10,28,18,0.92)';
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 4); ctx.fill(); }
            else ctx.fillRect(bx, by, barW, barH);

            ctx.fillStyle = 'rgba(255,255,255,0.16)';
            for (let k = 1; k < 10; k++) ctx.fillRect(bx + driveW * (k / 10), by, 1, barH);

            ctx.fillStyle = 'rgba(16,185,129,0.42)';
            ctx.fillRect(bx + driveW, by, ezW, barH);

            marbles.forEach(m => {
                const gained = (m.body.position.y - OWN_GOAL_Y) / (GOAL_Y - OWN_GOAL_Y);
                const px = m.finished
                    ? bx + driveW + ezW / 2
                    : bx + Math.max(0, Math.min(1, gained)) * driveW;
                ctx.fillStyle = m.color;
                ctx.beginPath();
                ctx.arc(px, by + barH / 2, 4.5, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }
    }

    // ── Boot ───────────────────────────────────────────────────────────
    setup();

    // ── Public controller ──────────────────────────────────────────────
    return {
        setCount(n, names, colors) {
            if (raceStarted) return;
            marbleCount = n;
            selNames = Array.from({ length: n }, (_, i) => (names && names[i] != null) ? names[i] : DEFAULT_NAMES[i % DEFAULT_NAMES.length]);
            selColors = Array.from({ length: n }, (_, i) => (colors && colors[i]) ? colors[i] : DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
            resetRace();
        },
        updateTeam(i, { name, color }) {
            if (name != null) {
                selNames[i] = name;
                if (marbles[i]) marbles[i].name = name.trim() || DEFAULT_NAMES[i % DEFAULT_NAMES.length];
            }
            if (color != null) {
                selColors[i] = color;
                if (marbles[i]) {
                    marbles[i].color = color;
                    marbles[i].body.render.fillStyle = color;
                    marbles[i].body.render.strokeStyle = lighten(color, 45);
                }
            }
        },
        setShuffle(v) { shuffleStart = !!v; },
        start() { startRace(); },
        reset() { resetRace(); },
        newCourse() { newCourse(); },
        isRacing() { return raceStarted; },
        destroy() {
            destroyed = true;
            clearInterval(timerHandle);
            try {
                Events.off(render, 'afterRender', drawOverlay);
                Events.off(engine, 'collisionStart', onCollision);
                Events.off(engine, 'afterUpdate', afterUpdate);
                Render.stop(render);
                Runner.stop(runner);
                Composite.clear(engine.world, false);
                Engine.clear(engine);
                render.canvas = null;
                render.context = null;
                render.textures = {};
            } catch (e) { /* no-op on teardown */ }
        },
    };
}
