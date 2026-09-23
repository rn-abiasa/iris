import { createElement, useEffect, useRef } from "react";

// =============================================================================
// paintEngine.js — generic wash-brush "painting in progress" reveal engine.
//
// Holds ONLY things that are safe to share between scenes WITHOUT imposing any
// composition on the picture:
//   • pure colour utilities        (hexRgb, mixHex, hexHsl/hslHex, vivid, clamp01)
//   • pure geometry utilities      (jitterEllipse, rosette, bandPolygon, bboxOf)
//   • the shared style dials (S)   — the same hand painted every scene
//   • p5.brush wrappers            (fillStyle / washStyle / strokeStyle /
//                                   flushWash / ensureBrushes with an
//                                   once-per-page-load scale guard)
//   • shared mark-making primitives (softBlobDraw, bloom*, drawStrand, ...)
//   • the reveal machine           (createPaintEngine → buffer pair, timeline
//                                   D()/dMarks()/dTouches(), beginStroke /
//                                   foldStroke / revealSlice / paintUpTo /
//                                   drawFrame, resize-aware p5 instance-mode
//                                   bootstrapping)
//
// NOTHING in this module knows about gardens, lakes, mountains, horizons or
// hero objects. Every composition assumption lives in the per-scene files in
// src/components/backgrounds/, which define their own buildScene(W, H, m, h).
// =============================================================================

// Module-level guard: p5.brush keeps a single brush registry per module load,
// so scaleBrushes() (which multiplies registered weights in place) must only
// run once per page load, even when components mount/remount (React
// StrictMode, route changes, resize). The custom brush definitions are added
// to that same shared registry, so a single guarded call covers every p5
// instance on the page.
let brushesScaled = false;

// -----------------------------------------------------------------------------
// Shared style dials — the tuning every scene was built against. Identical in
// every background file so the brushwork reads as one hand.
// -----------------------------------------------------------------------------
export const BASE_S = {
  water: 0.55,
  coverage: 0.84,
  density: 0.5,
  scale: 1.1,
  soft: 0.7,
  glaze: 0.3,
  touch: 0.2,
  detail: 0.45,
  brushSize: 1.49,
  vivid: 0.45,
  flower: 1.8,
};
// Kept for backward compatibility — nothing outside this file should read
// this directly; scenes always get their dials through `helpers.S`, which
// may be a device-scaled copy of this (see createPaintEngine below).
export const S = BASE_S;

// The warm "kertas" every scene is painted on.
export const DEFAULT_PAPER = "#f4eee2";

// -----------------------------------------------------------------------------
// Pure colour utilities
// -----------------------------------------------------------------------------

export function hexRgb(h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function mixHex(a, b, t) {
  const A = hexRgb(a),
    B = hexRgb(b);
  return (
    "#" +
    A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")
  );
}

export function hexHsl(hex) {
  const [r, g, b] = hexRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    l = (max + min) / 2;
  let h = 0,
    s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

export function hslHex(h, s, l) {
  const f = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s,
      p = 2 * l - q;
    r = f(p, q, h + 1 / 3);
    g = f(p, q, h);
    b = f(p, q, h - 1 / 3);
  }
  return (
    "#" +
    [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")
  );
}

export function vivid(hex, amt) {
  if (!amt) return hex;
  const [h, s, l] = hexHsl(hex);
  return hslHex(h, s + (1 - s) * amt, l - (l - 0.45) * amt * 0.5);
}

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
// -----------------------------------------------------------------------------
// Pure geometry utilities.
// Each random-dependent helper takes `rnd(a, b)` (scaled a → b), which
// defaults to Math.random so the functions stay usable without a p5 instance.
// The engine binds them to p.random when it assembles the scene helpers, so
// every scene stays deterministic stroke-by-stroke under p.randomSeed().
// -----------------------------------------------------------------------------

const defaultRnd = (a, b) => a + Math.random() * (b - a);

export function jitterEllipse(cx, cy, rx, ry, n, jitter, rot = 0, rnd = defaultRnd) {
  const pts = [],
    a0 = rnd(0, Math.PI * 2),
    cr = Math.cos(rot),
    sr = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2,
      k = 1 + rnd(-jitter, jitter);
    const x = Math.cos(a) * rx * k,
      y = Math.sin(a) * ry * k;
    pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return pts;
}

export function rosette(cx, cy, r, lobes, inner, rot = 0, jit = 0.05, rnd = defaultRnd) {
  const n = Math.max(24, lobes * 6),
    pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2,
      k = inner + (1 - inner) * (0.5 + 0.5 * Math.cos(lobes * a));
    const rad = r * k * (1 + rnd(-jit, jit));
    pts.push([cx + Math.cos(a + rot) * rad, cy + Math.sin(a + rot) * rad]);
  }
  return pts;
}

export function bandPolygon(width, y0, y1, wobble, n = 9, rnd = defaultRnd) {
  const top = [],
    bottom = [];
  for (let i = 0; i <= n; i++) {
    const x = -10 + (width + 20) * (i / n);
    top.push([x, y0 + rnd(-wobble, wobble)]);
    bottom.push([x, y1 + rnd(-wobble, wobble)]);
  }
  return top.concat(bottom.reverse());
}

export function bboxOf(pts, pad, W, H) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [
    Math.max(0, Math.floor(x0 - pad)),
    Math.max(0, Math.floor(y0 - pad)),
    Math.min(W, Math.ceil(x1 + pad)),
    Math.min(H, Math.ceil(y1 + pad)),
  ];
}

// -----------------------------------------------------------------------------
// p5.brush bootstrapping.
// `flick`/`rim` are the two custom brushes the whole style is built on; they
// land in the shared registry exactly once. scaleBrushes() also runs at most
// once per page load (see module-level comment).
// -----------------------------------------------------------------------------

export function ensureBrushes(brush, scaleAmt) {
  if (brushesScaled) return;
  brush.add("flick", {
    weight: 0.7,
    vibration: 0.12,
    definition: 0.9,
    quality: 0.8,
    opacity: 200,
    spacing: 0.1,
    pressure: { curve: [0.25, 0.25], min_max: [1.1, 0.85] },
  });
  brush.add("rim", {
    weight: 0.45,
    vibration: 0.35,
    definition: 0.7,
    quality: 0.8,
    opacity: 190,
    spacing: 0.1,
    pressure: { curve: [0.15, 0.2], min_max: [1.2, 1] },
  });
  brush.scaleBrushes(scaleAmt);
  brushesScaled = true;
}

// -----------------------------------------------------------------------------
// The reveal machine.
// createPaintEngine({ buildScene, ground, LOOP_MS }) returns a React component
// that boots a p5 instance-mode sketch (plus p5.brush) sized to its container,
// lets `buildScene(W, H, m, helpers)` describe the picture as an ordered list
// of reveal strokes, and plays that list forward exactly once.
// -----------------------------------------------------------------------------

export function createPaintEngine({ buildScene, ground = DEFAULT_PAPER, LOOP_MS = 9000 }) {
  // The returned component takes only presentation props — no `scene` prop,
  // no palette: all of that is baked into the buildScene it was created with.
  return function PaintBackground({ className = "", freeze = null }) {
    const containerRef = useRef(null);

    useEffect(() => {
      let p5Instance = null;
      let cancelled = false;
      let resizeTimer = null;

      async function mount() {
        const { default: p5 } = await import("p5");
        const brush = await import("p5.brush");
        if (cancelled || !containerRef.current) return;

        const sketch = (p) => {
          brush.instance(p);

          // ---- device-aware perf tuning ------------------------------
          // Phones are the common case here and the reveal-animation +
          // WEBGL double-buffer technique is not cheap, so scale the whole
          // scene down rather than just hoping it's fast enough:
          //  - fewer strokes (density/detail/touch) on narrow screens
          //  - a shorter one-time reveal so it settles faster
          //  - a person who has asked their OS for reduced motion gets the
          //    finished painting immediately instead of the animated reveal
          const isMobile =
            typeof window !== "undefined" &&
            window.matchMedia("(max-width: 640px)").matches;
          const reduceMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const S = isMobile
            ? {
                ...BASE_S,
                density: BASE_S.density * 0.45,
                detail: BASE_S.detail * 0.55,
                touch: BASE_S.touch * 0.6,
              }
            : BASE_S;
          const loopMs = isMobile ? Math.min(LOOP_MS, 6000) : LOOP_MS;

          let W = 600,
            H = 600,
            m = 600;
          let buf, paint;
          let strokes = [],
            idx = 0;
          let startMs = null;

          const rr = (a, b) => p.random(a, b);
          const pickOne = (arr) => arr[Math.floor(p.random(arr.length))];

          // ---- p5.brush wrappers (bound to this instance) ----------------

          const fillStyle = (color, opacity, bleed, texture, border) => {
            brush.noStroke();
            brush.noHatch();
            brush.noWash();
            brush.fill(color, opacity);
            brush.fillBleed(bleed, "out");
            brush.fillTexture(texture, border);
          };
          const washStyle = (color, opacity) => {
            brush.noStroke();
            brush.noHatch();
            brush.noFill();
            brush.wash(color, opacity);
          };
          const strokeStyle = (name, color, weight) => {
            brush.noFill();
            brush.noWash();
            brush.noHatch();
            brush.set(name, color, weight);
          };
          const flushWash = () => {
            brush.noStroke();
            brush.noHatch();
            brush.noWash();
            brush.fill("#000000", 0);
            brush.fillBleed(0);
            brush.fillTexture(0, 0);
            brush.polygon([
              [-8, -8],
              [-6, -8],
              [-6, -6],
            ]);
          };

          // ---- shared mark-making primitives (bound) ---------------------

          // Softly wobbled wash blob — the base of hills, bushes, ripples...
          const softBlobDraw = (x, y, rx, ry, color, opacity, bleed, texture, rot = 0, jit = 0.12) => {
            const w = S.water - 0.5;
            fillStyle(color, Math.round(opacity - w * 60), clamp01(bleed + w * 0.4), clamp01(texture + w * 0.2), 0.3);
            brush.polygon(jitterEllipse(x, y, rx, ry, 14, jit, rot));
          };
          const bloomFill = (color, opacity, bleed) => {
            fillStyle(color, opacity, clamp01(bleed + S.water * 0.3), 0.5, 0.4);
          };
          const bloomShape = (x, y, r, lobes, inner, color, bleed = 0.3, solid = 0.72) => {
            const rot = rr(0, Math.PI * 2);
            washStyle(color, 255);
            brush.polygon(rosette(x, y, r * solid, lobes, inner, rot, 0.08));
            bloomFill(color, 250, bleed);
            brush.polygon(rosette(x, y, r, lobes, inner, rot, 0.05));
          };
          const centerDot = (x, y, r, color, opacity = 250) => {
            washStyle(color, opacity);
            brush.polygon(jitterEllipse(x, y, r, r * rr(0.85, 1), 12, 0.14));
          };
          const drawBlossom = (x, y, s, F) => {
            bloomShape(x, y, s * 0.9, 5, 0.5, p.random() < 0.5 ? F.light : F.mid, 0.26, 0.74);
            centerDot(x, y, 0.14 * s, F.center, 240);
          };
          const drawStrand = (x0, y0, len, sway, color, weight, name = "flick") => {
            brush.field("hand");
            const watery = S.water > 0.6 && p.random() < (S.water - 0.6) * 1.5;
            strokeStyle(watery ? "marker" : name, color, weight * S.brushSize * (watery ? 2 : 1));
            brush.spline(
              [
                [x0, y0],
                [x0 + sway * 0.5 + rr(-2, 2), y0 + len * 0.5],
                [x0 + sway, y0 + len],
              ],
              0.6
            );
            brush.noField();
          };

          // Palette → usable colour sets (shared recipes, not composition).
          const flowerCols = (C) => {
            const a = C.accents,
              h = C.highlights,
              v = S.vivid;
            const light = vivid(a[0], v),
              mid = vivid(a[1] || a[0], v),
              deep = vivid(a[2] || a[1] || a[0], v);
            return {
              light,
              mid,
              deep,
              base: a[3] || mixHex(light, "#ffffff", 0.45),
              center: vivid(h[0] || "#e6b94f", v),
              pale: h[1] || mixHex(light, "#ffffff", 0.7),
              shade: mixHex(deep, "#3b3550", 0.45),
            };
          };
          const foliageCols = (C) => {
            const f = C.foliage;
            return {
              light: f[3] || mixHex(f[0], "#ffffff", 0.35),
              mid: f[0],
              deep: f[1] || f[0],
              shade: f[2] || mixHex(f[0], "#1f2f2a", 0.5),
            };
          };

          // ---- the timeline record --------------------------------------

          const D = (fn, bb, axis, dir, dur, gap = 60) => ({ fn, bb, axis, dir, dur, gap });
          const rdir = () => (p.random() < 0.5 ? 1 : -1);
          const raxis = () => (p.random() < 0.5 ? "x" : "y");
// ---- timeline item builders (generic, fully parameterised) ----

          const dWash = (color, opacity) => {
            const pts = [
              [-10, -10],
              [W + 10, -10],
              [W + 10, H + 10],
              [-10, H + 10],
            ];
            return D(
              () => {
                washStyle(color, opacity);
                brush.polygon(pts);
              },
              [0, 0, W, H],
              "x",
              rdir(),
              700,
              120
            );
          };
          const dBand = (y0, y1, color, opacity, wobble) => {
            const pts = bandPolygon(W, y0, y1, wobble);
            const water = S.water;
            const bleed = 0.25 + water * 0.5,
              texture = 0.3 + water * 0.5;
            return D(
              () => {
                fillStyle(color, opacity, bleed, texture, 0.3);
                brush.polygon(pts);
              },
              bboxOf(pts, m * 0.25, W, H),
              "x",
              rdir(),
              600,
              100
            );
          };
          const dBlob = (x, y, rx, ry, color, opacity, bleed, texture, rot = 0, jit = 0.12, dur = 420) => {
            const big = Math.max(rx, ry),
              pad = big * 0.9 + 14;
            const bb = [Math.max(0, x - big - pad), Math.max(0, y - big - pad), Math.min(W, x + big + pad), Math.min(H, y + big + pad)];
            return D(() => softBlobDraw(x, y, rx, ry, color, opacity, bleed, texture, rot, jit), bb.map(Math.round), raxis(), rdir(), dur, 80);
          };
          const dStrand = (x0, y0, len, sway, color, weight, name) => {
            const bb = bboxOf(
              [
                [x0, y0],
                [x0 + sway, y0 + len],
              ],
              14 + weight * 5 * S.brushSize,
              W,
              H
            );
            return D(() => drawStrand(x0, y0, len, sway, color, weight, name), bb, "y", Math.sign(len) || 1, 120 + Math.abs(len) * 1.2, 30);
          };
          const dFlick = (x, y, len, a, color, weight) => {
            const bb = bboxOf(
              [
                [x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2],
                [x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2],
              ],
              10 + weight * 5,
              W,
              H
            );
            const axis = Math.abs(Math.cos(a)) >= Math.abs(Math.sin(a)) ? "x" : "y";
            return D(
              () => {
                strokeStyle("flick", color, weight * S.brushSize);
                brush.line(x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2, x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2);
              },
              bb,
              axis,
              rdir(),
              90,
              25
            );
          };
          const dMarks = (marks, dur = 220, gap = 40) => {
            const items = [];
            for (let i = 0; i < marks.length; i += 8) {
              const b = marks.slice(i, i + 8);
              let pts = [];
              for (const d of b) pts = pts.concat(d.pts);
              items.push(
                D(
                  () => {
                    for (const d of b) {
                      washStyle(d.color, d.op);
                      brush.polygon(d.pts);
                    }
                  },
                  bboxOf(pts, 10, W, H),
                  raxis(),
                  rdir(),
                  dur,
                  gap
                )
              );
            }
            return items;
          };
          const dTouches = (points, C, count, angleFn, sizeMul = 1) => {
            const items = [];
            count = Math.round(count * (0.4 + 0.6 * S.detail));
            for (let i = 0; i < count; i++) {
              const pt = points.length ? pickOne(points) : [rr(0, W), rr(0, H), 10];
              const x = pt[0] + rr(-pt[2], pt[2]),
                y = pt[1] + rr(-pt[2] * 0.6, pt[2] * 0.6);
              const color = p.random() < 0.85 ? pickOne(C.highlights) : pickOne(C.accents);
              items.push(dFlick(x, y, rr(6, 16) * S.scale * sizeMul * (m / 600) * 3, angleFn(), color, rr(0.6, 1.1) * S.scale));
            }
            return items;
          };

          // ---- the helpers object handed to each scene's buildScene ------

          const helpers = {
            p,
            brush,
            S,
            rr,
            pickOne,
            hexRgb,
            mixHex,
            hexHsl,
            hslHex,
            vivid,
            clamp01,
            jitterEllipse: (cx, cy, rx, ry, n, jitter, rot = 0) => jitterEllipse(cx, cy, rx, ry, n, jitter, rot, rr),
            rosette: (cx, cy, r, lobes, inner, rot = 0, jit = 0.05) => rosette(cx, cy, r, lobes, inner, rot, jit, rr),
            bandPolygon: (y0, y1, wobble, n = 9) => bandPolygon(W, y0, y1, wobble, n, rr),
            bboxOf,
            fillStyle,
            washStyle,
            strokeStyle,
            flushWash,
            softBlobDraw,
            bloomFill,
            bloomShape,
            centerDot,
            drawBlossom,
            drawStrand,
            flowerCols,
            foliageCols,
            D,
            rdir,
            raxis,
            dWash,
            dBand,
            dBlob,
            dStrand,
            dFlick,
            dMarks,
            dTouches,
          };
// ---- reveal engine state --------------------------------------

          function loadTimeline() {
            // NOTE: the scene seeds p.random/p.noise itself at the top of its
            // buildScene, so the engine stays free of scene-specific state.
            strokes = buildScene(W, H, m, helpers);
            let cursor = 0;
            for (const s of strokes) {
              s.seed = Math.floor(p.random() * 1e9);
              s.begun = false;
              s.start = cursor;
              cursor += s.dur + s.gap;
            }
            const k = loopMs / cursor;
            for (const s of strokes) {
              s.start *= k;
              s.dur *= k;
              s.end = s.start + s.dur;
            }
            idx = 0;
            paint.background(ground);
            p.background(ground);
          }

          function beginStroke(s) {
            buf.clear();
            buf.push();
            buf.translate(-W / 2, -H / 2);
            buf.image(paint, 0, 0, W, H);
            p.randomSeed(s.seed);
            p.noiseSeed(s.seed);
            s.fn();
            flushWash();
            buf.pop();
            s.begun = true;
            s.p = 0;
          }
          function foldStroke() {
            paint.push();
            paint.translate(-W / 2, -H / 2);
            paint.image(buf, 0, 0, W, H);
            paint.pop();
          }
          function revealSlice(s) {
            const [x0, y0, x1, y1] = s.bb;
            if (x1 <= x0 || y1 <= y0 || s.p <= 0) return;
            if (s.axis === "x") {
              const w = Math.round((x1 - x0) * s.p);
              if (w <= 0) return;
              const a = s.dir > 0 ? x0 : x1 - w;
              p.image(buf, a, y0, w, y1 - y0, a, y0, w, y1 - y0);
            } else {
              const hh = Math.round((y1 - y0) * s.p);
              if (hh <= 0) return;
              const a = s.dir > 0 ? y0 : y1 - hh;
              p.image(buf, x0, a, x1 - x0, hh, x0, a, x1 - x0, hh);
            }
          }
          function paintUpTo(t) {
            while (idx < strokes.length && strokes[idx].start <= t) {
              const s = strokes[idx];
              if (!s.begun) beginStroke(s);
              s.p = Math.min(1, (t - s.start) / s.dur);
              if (s.p >= 1) {
                foldStroke();
                idx++;
              } else break;
            }
          }
          function drawFrame(t) {
            paintUpTo(t);
            p.image(paint, 0, 0, W, H);
            const s = strokes[idx];
            if (s && s.begun) revealSlice(s);
          }

          function sizeToContainer() {
            const el = containerRef.current;
            W = Math.max(1, Math.round(el ? el.clientWidth : window.innerWidth));
            H = Math.max(1, Math.round(el ? el.clientHeight : window.innerHeight));
            m = Math.min(W, H);
          }

          p.setup = () => {
            // Retina/high-DPR phones otherwise render at 2-3x the pixel
            // area for no visible gain on a soft painterly background —
            // this is the single biggest perf lever for mobile.
            p.pixelDensity(1);
            sizeToContainer();
            const cnv = p.createCanvas(W, H, p.WEBGL);
            cnv.parent(containerRef.current);
            ensureBrushes(brush, (3 * m) / 600);
            paint = p.createGraphics(W, H, p.WEBGL);
            buf = p.createGraphics(W, H, p.WEBGL);
            paint.imageMode(p.CORNER);
            buf.imageMode(p.CORNER);
            brush.load(buf);
            buf.push();
            buf.translate(-W / 2, -H / 2);
            fillStyle("#7a86bd", 200, 0.3, 0.5, 0.3);
            brush.circle(W / 2, H / 2, 12);
            buf.pop();
            buf.clear();
            p.imageMode(p.CORNER);
            p.background(ground);
            loadTimeline();
          };

          p.draw = () => {
            p.translate(-W / 2, -H / 2);
            const effectiveFreeze = freeze !== null ? freeze : reduceMotion ? 1 : null;
            if (effectiveFreeze !== null) {
              drawFrame(clamp01(effectiveFreeze) * loopMs);
              p.noLoop();
              return;
            }
            if (startMs === null) startMs = p.millis();
            const now = p.millis() - startMs;
            drawFrame(Math.min(now, loopMs));
            if (now >= loopMs) p.noLoop();
          };
        };

        p5Instance = new p5(sketch, containerRef.current);
      }

      mount();

      // Debounced resize: tear the sketch down and remount it so the canvas
      // always matches the container size and the painting replays once.
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (p5Instance) p5Instance.remove();
          p5Instance = null;
          if (!cancelled) mount();
        }, 300);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        cancelled = true;
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", handleResize);
        if (p5Instance) p5Instance.remove();
      };
    }, [freeze]);

    // NOTE: this file is plain `.js`, so the container is built without JSX.
    return createElement(
      "div",
      {
        ref: containerRef,
        "aria-hidden": "true",
        className: `pointer-events-none absolute inset-0 overflow-hidden ${className}`,
      }
    );
  };
}