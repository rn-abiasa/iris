// GardenBackground — the iris garden (cover page).
//
// Composition (kept as the style & quality reference for every other scene):
// a winding path receding to a high horizon (y ≈ 0.28H), grass beds flanking
// it on both sides, and purple iris clumps — the classic iris garden.
import { createPaintEngine } from "../../lib/paintEngine";

const C = {
  seed: 1874,
  ground: "#f4eee2",
  washes: ["#e6d6b8", "#d9c9a6", "#c8b8d6", "#b6c9a2"],
  foliage: ["#7fa565", "#5b8452", "#3c5f45", "#b9cf8a"],
  accents: ["#8a6bb8", "#6c4fa0", "#4e3a85", "#c9b3e0", "#b28fd0"],
  highlights: ["#f4e3a6", "#fff6e6"],
};

function buildScene(W, H, m, h) {
  const S = h.S;
  const {
    p,
    brush,
    rr,
    pickOne,
    mixHex,
    vivid,
    clamp01,
    jitterEllipse,
    bboxOf,
    D,
    rdir,
    raxis,
    dWash,
    dBand,
    dBlob,
    dStrand,
    dMarks,
    dTouches,
    fillStyle,
    washStyle,
    flowerCols,
    foliageCols,
    drawBlossom,
  } = h;
  const { water, coverage, density: dens, scale: sc, detail: det, brushSize: bs, touch } = S;
  const { washes, accents, highlights } = C;
  const out = [];

  const topY = H * 0.28;
  const pathHalf = (y) => {
    const t = clamp01((H - y) / (H - topY));
    return W * (0.2 - 0.15 * t);
  };
  const pathX = (y) => W * 0.5 + (1 - clamp01((H - y) / (H - topY))) * W * 0.02;

  p.randomSeed(C.seed);
  p.noiseSeed(C.seed);

  const G = foliageCols(C);
  const F = flowerCols(C);

  // sky + ground washes
  if (coverage > 0.02) out.push(dWash(washes[0], Math.round(coverage * 200)));
  out.push(dBand(-20, topY + H * 0.06, washes[2], Math.round(195 - water * 40), m * 0.033));
  out.push(dBand(topY - H * 0.02, H + 20, washes[3] || washes[1], Math.round(200 - water * 40), m * 0.03));

  // the winding path, trapezoid from the bottom edge receding to the horizon
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

  // meadow beds on both sides of the path
  for (const side of [-1, 1]) {
    out.push(dBlob(W * (0.5 + side * 0.33), H * 0.6, W * 0.2, H * 0.22, G.mid, 195, 0.5, 0.6, side * 0.15, 0.12, 400));
    out.push(dBlob(W * (0.5 + side * 0.36), H * 0.86, W * 0.2, H * 0.16, G.deep, 190, 0.5, 0.6, 0, 0.12, 400));
    out.push(dBlob(W * (0.5 + side * 0.24), H * 0.4, W * 0.16, H * 0.1, G.light, 170, 0.6, 0.6, side * 0.3, 0.12, 340));
  }

  // grass strands growing outward from the path edges
  const tops = [];
  for (let i = 0; i < Math.round((32 + dens * 68) * (0.35 + 0.65 * det)); i++) {
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

  // iris heads perched on a subset of those strands
  const irisCols = [accents[0], accents[1] || accents[0], accents[2] || accents[0], accents[4] || accents[1] || accents[0]];
  const paleIris = accents[3] || mixHex(accents[0], "#ffffff", 0.5);
  const heads = [];
  const chosen = tops.slice().sort(() => p.random() - 0.5).slice(0, Math.round(tops.length * (0.45 + 0.2 * dens)));
  for (const t of chosen) {
    const r = m * rr(0.009, 0.015) * sc * (0.5 + t.near) * bs * (1.3 - 0.3 * det);
    const pale = p.random() < 0.2;
    const cs = pale ? paleIris : pickOne(irisCols);
    const cf = pale ? mixHex(paleIris, irisCols[1], 0.4) : irisCols[2];
    heads.push({ color: vivid(cf, S.vivid), pts: jitterEllipse(t.x, t.y + r * 0.6, r * 1.5, r * 0.8, 8, 0.2, rr(-0.3, 0.3)), op: Math.round(225 - water * 30) });
    heads.push({ color: vivid(cs, S.vivid), pts: jitterEllipse(t.x, t.y - r * 0.4, r * 0.8, r * 1.4, 8, 0.18, rr(-0.3, 0.3)), op: Math.round(235 - water * 30) });
    if (det > 0.35 && r > m * 0.011) heads.push({ color: highlights[0], pts: jitterEllipse(t.x, t.y + r * 0.4, r * 0.25, r * 0.2, 6, 0.2), op: 235 });
  }
  heads.sort((a, b) => a.pts[0][1] - b.pts[0][1]);
  out.push(...dMarks(heads));

  // full iris bushes near the camera
  const purpleF = { ...F, light: vivid(irisCols[3], S.vivid), mid: vivid(irisCols[0], S.vivid), deep: vivid(irisCols[2], S.vivid), pale: paleIris };
  for (let i = 0; i < 6 + Math.round(dens * 4); i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const y = H * rr(0.68, 0.96);
    const x = pathX(y) + side * (pathHalf(y) + rr(W * 0.02, W * 0.26));
    const s = m * rr(0.026, 0.04) * sc;
    const pad = s * 2.6 + 14;
    const bb = [Math.max(0, x - pad), Math.max(0, y - pad), Math.min(W, x + pad), Math.min(H, y + pad)].map(Math.round);
    out.push(D(() => { washStyle(purpleF.deep, 230); brush.polygon(jitterEllipse(x, y + s * 0.5, s * 1.1, s * 0.55, 10, 0.18)); drawBlossom(x, y - s * 0.2, s * 1.3, purpleF); }, bb, raxis(), rdir(), 320, 80));
  }

  // loose touches along the path stones
  const touchPts = [];
  for (let i = 0; i < 10; i++) {
    const y = rr(topY + 10, H * 0.95);
    touchPts.push([pathX(y) + rr(-pathHalf(y), pathHalf(y)) * 0.8, y, 10]);
  }
  out.push(...dTouches(touchPts, C, Math.round(touch * 18), () => p.HALF_PI + rr(-0.2, 0.2)));

  return out;
}

export default createPaintEngine({ buildScene, ground: C.ground });