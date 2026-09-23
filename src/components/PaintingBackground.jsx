import { useEffect, useRef } from "react";

// Module-level guard: p5.brush's scaleBrushes() multiplies brush sizes
// in place, so it must only ever run once per page load, even if this
// component mounts/remounts (React StrictMode, route changes, resize).
let brushesScaled = false;

// ---- pure color/geometry helpers (no p5 instance needed) -------------

function hexRgb(h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function mixHex(a, b, t) {
  const A = hexRgb(a),
    B = hexRgb(b);
  return (
    "#" +
    A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")
  );
}

function hexHsl(hex) {
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

function hslHex(h, s, l) {
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

function vivid(hex, amt) {
  if (!amt) return hex;
  const [h, s, l] = hexHsl(hex);
  return hslHex(h, s + (1 - s) * amt, l - (l - 0.45) * amt * 0.5);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

const bboxOf = (pts, pad, W, H) => {
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
};

// The dials this style was tuned with — shared by every scene so the
// brushwork feels like the same hand painted all of them.
const S = {
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

// Every scene shares the same paper tone (`ground`) and the same
// composition scaffolding (sky, horizon bands, winding path, grass beds) —
// only the palette and the scene-specific focal elements change, so each
// page reads as "the same world, different spot on the path."
const SCENES = {
  garden: {
    kind: "garden",
    palette: {
      seed: 1874,
      ground: "#f4eee2",
      washes: ["#e6d6b8", "#d9c9a6", "#c8b8d6", "#b6c9a2"],
      foliage: ["#7fa565", "#5b8452", "#3c5f45", "#b9cf8a"],
      accents: ["#8a6bb8", "#6c4fa0", "#4e3a85", "#c9b3e0", "#b28fd0"],
      highlights: ["#f4e3a6", "#fff6e6"],
    },
  },
  lake: {
    kind: "lake",
    palette: {
      seed: 2041,
      ground: "#f4eee2",
      washes: ["#dce6ea", "#c9dbe0", "#aac4d6", "#9fc2b8"],
      foliage: ["#5f8a78", "#3f6b5c", "#2c4a40", "#a8c9a0"],
      accents: ["#e8a7c0", "#c98fb0", "#7f9fc4", "#d7e6ee", "#f0c9dc"],
      highlights: ["#f4e7b0", "#fff8ea"],
    },
  },
  mountains: {
    kind: "mountains",
    palette: {
      seed: 3092,
      ground: "#f4eee2",
      washes: ["#e7d9c9", "#d7c6d8", "#b9a8c6", "#8f97b6"],
      foliage: ["#4c6b52", "#33503b", "#213328", "#7fa06e"],
      accents: ["#d98a4f", "#c76b4a", "#e0b04a", "#f0d9a0", "#b5522f"],
      highlights: ["#ffd9a0", "#fff3e0"],
    },
  },
  meadow: {
    kind: "meadow",
    palette: {
      seed: 4173,
      ground: "#f4eee2",
      washes: ["#f6e6b8", "#f0d79a", "#e8c26e", "#d9b25a"],
      foliage: ["#8fb85a", "#6f9f45", "#557a34", "#c3dd8a"],
      accents: ["#f2c14e", "#e8853a", "#e0567a", "#fff3c4", "#f29ecb"],
      highlights: ["#fff0b0", "#fff8e0"],
    },
  },
  forest: {
    kind: "forest",
    palette: {
      seed: 5284,
      ground: "#f4eee2",
      washes: ["#e3ead2", "#c7d9ad", "#9fbf8a", "#6f9c6a"],
      foliage: ["#3c6b45", "#274e33", "#183624", "#6fa25c"],
      accents: ["#e0a13f", "#c7466b", "#4f8fc7", "#f0d97a"],
      highlights: ["#fff3c0", "#fffaf0"],
    },
  },
  dusk: {
    kind: "dusk",
    palette: {
      seed: 6395,
      ground: "#f4eee2",
      washes: ["#3a3a63", "#2c2c52", "#1f2140", "#161832"],
      foliage: ["#243428", "#182018", "#0f1610", "#33452f"],
      accents: ["#e9c46a", "#f4a261", "#e0e0f0", "#cdb4db"],
      highlights: ["#ffe9a8", "#fdf6e3"],
    },
  },
};

const LOOP_MS = 9000;

/**
 * Mounts a single-canvas p5 + p5.brush sketch that paints an impressionist
 * scene as an "in progress" watercolor animation, meant to sit behind page
 * content as a decorative background. Every `scene` shares the same paper,
 * brush engine and path/composition scaffolding — only the palette and the
 * focal elements differ — so the pages read as one continuous world.
 *
 * scene: "garden" | "lake" | "mountains" | "meadow" | "forest" | "dusk"
 */
export default function PaintingBackground({ scene = "garden", className = "", freeze = null }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let p5Instance = null;
    let cancelled = false;
    let resizeTimer = null;

    async function mount() {
      const { default: p5 } = await import("p5");
      const brush = await import("p5.brush");
      if (cancelled || !containerRef.current) return;

      const ACTIVE = SCENES[scene] || SCENES.garden;

      const sketch = (p) => {
        brush.instance(p);

        let W = 600,
          H = 600,
          m = 600;
        let buf, paint;
        let strokes = [],
          idx = 0;
        let startMs = null;

        const rr = (a, b) => p.random(a, b);
        const pickOne = (arr) => arr[Math.floor(p.random(arr.length))];

        function jitterEllipse(cx, cy, rx, ry, n, jitter, rot = 0) {
          const pts = [],
            a0 = rr(0, p.TWO_PI),
            cr = Math.cos(rot),
            sr = Math.sin(rot);
          for (let i = 0; i < n; i++) {
            const a = a0 + (i / n) * p.TWO_PI,
              k = 1 + rr(-jitter, jitter);
            const x = Math.cos(a) * rx * k,
              y = Math.sin(a) * ry * k;
            pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
          }
          return pts;
        }

        function rosette(cx, cy, r, lobes, inner, rot = 0, jit = 0.05) {
          const n = Math.max(24, lobes * 6),
            pts = [];
          for (let i = 0; i < n; i++) {
            const a = (i / n) * p.TWO_PI,
              k = inner + (1 - inner) * (0.5 + 0.5 * Math.cos(lobes * a));
            const rad = r * k * (1 + rr(-jit, jit));
            pts.push([cx + Math.cos(a + rot) * rad, cy + Math.sin(a + rot) * rad]);
          }
          return pts;
        }

        function bandPolygon(y0, y1, wobble, n = 9) {
          const top = [],
            bottom = [];
          for (let i = 0; i <= n; i++) {
            const x = -10 + (W + 20) * (i / n);
            top.push([x, y0 + rr(-wobble, wobble)]);
            bottom.push([x, y1 + rr(-wobble, wobble)]);
          }
          return top.concat(bottom.reverse());
        }

        function fillStyle(color, opacity, bleed, texture, border) {
          brush.noStroke();
          brush.noHatch();
          brush.noWash();
          brush.fill(color, opacity);
          brush.fillBleed(bleed, "out");
          brush.fillTexture(texture, border);
        }
        function washStyle(color, opacity) {
          brush.noStroke();
          brush.noHatch();
          brush.noFill();
          brush.wash(color, opacity);
        }
        function strokeStyle(name, color, weight) {
          brush.noFill();
          brush.noWash();
          brush.noHatch();
          brush.set(name, color, weight);
        }

        const D = (fn, bb, axis, dir, dur, gap = 60) => ({ fn, bb, axis, dir, dur, gap });
        const rdir = () => (p.random() < 0.5 ? 1 : -1);
        const raxis = () => (p.random() < 0.5 ? "x" : "y");

        function flushWash() {
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
        }

        function ensureBrushes(scaleAmt) {
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

        function softBlobDraw(x, y, rx, ry, color, opacity, bleed, texture, rot = 0, jit = 0.12) {
          const w = S.water - 0.5;
          fillStyle(color, Math.round(opacity - w * 60), clamp01(bleed + w * 0.4), clamp01(texture + w * 0.2), 0.3);
          brush.polygon(jitterEllipse(x, y, rx, ry, 14, jit, rot));
        }
        function bloomFill(color, opacity, bleed) {
          fillStyle(color, opacity, clamp01(bleed + S.water * 0.3), 0.5, 0.4);
        }
        function bloomShape(x, y, r, lobes, inner, color, bleed = 0.3, solid = 0.72) {
          const rot = rr(0, p.TWO_PI);
          washStyle(color, 255);
          brush.polygon(rosette(x, y, r * solid, lobes, inner, rot, 0.08));
          bloomFill(color, 250, bleed);
          brush.polygon(rosette(x, y, r, lobes, inner, rot, 0.05));
        }
        function centerDot(x, y, r, color, opacity = 250) {
          washStyle(color, opacity);
          brush.polygon(jitterEllipse(x, y, r, r * rr(0.85, 1), 12, 0.14));
        }
        function flowerCols(C) {
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
        }
        function foliageCols(C) {
          const f = C.foliage;
          return {
            light: f[3] || mixHex(f[0], "#ffffff", 0.35),
            mid: f[0],
            deep: f[1] || f[0],
            shade: f[2] || mixHex(f[0], "#1f2f2a", 0.5),
          };
        }
        function drawBlossom(x, y, s, F) {
          bloomShape(x, y, s * 0.9, 5, 0.5, p.random() < 0.5 ? F.light : F.mid, 0.26, 0.74);
          centerDot(x, y, 0.14 * s, F.center, 240);
        }
        function drawStrand(x0, y0, len, sway, color, weight, name = "flick") {
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
        }

        // ---- distinct hero objects, one per scene, so pages don't all
        // read as "flowers" — a boat, a cabin, a tree+bench, fairy lights,
        // floating lanterns.

        function drawBoat(x, y, s, C) {
          const wood = mixHex(C.accents[1] || C.accents[0], "#3a2313", 0.55);
          const woodLight = mixHex(wood, "#ffffff", 0.25);
          const sail = C.highlights[1] || "#fff6e6";
          const hull = [
            [x - s * 1.1, y + s * 0.05],
            [x - s * 0.85, y - s * 0.22],
            [x + s * 0.55, y - s * 0.26],
            [x + s * 1.15, y - s * 0.02],
            [x + s * 0.85, y + s * 0.32],
            [x - s * 0.75, y + s * 0.36],
          ];
          fillStyle(wood, 235, 0.3, 0.45, 0.3);
          brush.polygon(hull);
          washStyle(woodLight, 200);
          brush.polygon([
            [x - s * 0.7, y - s * 0.1],
            [x + s * 0.5, y - s * 0.14],
            [x + s * 0.45, y - s * 0.02],
            [x - s * 0.65, y + s * 0.02],
          ]);
          washStyle(wood, 220);
          brush.polygon([
            [x - s * 0.04, y - s * 0.2],
            [x + s * 0.03, y - s * 0.2],
            [x + s * 0.03, y - s * 1.1],
            [x - s * 0.04, y - s * 1.1],
          ]);
          fillStyle(sail, 225, 0.3, 0.4, 0.25);
          brush.polygon([
            [x, y - s * 1.05],
            [x + s * 0.55, y - s * 0.65],
            [x, y - s * 0.35],
          ]);
          strokeStyle("flick", wood, 1.1 * S.brushSize);
          brush.line(x - s * 0.9, y + s * 0.2, x - s * 1.35, y + s * 0.5);
          brush.line(x + s * 0.75, y + s * 0.22, x + s * 1.2, y + s * 0.52);
        }
        function drawBoatReflection(x, y, s, C) {
          const wood = mixHex(C.accents[1] || C.accents[0], "#3a2313", 0.55);
          fillStyle(wood, 90, 0.6, 0.6, 0.3);
          brush.polygon(jitterEllipse(x, y, s * 1.15, s * 0.22, 10, 0.2));
        }

        function drawCabin(x, y, s, C) {
          const wall = mixHex(C.washes[3] || C.washes[1], "#6b4b2e", 0.4);
          const roof = mixHex(C.foliage[2] || C.foliage[1], "#2a1c12", 0.35);
          fillStyle(wall, 235, 0.3, 0.4, 0.3);
          brush.polygon([
            [x - s * 0.55, y],
            [x + s * 0.55, y],
            [x + s * 0.55, y + s * 0.75],
            [x - s * 0.55, y + s * 0.75],
          ]);
          fillStyle(roof, 240, 0.3, 0.4, 0.3);
          brush.polygon([
            [x - s * 0.72, y],
            [x + s * 0.72, y],
            [x, y - s * 0.55],
          ]);
          washStyle(mixHex(roof, "#000000", 0.3), 220);
          brush.polygon([
            [x + s * 0.28, y - s * 0.45],
            [x + s * 0.42, y - s * 0.45],
            [x + s * 0.42, y - s * 0.85],
            [x + s * 0.28, y - s * 0.85],
          ]);
          washStyle(C.highlights[0], 210);
          brush.polygon(jitterEllipse(x, y + s * 0.4, s * 0.14, s * 0.18, 8, 0.15));
        }

        function drawBigTree(x, y, s, C) {
          const trunk = mixHex(C.foliage[2] || C.foliage[1], "#3a2313", 0.4);
          fillStyle(trunk, 230, 0.3, 0.4, 0.3);
          brush.polygon([
            [x - s * 0.07, y],
            [x + s * 0.07, y],
            [x + s * 0.05, y - s * 0.95],
            [x - s * 0.05, y - s * 0.95],
          ]);
          const canopyCols = [C.foliage[3] || C.foliage[0], C.foliage[0], C.accents[3] || C.accents[0]];
          for (let i = 0; i < 3; i++) {
            const cx = x + rr(-s * 0.3, s * 0.3),
              cy = y - s * (1.0 + rr(0, 0.25));
            fillStyle(pickOne(canopyCols), 220, 0.4, 0.5, 0.3);
            brush.polygon(jitterEllipse(cx, cy, s * (0.5 + rr(0, 0.15)), s * (0.4 + rr(0, 0.1)), 12, 0.15));
          }
        }
        function drawBench(x, y, s, C) {
          const wood = mixHex(C.accents[1] || C.accents[0], "#3a2313", 0.55);
          washStyle(wood, 225);
          brush.polygon([
            [x - s * 0.5, y],
            [x + s * 0.5, y],
            [x + s * 0.5, y + s * 0.08],
            [x - s * 0.5, y + s * 0.08],
          ]);
          brush.polygon([
            [x - s * 0.42, y + s * 0.08],
            [x - s * 0.34, y + s * 0.08],
            [x - s * 0.34, y + s * 0.28],
            [x - s * 0.42, y + s * 0.28],
          ]);
          brush.polygon([
            [x + s * 0.34, y + s * 0.08],
            [x + s * 0.42, y + s * 0.08],
            [x + s * 0.42, y + s * 0.28],
            [x + s * 0.34, y + s * 0.28],
          ]);
        }

        function drawFairyLights(x0, y0, x1, y1, C) {
          const n = 8;
          for (let i = 0; i <= n; i++) {
            const t = i / n;
            const x = x0 + (x1 - x0) * t;
            const sag = Math.sin(Math.PI * t) * m * 0.03;
            const y = y0 + (y1 - y0) * t + sag;
            washStyle(pickOne(C.highlights), 220);
            brush.polygon(jitterEllipse(x, y, m * 0.004, m * 0.004, 6, 0.2));
          }
        }

        function drawLantern(x, y, s, C) {
          fillStyle(C.highlights[0], 210, 0.4, 0.5, 0.3);
          brush.polygon(jitterEllipse(x, y, s * 0.35, s * 0.5, 10, 0.12));
          washStyle(mixHex(C.highlights[0], "#ffffff", 0.4), 230);
          brush.polygon(jitterEllipse(x, y - s * 0.05, s * 0.15, s * 0.2, 8, 0.1));
        }

        function dWash(color, opacity) {
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
        }
        function dBand(y0, y1, color, opacity, wobble) {
          const pts = bandPolygon(y0, y1, wobble);
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
        }
        function dBlob(x, y, rx, ry, color, opacity, bleed, texture, rot = 0, jit = 0.12, dur = 420) {
          const big = Math.max(rx, ry),
            pad = big * 0.9 + 14;
          const bb = [Math.max(0, x - big - pad), Math.max(0, y - big - pad), Math.min(W, x + big + pad), Math.min(H, y + big + pad)];
          return D(() => softBlobDraw(x, y, rx, ry, color, opacity, bleed, texture, rot, jit), bb.map(Math.round), raxis(), rdir(), dur, 80);
        }
        function dStrand(x0, y0, len, sway, color, weight, name) {
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
        }
        function dMarks(marks, dur = 220, gap = 40) {
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
        }
        function dFlick(x, y, len, a, color, weight) {
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
        }
        function dTouches(points, C, count, angleFn, sizeMul = 1) {
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
        }

        // ---- shared scaffolding: sky, horizon, winding path, grass beds --

        function buildGround(C) {
          const out = [];
          const { water } = S;
          const { washes } = C;
          const topY = H * 0.28;
          const pathHalf = (y) => {
            const t = clamp01((H - y) / (H - topY));
            return W * (0.2 - 0.15 * t);
          };
          const pathX = (y) => W * 0.5 + (1 - clamp01((H - y) / (H - topY))) * W * 0.02;

          if (S.coverage > 0.02) out.push(dWash(washes[0], Math.round(S.coverage * 200)));
          out.push(dBand(-20, topY + H * 0.06, washes[2], Math.round(195 - water * 40), m * 0.033));
          out.push(dBand(topY - H * 0.02, H + 20, washes[3] || washes[1], Math.round(200 - water * 40), m * 0.03));
          const trap = [];
          for (let i = 0; i <= 6; i++) {
            const y = H + 20 - (H + 20 - topY) * (i / 6);
            trap.push([pathX(y) - pathHalf(y) * rr(0.9, 1.1), y]);
          }
          for (let i = 6; i >= 0; i--) {
            const y = H + 20 - (H + 20 - topY) * (i / 6);
            trap.push([pathX(y) + pathHalf(y) * rr(0.9, 1.1), y]);
          }
          out.push(
            D(
              () => {
                fillStyle(washes[1], Math.round(220 - water * 40), 0.3 + water * 0.4, 0.4 + water * 0.4, 0.3);
                brush.polygon(trap);
              },
              bboxOf(trap, m * 0.2, W, H),
              "y",
              -1,
              620,
              100
            )
          );
          out.push(dBlob(W * 0.5, H * 0.8, W * 0.12, H * 0.3, washes[0], 170, 0.6, 0.5, 0, 0.15, 480));
          out.push(dBlob(W * 0.5, topY + H * 0.04, W * 0.14, H * 0.06, C.highlights[1] || "#fff6e6", 160, 0.7, 0.5, 0, 0.2, 420));

          return { out, topY, pathHalf, pathX };
        }

        function buildVegetation(C, ground) {
          const out = [],
            tops = [];
          const { density: dens, scale: sc, detail: det } = S;
          const G = foliageCols(C);
          const { topY, pathHalf, pathX } = ground;

          for (const side of [-1, 1]) {
            out.push(dBlob(W * (0.5 + side * 0.33), H * 0.6, W * 0.2, H * 0.22, G.mid, 195, 0.5, 0.6, side * 0.15, 0.12, 400));
            out.push(dBlob(W * (0.5 + side * 0.36), H * 0.86, W * 0.2, H * 0.16, G.deep, 190, 0.5, 0.6, 0, 0.12, 400));
            out.push(dBlob(W * (0.5 + side * 0.24), H * 0.4, W * 0.16, H * 0.1, G.light, 170, 0.6, 0.6, side * 0.3, 0.12, 340));
          }
          for (let i = 0; i < Math.round((50 + dens * 110) * (0.35 + 0.65 * det)); i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const y0 = H * (0.34 + 0.7 * Math.pow(p.random(), 0.8));
            const near = (y0 - topY) / (H - topY);
            const x0 = pathX(y0) + side * (pathHalf(y0) + rr(4, W * 0.36 * (0.4 + 0.6 * near)));
            const len = -H * rr(0.08, 0.26) * (0.3 + near) * (0.8 + sc * 0.2);
            const sway = side * rr(-6, 14) * (m / 600) * 3;
            const color = p.random() < 0.2 ? G.shade : p.random() < 0.5 ? G.deep : p.random() < 0.7 ? G.mid : G.light;
            out.push(dStrand(x0, y0, len, sway, color, rr(0.6, 1.1) * sc * (1.5 - 0.5 * det), p.random() < 0.6 ? "rim" : "flick"));
            tops.push({ x: x0 + sway, y: y0 + len, near });
          }
          return { out, tops, G };
        }

        // ---- scene-specific midground, inserted behind the vegetation ---

        function buildRidges(C) {
          const out = [];
          const { washes } = C;
          const topY = H * 0.28;
          const layers = [
            { y: topY - H * 0.02, amp: H * 0.05, color: washes[2], op: 150 },
            { y: topY + H * 0.02, amp: H * 0.07, color: washes[3] || washes[1], op: 175 },
            { y: topY + H * 0.06, amp: H * 0.09, color: mixHex(washes[3] || washes[1], "#2b2f3a", 0.25), op: 195 },
          ];
          for (const L of layers) {
            const pts = [[-10, L.y - 5]];
            const n = 6;
            for (let i = 0; i <= n; i++) {
              const x = -10 + (W + 20) * (i / n);
              const peak = L.y - L.amp * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.7 + L.y))) * rr(0.7, 1.1);
              pts.push([x, peak]);
            }
            pts.push([W + 10, L.y - 5], [W + 10, H * 0.5], [-10, H * 0.5]);
            out.push(D(() => { fillStyle(L.color, L.op, 0.3, 0.4, 0.3); brush.polygon(pts); }, bboxOf(pts, m * 0.05, W, H), "x", rdir(), 500, 90));
          }
          return out;
        }

        function buildTreeline(C) {
          const out = [];
          const G = foliageCols(C);
          const topY = H * 0.28;
          const n = 7;
          for (let i = 0; i < n; i++) {
            const x = (W * (i + 0.5)) / n + rr(-W * 0.03, W * 0.03);
            const y = topY + H * 0.04 + rr(-H * 0.01, H * 0.02);
            const r = W * rr(0.05, 0.08);
            out.push(dBlob(x, y, r, r * 1.3, i % 2 ? G.deep : G.shade, 190, 0.4, 0.5, 0, 0.1, 380));
          }
          return out;
        }

        function buildWaterBody(C) {
          const out = [];
          const { washes, highlights } = C;
          const topY = H * 0.28;
          const bandTop = topY + H * 0.08;
          const pts = bandPolygon(bandTop, H + 20, m * 0.02, 10);
          out.push(D(() => { fillStyle(mixHex(washes[2], washes[0], 0.4), 150, 0.6, 0.55, 0.35); brush.polygon(pts); }, bboxOf(pts, m * 0.1, W, H), "x", rdir(), 550, 100));
          for (let i = 0; i < 5; i++) {
            const y = bandTop + (H - bandTop) * rr(0.1, 0.8);
            const w = W * rr(0.06, 0.18);
            const x = W * 0.5 + rr(-W * 0.3, W * 0.3);
            out.push(dBlob(x, y, w, H * 0.01, highlights[1] || "#fff6e6", 120, 0.5, 0.4, 0, 0.3, 260));
          }
          return out;
        }

        // ---- scene-specific foreground finish, painted last -------------

        function pathTouchPoints(ground, count) {
          const { topY, pathHalf, pathX } = ground;
          const pts = [];
          for (let i = 0; i < count; i++) {
            const y = rr(topY + 10, H * 0.95);
            pts.push([pathX(y) + rr(-pathHalf(y), pathHalf(y)) * 0.8, y, 10]);
          }
          return pts;
        }

        function finishGarden(veg, C, ground) {
          const out = [];
          const { water, density: dens, scale: sc, detail: det, brushSize: bs } = S;
          const { accents, highlights } = C;
          const { pathHalf, pathX } = ground;
          const F = flowerCols(C);
          const irisCols = [accents[0], accents[1] || accents[0], accents[2] || accents[0], accents[4] || accents[1] || accents[0]];
          const paleIris = accents[3] || mixHex(accents[0], "#ffffff", 0.5);

          const heads = [];
          const chosen = veg.tops.slice().sort(() => p.random() - 0.5).slice(0, Math.round(veg.tops.length * (0.45 + 0.2 * dens)));
          for (const h of chosen) {
            const r = m * rr(0.009, 0.015) * sc * (0.5 + h.near) * bs * (1.3 - 0.3 * det);
            const pale = p.random() < 0.2;
            const cs = pale ? paleIris : pickOne(irisCols),
              cf = pale ? mixHex(paleIris, irisCols[1], 0.4) : irisCols[2];
            heads.push({ color: vivid(cf, S.vivid), pts: jitterEllipse(h.x, h.y + r * 0.6, r * 1.5, r * 0.8, 8, 0.2, rr(-0.3, 0.3)), op: Math.round(225 - water * 30) });
            heads.push({ color: vivid(cs, S.vivid), pts: jitterEllipse(h.x, h.y - r * 0.4, r * 0.8, r * 1.4, 8, 0.18, rr(-0.3, 0.3)), op: Math.round(235 - water * 30) });
            if (det > 0.35 && r > m * 0.011) heads.push({ color: highlights[0], pts: jitterEllipse(h.x, h.y + r * 0.4, r * 0.25, r * 0.2, 6, 0.2), op: 235 });
          }
          heads.sort((a, b) => a.pts[0][1] - b.pts[0][1]);
          out.push(...dMarks(heads));

          const purpleF = { ...F, light: vivid(irisCols[3], S.vivid), mid: vivid(irisCols[0], S.vivid), deep: vivid(irisCols[2], S.vivid), pale: paleIris };
          for (let i = 0; i < 6 + Math.round(dens * 4); i++) {
            const side = i % 2 === 0 ? -1 : 1,
              y = H * rr(0.68, 0.96);
            const x = pathX(y) + side * (pathHalf(y) + rr(W * 0.02, W * 0.26));
            const s = m * rr(0.026, 0.04) * sc,
              pad = s * 2.6 + 14;
            const bb = [Math.max(0, x - pad), Math.max(0, y - pad), Math.min(W, x + pad), Math.min(H, y + pad)].map(Math.round);
            out.push(D(() => { washStyle(purpleF.deep, 230); brush.polygon(jitterEllipse(x, y + s * 0.5, s * 1.1, s * 0.55, 10, 0.18)); drawBlossom(x, y - s * 0.2, s * 1.3, purpleF); }, bb, raxis(), rdir(), 320, 80));
          }
          out.push(...dTouches(pathTouchPoints(ground, 10), C, Math.round(S.touch * 18), () => p.HALF_PI + rr(-0.2, 0.2)));
          return out;
        }

        function finishLake(veg, C, ground) {
          const out = [];
          const { highlights } = C;
          const { pathHalf, pathX } = ground;

          // the boat is the focal point — floating roughly mid-lake, just off the path
          const by = H * rr(0.5, 0.6);
          const bx = pathX(by) + (p.random() < 0.5 ? -1 : 1) * (pathHalf(by) + rr(W * 0.1, W * 0.22));
          const bs = m * rr(0.055, 0.07);
          const bbBoat = [Math.max(0, bx - bs * 2.2), Math.max(0, by - bs * 2.4), Math.min(W, bx + bs * 2.2), Math.min(H, by + bs * 1.2)].map(Math.round);
          out.push(D(() => drawBoatReflection(bx, by + bs * 0.42, bs, C), bbBoat, raxis(), rdir(), 260, 60));
          out.push(D(() => drawBoat(bx, by, bs, C), bbBoat, raxis(), rdir(), 360, 90));

          const sparkle = [];
          for (let i = 0; i < Math.round(14 + S.detail * 14); i++) {
            const y = H * rr(0.34, 0.95),
              x = pathX(y) + rr(-W * 0.45, W * 0.45);
            sparkle.push({ color: pickOne(highlights), pts: jitterEllipse(x, y, m * 0.01, m * 0.003, 6, 0.3, 0), op: 200 });
          }
          out.push(...dMarks(sparkle, 180, 30));
          out.push(...dTouches(pathTouchPoints(ground, 6), C, Math.round(S.touch * 10), () => rr(0, p.TWO_PI)));
          return out;
        }

        function finishMountains(veg, C, ground) {
          const out = [];
          const { pathHalf, pathX } = ground;

          // a small cabin at the foot of the mountains is the focal point
          const cy = H * rr(0.66, 0.78);
          const side = p.random() < 0.5 ? -1 : 1;
          const cx = pathX(cy) + side * (pathHalf(cy) + rr(W * 0.08, W * 0.18));
          const cs = m * rr(0.09, 0.12);
          const bbCabin = [Math.max(0, cx - cs * 0.9), Math.max(0, cy - cs * 1.6), Math.min(W, cx + cs * 0.9), Math.min(H, cy + cs * 0.9)].map(Math.round);
          out.push(D(() => drawCabin(cx, cy, cs, C), bbCabin, raxis(), rdir(), 380, 90));

          const smoke = [];
          for (let i = 0; i < 4; i++) {
            const t = i / 3;
            smoke.push(
              dBlob(
                cx + cs * 0.36 + rr(-cs * 0.05, cs * 0.1) * (1 + t),
                cy - cs * 0.95 - cs * 0.5 * t,
                cs * (0.08 + t * 0.05),
                cs * (0.08 + t * 0.05),
                mixHex(C.highlights[1] || "#fff3e0", "#8a8a90", 0.35),
                Math.round(140 - t * 60),
                0.6,
                0.5,
                0,
                0.2,
                260
              )
            );
          }
          out.push(...smoke);

          const wild = [];
          for (let i = 0; i < Math.round(10 + S.density * 8); i++) {
            const y = H * rr(0.6, 0.97),
              wside = p.random() < 0.5 ? -1 : 1;
            const x = pathX(y) + wside * (pathHalf(y) + rr(4, W * 0.18));
            const s = m * rr(0.006, 0.011);
            wild.push({ color: vivid(pickOne(C.accents), S.vivid), pts: jitterEllipse(x, y, s, s * 0.7, 6, 0.2), op: 210 });
          }
          out.push(...dMarks(wild, 170, 30));

          out.push(...dTouches(pathTouchPoints(ground, 8), C, Math.round(S.touch * 12), () => p.HALF_PI + rr(-0.2, 0.2)));
          return out;
        }

        function finishMeadow(veg, C, ground) {
          const out = [];
          const { accents } = C;
          const { topY, pathHalf, pathX } = ground;

          // a big blooming tree with a bench beneath it is the focal point
          const ty = H * rr(0.62, 0.74);
          const side = p.random() < 0.5 ? -1 : 1;
          const tx = pathX(ty) + side * (pathHalf(ty) + rr(W * 0.1, W * 0.2));
          const ts = m * rr(0.16, 0.2);
          const bbTree = [Math.max(0, tx - ts * 0.9), Math.max(0, ty - ts * 1.4), Math.min(W, tx + ts * 0.9), Math.min(H, ty + ts * 0.2)].map(Math.round);
          out.push(D(() => drawBigTree(tx, ty, ts, C), bbTree, raxis(), rdir(), 420, 100));
          out.push(D(() => drawBench(tx, ty + ts * 0.06, ts * 0.55, C), bbTree, raxis(), rdir(), 260, 60));

          const marks = [];
          const count = Math.round(16 + S.density * 18);
          for (let i = 0; i < count; i++) {
            const y = H * rr(0.42, 0.98);
            const mside = p.random() < 0.5 ? -1 : 1;
            const x = pathX(y) + mside * (pathHalf(y) + rr(6, W * 0.36));
            const near = clamp01((y - topY) / (H - topY));
            const s = m * rr(0.007, 0.013) * (0.4 + near);
            marks.push({ color: vivid(pickOne(accents), S.vivid * 0.8), pts: jitterEllipse(x, y, s * 1.2, s * 0.7, 8, 0.2, rr(0, p.TWO_PI)), op: 210 });
          }
          marks.sort((a, b) => a.pts[0][1] - b.pts[0][1]);
          out.push(...dMarks(marks, 190, 32));

          out.push(...dTouches(pathTouchPoints(ground, 8), C, Math.round(S.touch * 12), () => p.HALF_PI + rr(-0.2, 0.2)));
          return out;
        }

        function finishForest(veg, C, ground) {
          const out = [];
          const { highlights } = C;
          const { pathHalf, pathX } = ground;
          const G = veg.G;
          const canopyAnchors = [];
          for (let i = 0; i < 5; i++) {
            const side = i % 2 === 0 ? -1 : 1,
              y = H * rr(0.55, 0.92);
            const x = pathX(y) + side * (pathHalf(y) + rr(W * 0.05, W * 0.3));
            const trunkH = H * rr(0.28, 0.42);
            const trunkColor = mixHex(G.shade, "#3b2c22", 0.5);
            out.push(dStrand(x, y, -trunkH, side * rr(2, 8), trunkColor, rr(1.6, 2.4), "rim"));
            const canopyR = W * rr(0.06, 0.11);
            const canopyX = x + side * rr(2, 10),
              canopyY = y - trunkH;
            out.push(dBlob(canopyX, canopyY, canopyR, canopyR * 0.85, i % 2 ? G.deep : G.mid, 200, 0.4, 0.55, 0, 0.14, 380));
            canopyAnchors.push({ x: canopyX, y: canopyY });
          }

          // fairy lights strung between two neighbouring trees — the focal touch
          if (canopyAnchors.length >= 2) {
            const a = canopyAnchors[0],
              b = canopyAnchors[1];
            const bbLights = bboxOf([[a.x, a.y], [b.x, b.y]], m * 0.06, W, H);
            out.push(D(() => drawFairyLights(a.x, a.y + m * 0.02, b.x, b.y + m * 0.02, C), bbLights, raxis(), rdir(), 260, 60));
          }

          const light = [];
          for (let i = 0; i < Math.round(12 + S.detail * 12); i++) {
            const y = H * rr(0.3, 0.9),
              x = pathX(y) + rr(-W * 0.4, W * 0.4);
            light.push({ color: highlights[0], pts: jitterEllipse(x, y, m * 0.008, m * 0.006, 6, 0.2), op: 190 });
          }
          out.push(...dMarks(light, 180, 30));
          out.push(...dTouches(pathTouchPoints(ground, 8), C, Math.round(S.touch * 10), () => p.HALF_PI + rr(-0.2, 0.2)));
          return out;
        }

        function finishDusk(veg, C, ground) {
          const out = [];
          const { highlights } = C;
          const { pathHalf, pathX } = ground;
          const stars = [];
          for (let i = 0; i < Math.round(30 + S.detail * 24); i++) {
            const y = H * rr(0.02, 0.34),
              x = rr(0, W);
            const s = m * rr(0.003, 0.007);
            stars.push({ color: pickOne(highlights), pts: jitterEllipse(x, y, s, s, 5, 0.3), op: rr(180, 240) });
          }
          out.push(...dMarks(stars, 150, 24));
          const moonX = W * 0.74,
            moonY = H * 0.14,
            moonR = m * 0.05;
          out.push(
            D(
              () => { washStyle(highlights[1] || "#fff6e6", 235); brush.polygon(jitterEllipse(moonX, moonY, moonR, moonR, 14, 0.06)); },
              bboxOf([[moonX - moonR, moonY - moonR], [moonX + moonR, moonY + moonR]], moonR * 0.6, W, H),
              raxis(),
              rdir(),
              320,
              60
            )
          );

          // sky lanterns rising along the path — the "wish" focal point
          for (let i = 0; i < 4; i++) {
            const t = i / 3;
            const y = H * (0.85 - t * 0.5);
            const x = pathX(y) + rr(-W * 0.12, W * 0.12);
            const ls = m * (0.045 - t * 0.018);
            const bbL = [Math.max(0, x - ls), Math.max(0, y - ls * 1.5), Math.min(W, x + ls), Math.min(H, y + ls)].map(Math.round);
            out.push(D(() => drawLantern(x, y, ls, C), bbL, raxis(), rdir(), 260, 60));
          }

          out.push(...dTouches(pathTouchPoints(ground, 8), C, Math.round(S.touch * 10), () => p.HALF_PI + rr(-0.2, 0.2)));
          return out;
        }

        const FINISHERS = {
          garden: finishGarden,
          lake: finishLake,
          mountains: finishMountains,
          meadow: finishMeadow,
          forest: finishForest,
          dusk: finishDusk,
        };

        function buildScene(C, kind) {
          const ground = buildGround(C);
          let out = [...ground.out];
          if (kind === "mountains") out = out.concat(buildRidges(C));
          if (kind === "forest") out = out.concat(buildTreeline(C));
          if (kind === "lake") out = out.concat(buildWaterBody(C));
          const veg = buildVegetation(C, ground);
          out = out.concat(veg.out);
          const finisher = FINISHERS[kind] || finishGarden;
          out = out.concat(finisher(veg, C, ground));
          return out;
        }

        function loadTimeline() {
          p.randomSeed(ACTIVE.palette.seed);
          p.noiseSeed(ACTIVE.palette.seed);
          strokes = buildScene(ACTIVE.palette, ACTIVE.kind);
          let cursor = 0;
          for (const s of strokes) {
            s.seed = Math.floor(p.random() * 1e9);
            s.begun = false;
            s.start = cursor;
            cursor += s.dur + s.gap;
          }
          const k = LOOP_MS / cursor;
          for (const s of strokes) {
            s.start *= k;
            s.dur *= k;
            s.end = s.start + s.dur;
          }
          idx = 0;
          paint.background(ACTIVE.palette.ground);
          p.background(ACTIVE.palette.ground);
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
            const h = Math.round((y1 - y0) * s.p);
            if (h <= 0) return;
            const a = s.dir > 0 ? y0 : y1 - h;
            p.image(buf, x0, a, x1 - x0, h, x0, a, x1 - x0, h);
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
          sizeToContainer();
          const cnv = p.createCanvas(W, H, p.WEBGL);
          cnv.parent(containerRef.current);
          ensureBrushes((3 * m) / 600);
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
          p.background(ACTIVE.palette.ground);
          loadTimeline();
        };

        p.draw = () => {
          p.translate(-W / 2, -H / 2);
          if (freeze !== null) {
            drawFrame(clamp01(freeze) * LOOP_MS);
            p.noLoop();
            return;
          }
          if (startMs === null) startMs = p.millis();
          const now = p.millis() - startMs;
          drawFrame(Math.min(now, LOOP_MS));
          if (now >= LOOP_MS) p.noLoop();
        };
      };

      p5Instance = new p5(sketch, containerRef.current);
    }

    mount();

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
  }, [scene, freeze]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    />
  );
}
