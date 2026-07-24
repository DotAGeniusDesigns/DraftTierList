// Marble-race engine for the Draft Lottery tool.
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
    'Blobby', 'Zippy', 'Thunder', 'Flash', 'Zigzag',
    'Comet', 'Rocket', 'Sparky', 'Blaze', 'Storm',
    'Pixel', 'Turbo', 'Nexus', 'Orbit', 'Zephyr',
    'Cobalt', 'Ember', 'Glitch', 'Vortex', 'Neon',
];

export function makeDefaultTeams(n) {
    return Array.from({ length: n }, (_, i) => ({
        name: `Team ${i + 1}`,
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));
}

export function createMarbleRace(canvas, callbacks = {}) {
    const { onTimer, onPhase, onFinish } = callbacks;
    const { Engine, Render, Runner, Bodies, Body, Composite, Events } = Matter;

    // ── Canvas / physics dimensions ────────────────────────────────────
    // W / VIEW_H and the gap geometry (COLS, NODE_R, ROW_DY, HALF) are load-
    // bearing — see engine notes — but the world *height* is free to change:
    // it only sets how many rows the course has. Trimmed ~20% for a shorter
    // race. Keep BOT and the H-55 finish sensor in sync with H (below).
    const W = 700;
    const H = 3600;    // full world height (was 4500 → ~20% shorter course)
    const VIEW_H = 560; // visible viewport height

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
        const TOP = 180, BOT = H - 155;              // last row; finish sensor lives at H-55
        const slotX = j => NODE_R + j * HALF;

        const zones = [
            { fillStyle: '#061820', strokeStyle: '#0891b2', lineWidth: 2 },
            { fillStyle: '#100a28', strokeStyle: '#7c3aed', lineWidth: 2 },
            { fillStyle: '#061a0c', strokeStyle: '#16a34a', lineWidth: 2 },
            { fillStyle: '#1a0e00', strokeStyle: '#d97706', lineWidth: 2 },
            { fillStyle: '#00141a', strokeStyle: '#0d9488', lineWidth: 2 },
        ];
        for (let i = zones.length - 1; i > 0; i--) {
            const j = ri(0, i);
            [zones[i], zones[j]] = [zones[j], zones[i]];
        }
        const zoneH = (BOT - TOP) / zones.length;
        const zoneSty = y => zones[Math.min(zones.length - 1, Math.floor((y - TOP) / zoneH))];

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

        out.push(Bodies.rectangle(W / 2, H - 55, W, 16, {
            isStatic: true, isSensor: true, label: 'finishLine',
            render: { fillStyle: 'rgba(0,0,0,0)', strokeStyle: 'transparent', lineWidth: 0 }
        }));

        return out;
    }

    // ══════════════════════════════════════════════════════════════════
    //  PHYSICS BOOTSTRAP
    // ══════════════════════════════════════════════════════════════════
    function setup() {
        if (decomp && Matter.Common && Matter.Common.setDecomp) Matter.Common.setDecomp(decomp);
        engine = Engine.create({ gravity: { y: 0.025 } });

        render = Render.create({
            canvas,
            engine,
            options: { width: W, height: VIEW_H, wireframes: false, background: '#0d0d10', hasBounds: true },
        });
        render.bounds = { min: { x: 0, y: 0 }, max: { x: W, y: VIEW_H } };

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
        const now = Date.now();
        marbles.forEach(m => {
            if (m.finished || !m._stuckT) return;
            if (now - m._stuckT < 1500) return;
            const progress = m.body.position.y - m._stuckY;
            m._stuckT = now;
            m._stuckY = m.body.position.y;
            if (progress < 40) {
                Body.setVelocity(m.body, { x: rnd(-2, 2), y: 3 + Math.random() * 2 });
            }
        });
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
                render: { fillStyle: color, strokeStyle: lighten(color, 45), lineWidth: 2 },
            });
            const name = (selNames[i] || '').trim() || DEFAULT_NAMES[i % DEFAULT_NAMES.length];
            marbles.push({ body, color, name, index: i, finished: false, finishTime: 0, trail: [] });
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

    // ── Finish detection ───────────────────────────────────────────────
    function onCollision(event) {
        if (!raceStarted) return;
        event.pairs.forEach(({ bodyA, bodyB }) => {
            const mBody = bodyA.label === 'finishLine' ? bodyB
                : bodyB.label === 'finishLine' ? bodyA : null;
            if (mBody) {
                const m = marbles.find(x => x.body === mBody && !x.finished);
                if (m) {
                    m.finished = true;
                    m.finishTime = Date.now() - startTime;
                    finishOrder.push(m);
                    if (finishOrder.length >= marbleCount && !winScheduled) {
                        winScheduled = true;
                        setTimeout(finishRace, 600);
                    }
                }
                return;
            }

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
        const targetY = Math.max(0, ref.body.position.y - VIEW_H * 0.5);
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

        // Finish line
        ctx.save();
        ctx.setLineDash([16, 8]);
        ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(52,211,153,0.5)'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(0, H - 55); ctx.lineTo(W, H - 55); ctx.stroke();
        ctx.setLineDash([]); ctx.shadowBlur = 0;
        ctx.font = '600 12px "DM Sans", system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.fillStyle = '#34d399';
        ctx.fillText('PICK 1.01', W / 2, H - 64);
        ctx.restore();

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

        // Marbles
        marbles.forEach(m => {
            const { x, y } = m.body.position;
            const r = 13;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.3);
            g.addColorStop(0, m.color + '99'); g.addColorStop(1, 'transparent');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.beginPath(); ctx.arc(x - r * .32, y - r * .38, r * .36, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.44)'; ctx.fill();
            ctx.restore();
            if (!m.finished) {
                ctx.save();
                ctx.font = 'bold 10px "DM Sans", Arial'; ctx.textAlign = 'center';
                ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
                ctx.fillStyle = m.color;
                ctx.fillText(m.name, x, y - r - 5);
                ctx.restore();
            }
            const pos = finishOrder.indexOf(m);
            if (pos >= 0 && pos < 3) {
                ctx.save(); ctx.font = '15px Arial'; ctx.textAlign = 'center';
                ctx.fillText(['🥇', '🥈', '🥉'][pos], x, y - r - 17);
                ctx.restore();
            }
        });

        if (!raceStarted) {
            ctx.save();
            ctx.font = '600 13px "DM Sans", system-ui, sans-serif';
            ctx.fillStyle = 'rgba(244,244,245,0.28)'; ctx.textAlign = 'center';
            ctx.fillText('Drop the marbles to set your draft order', W / 2, 150);
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
            const bh = 22 + ranked.length * 18;
            ctx.save();
            ctx.fillStyle = 'rgba(18,18,22,0.82)';
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(W - 150, 8, 142, bh, 10); } else ctx.rect(W - 150, 8, 142, bh);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(W - 150, 8, 142, bh, 10); ctx.stroke(); }
            ctx.font = '700 9px "DM Sans", system-ui, sans-serif'; ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(244,244,245,0.4)';
            ctx.fillText('DRAFT ORDER', W - 138, 22);
            ctx.font = '600 11px "DM Sans", system-ui, sans-serif';
            ranked.forEach((m, i) => {
                const yy = 38 + i * 18;
                ctx.fillStyle = 'rgba(244,244,245,0.4)';
                ctx.fillText(`${i + 1}`, W - 140, yy);
                ctx.fillStyle = m.color;
                ctx.beginPath(); ctx.arc(W - 124, yy - 4, 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = m.finished ? 'rgba(244,244,245,0.55)' : 'rgba(244,244,245,0.92)';
                ctx.fillText(`${m.name}${m.finished ? '  ✓' : ''}`, W - 114, yy);
            });
            ctx.restore();
        }

        // Progress bar (screen space)
        if (raceStarted) {
            const barW = W - 20, barH = 6, bx = 10, by = VIEW_H - 14;
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(bx, by, barW, barH, 3); else ctx.rect(bx, by, barW, barH);
            ctx.fill();
            marbles.forEach(m => {
                const pct = Math.min(1, m.body.position.y / (H - 55));
                ctx.fillStyle = m.color;
                ctx.beginPath();
                const px = bx + pct * barW;
                ctx.arc(px, by + barH / 2, 5, 0, Math.PI * 2);
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
