// MeadowBackground — up close, eye-level, in golden grass (reason page).
//
// HIGH horizon (the sky is only a sliver): rolling hills fill the frame in
// golden-hour greens, one big blooming tree + a bench anchor a third of the
// frame, and there is deliberately NO path — the grass just goes everywhere.
import { createPaintEngine } from "../../lib/paintEngine";

const C = {
  seed: 4173,
  ground: "#f4eee2",
  washes: ["#f6e6b8", "#f0d79a", "#e8c26e", "#d9b25a"],
  foliage: ["#8fb85a", "#6f9f45", "#557a34", "#c3dd8a"],
  accents: ["#f2c14e", "#e8853a", "#e0567a", "#fff3c4", "#f29ecb"],
  highlights: ["#fff0b0", "#fff8e0"],
};

// The big blooming tree — focal object unique to the meadow.
function drawBigTree(h, x, y, s, C) {
  const { p, brush, rr, pickOne, mixHex, jitterEllipse, fillStyle, washStyle, bloomFill, bloomShape, centerDot, strokeStyle } = h;
  const S = h.S;
  const trunk = mixHex(C.foliage[2] || C.foliage[1], "#3a2313", 0.4);
  fillStyle(trunk, 230, 0.3, 0.4, 0.3);
  brush.polygon([
    [x - s * 0.09, y],
    [x + s * 0.09, y],
    [x + s * 0.07, y - s * 0.85],
    [x - s * 0.07, y - s * 0.85],
  ]);
  // bare branches reaching up
  strokeStyle("rim", trunk, 1.3 * S.brushSize);
  brush.spline([[x - s * 0.02, y - s * 0.78], [x - s * 0.2, y - s * 1.05], [x - s * 0.34, y - s * 1.2]], 0.45);
  brush.spline([[x + s * 0.02, y - s * 0.8], [x + s * 0.22, y - s * 1.08], [x + s * 0.34, y - s * 1.24]], 0.45);

  // base canopy cloud
  const canopyCols = [C.foliage[3] || C.foliage[0], mixHex(C.foliage[0], "#ffffff", 0.2), C.accents[4] || C.accents[0]];
  for (let i = 0; i < 4; i++) {
    const cx = x + rr(-s * 0.36, s * 0.36),
      cy = y - s * (1.0 + rr(0, 0.3));
    const rx = s * (0.4 + rr(0, 0.12)),
      ry = s * (0.28 + rr(0, 0.06));
    bloomFill(pickOne(canopyCols), 225, 0.45);
    brush.polygon(jitterEllipse(cx, cy, rx, ry, 14, 0.14, rr(0, Math.PI)));
  }

  // blossom cloud — flower heads scattered inside the canopy ellipse
  const F = {
    light: mixHex(C.accents[4] || C.accents[0], "#ffffff", 0.35),
    mid: C.accents[4] || C.accents[0],
    deep: C.accents[2] || C.accents[0],
    center: C.highlights[0],
    pale: C.highlights[1] || "#ffffff",
  };
  const count = Math.round(26 + S.detail * 22);
  for (let i = 0; i < count; i++) {
    const px = x + rr(-s * 0.58, s * 0.58);
    const py = y - s * (0.74 + rr(0, 0.64));
    const nx = (px - x) / (s * 0.58);
    const ny = (py - (y - s * 1.08)) / (s * 0.52);
    if (nx * nx + ny * ny <= 1) {
      const bs = s * rr(0.035, 0.07);
      bloomShape(px, py, bs, 5, 0.5, p.random() < 0.6 ? F.light : F.mid, 0.24, 0.78);
      if (i % 3 === 0) centerDot(px, py, bs * 0.35, F.center, 235);
    }
  }
  // a few petals drifting off to one side
  for (let i = 0; i < 7; i++) {
    const dir = p.random() < 0.5 ? -1 : 1;
    const px = x + rr(0, s * 0.5) * dir + rr(0, s * 0.9) * dir;
    const py = y - s * rr(0.2, 0.9);
    washStyle(F.pale, 200);
    brush.polygon(jitterEllipse(px, py, s * 0.02, s * 0.014, 6, 0.2, rr(0, Math.PI)));
  }
}

// A simple wooden bench to sit under the tree.
function drawBench(h, x, y, s, C) {
  const { brush, mixHex, washStyle } = h;
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
function buildScene(W, H, m, h) {
  const S = h.S;
  const {
    p,
    rr,
    pickOne,
    mixHex,
    clamp01,
    vivid,
    jitterEllipse,
    D,
    rdir,
    raxis,
    dWash,
    dBand,
    dBlob,
    dStrand,
    dMarks,
    dTouches,
    foliageCols,
  } = h;
  const { coverage, density: dens, scale: sc, detail: det, touch } = S;
  const { washes, accents } = C;
  const out = [];

  // Very high horizon — the meadow owns almost the whole frame.
  const topY = H * 0.18;

  p.randomSeed(C.seed);
  p.noiseSeed(C.seed);

  const G = foliageCols(C);

  // --- tiny golden sky + sun glow -----------------------------------------
  if (coverage > 0.02) out.push(dWash(washes[0], Math.round(coverage * 190)));
  out.push(dBand(-20, topY + H * 0.02, mixHex(washes[2], C.highlights[0], 0.4), 200, m * 0.014));
  out.push(dBlob(W * 0.5 + rr(-W * 0.08, W * 0.08), topY - H * 0.03, W * 0.15, H * 0.05, C.highlights[1], 120, 0.55, 0.4, 0, 0.2, 380));

  // --- rolling hills: big soft humps receding to the horizon --------------
  out.push(dBlob(W * 0.5, topY + H * 0.1, W * 0.46, H * 0.05, mixHex(washes[3], G.light, 0.45), 165, 0.6, 0.45, 0, 0.18, 420));
  out.push(dBlob(W * 0.26, H * 0.34, W * 0.42, H * 0.11, mixHex(G.light, washes[3], 0.5), 180, 0.55, 0.5, 0, 0.16, 430));
  out.push(dBlob(W * 0.76, H * 0.42, W * 0.46, H * 0.13, mixHex(G.mid, washes[3], 0.4), 185, 0.55, 0.5, 0, 0.16, 430));
  out.push(dBlob(W * 0.5, H * 0.63, W * 0.58, H * 0.19, G.mid, 190, 0.5, 0.55, 0, 0.15, 440));
  out.push(dBlob(W * 0.5, H * 0.88, W * 0.66, H * 0.2, G.deep, 195, 0.5, 0.55, 0, 0.14, 440));
  out.push(dBlob(W * 0.5, H * 1.04, W * 0.72, H * 0.13, mixHex(G.shade, washes[3], 0.5), 175, 0.5, 0.5, 0, 0.14, 380));

  // --- long grass fanning everywhere (no path, no rows) -------------------
  for (let i = 0; i < Math.round((45 + dens * 58) * (0.4 + 0.6 * det)); i++) {
    const t = Math.pow(p.random(), 0.9);
    const y0 = H * (0.2 + 0.8 * t);
    const x0 = rr(W * 0.03, W * 0.97);
    const near = clamp01((y0 - topY) / (H - topY));
    const len = -H * rr(0.05, 0.14) * (0.35 + near * 0.9);
    const sway = rr(-10, 10) * (m / 600) * 2;
    const color = p.random() < 0.25 ? G.shade : p.random() < 0.5 ? G.deep : p.random() < 0.75 ? G.mid : G.light;
    out.push(dStrand(x0, y0, len, sway, color, rr(0.6, 1.0) * sc * (1.3 - 0.4 * det), p.random() < 0.5 ? "rim" : "flick"));
  }

  // --- the big blooming tree + bench, a third of the way in ---------------
  const tx = W * (0.32 + rr(-0.03, 0.02));
  const ty = H * (0.54 + rr(-0.03, 0.02));
  const ts = m * rr(0.2, 0.24);
  const bbTree = [Math.max(0, tx - ts * 1.0), Math.max(0, ty - ts * 1.7), Math.min(W, tx + ts * 1.0), Math.min(H, ty + ts * 0.3)].map(Math.round);
  out.push(D(() => drawBigTree(h, tx, ty, ts, C), bbTree, raxis(), rdir(), 460, 110));
  out.push(D(() => drawBench(h, tx + ts * 0.03, ty + ts * 0.05, ts * 0.48, C), bbTree, raxis(), rdir(), 260, 60));

  // --- wildflower marks drifting through the grass ------------------------
  const marks = [];
  const count = Math.round(16 + dens * 18);
  for (let i = 0; i < count; i++) {
    const y = H * rr(0.4, 0.98);
    const x = rr(W * 0.06, W * 0.94);
    const near = clamp01((y - topY) / (H - topY));
    const s0 = m * rr(0.006, 0.013) * (0.5 + near * 0.7);
    marks.push({ color: vivid(pickOne(accents), S.vivid * 0.8), pts: jitterEllipse(x, y, s0 * 1.1, s0 * 0.7, 8, 0.2, rr(0, p.TWO_PI)), op: 210 });
  }
  marks.sort((a, b) => a.pts[0][1] - b.pts[0][1]);
  out.push(...dMarks(marks, 190, 32));

  // touches spilling through the blades
  const touchPts = [];
  for (let i = 0; i < 8; i++) touchPts.push([rr(0, W), rr(H * 0.25, H * 0.95), 10]);
  out.push(...dTouches(touchPts, C, Math.round(touch * 12), () => p.HALF_PI + rr(-0.2, 0.2)));

  return out;
}

export default createPaintEngine({ buildScene, ground: C.ground });