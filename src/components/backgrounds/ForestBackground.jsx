// ForestBackground — looking up from under the canopy (songs page).
//
// NO horizon at all: dense vertical trunks crowd left, right AND centre,
// narrowing slightly into a corridor that vanishes into a dark canopy mass;
// the only sky is small pale gaps between the leaves. Light shafts, fairy
// lights and a narrow earth floor complete the slice of woods.
import { createPaintEngine } from "../../lib/paintEngine";

const C = {
  seed: 5284,
  ground: "#f4eee2",
  washes: ["#e3ead2", "#c7d9ad", "#9fbf8a", "#6f9c6a"],
  foliage: ["#3c6b45", "#274e33", "#183624", "#6fa25c"],
  accents: ["#e0a13f", "#c7466b", "#4f8fc7", "#f0d97a"],
  highlights: ["#fff3c0", "#fffaf0"],
};

// Warm fairy lights strung between two trunks.
function drawFairyLights(h, x0, y0, x1, y1, C, sz) {
  const { brush, rr, pickOne, jitterEllipse, washStyle } = h;
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const sag = Math.sin(Math.PI * t) * sz;
    const y = y0 + (y1 - y0) * t + sag;
    washStyle(pickOne(C.highlights), 220);
    brush.polygon(jitterEllipse(x, y, sz * 0.13, sz * 0.13, 6, 0.2));
    if (i % 2 === 0) {
      washStyle(C.highlights[0], 190);
      brush.polygon(jitterEllipse(x + rr(-sz, sz), y + rr(-sz * 0.6, sz * 0.6), sz * 0.05, sz * 0.05, 5, 0.3));
    }
  }
}

function buildScene(W, H, m, h) {
  const S = h.S;
  const {
    p,
    brush,
    rr,
    mixHex,
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
    foliageCols,
  } = h;
  const { coverage, density: dens, scale: sc, detail: det, touch } = S;
  const { washes, foliage, accents, highlights } = C;
  const out = [];

  p.randomSeed(C.seed);
  p.noiseSeed(C.seed);

  const G = foliageCols(C);

  // --- interior gloom: soft base + dark upper shade ------------------------
  if (coverage > 0.02) out.push(dWash(washes[0], Math.round(coverage * 180)));
  out.push(dBand(-20, H + 20, mixHex(washes[3], G.shade, 0.45), 195, m * 0.02));
  out.push(dBand(-20, H * 0.2, mixHex(G.shade, washes[3], 0.3), 205, m * 0.02));

  // --- small sky gaps poked through the leaves (the only "sky" there is) ---
  for (let i = 0; i < 6; i++) {
    const gx = W * rr(0.05, 0.95),
      gy = H * rr(0.02, 0.13);
    const gr = W * rr(0.03, 0.06);
    out.push(dBlob(gx, gy, gr, gr * 0.6, mixHex(highlights[1], washes[0], 0.5), 195, 0.6, 0.4, 0, 0.1, 380));
  }

  // --- dense canopy mass across the top, dark clumps over the gaps ---------
  for (let i = 0; i < 9; i++) {
    const cx0 = W * (i / 8) + rr(-W * 0.03, W * 0.03);
    const cy0 = H * 0.12 + rr(-H * 0.03, H * 0.05);
    const cr = W * rr(0.06, 0.12);
    out.push(dBlob(cx0, cy0, cr, cr * 0.75, i % 2 ? G.deep : G.shade, 210, 0.4, 0.55, 0, 0.12, 420));
  }
  for (let i = 0; i < 14; i++) {
    const cx0 = W * ((i + 0.5) / 14) + rr(-W * 0.02, W * 0.02);
    const cy0 = H * rr(0.08, 0.22);
    const cr = W * rr(0.05, 0.09);
    out.push(dBlob(cx0, cy0, cr, cr * 0.7, i % 2 ? G.mid : G.deep, 205, 0.4, 0.6, 0, 0.14, 400));
  }

  // --- dappled light hanging in the mid air --------------------------------
  for (let i = 0; i < 8; i++) {
    out.push(dBlob(W * rr(0.1, 0.9), H * rr(0.24, 0.6), W * rr(0.04, 0.09), H * rr(0.02, 0.06), mixHex(highlights[0], G.light, 0.5), 130, 0.5, 0.4, 0, 0.2, 360));
  }

  // --- the trunk corridor: verticals crowding the frame, near = big/dark ----
  const trunks = [];
  for (let i = 0; i < 27 + Math.round(dens * 14); i++) {
    const r = p.random();
    let x0;
    if (r < 0.4) x0 = rr(W * 0.02, W * 0.24);
    else if (r < 0.52) x0 = rr(W * 0.4, W * 0.6);
    else x0 = rr(W * 0.76, W * 0.98);
    const near = 1 - Math.pow(p.random(), 1.5);
    const y0 = H * (0.8 + 0.17 * near);
    const len = -H * rr(0.45, 0.75) * (0.72 + 0.38 * near);
    const sway = (W * 0.5 - x0) / W * rr(10, 30) * (m / 600) * (0.45 + near);
    const weight = rr(0.9, 2.0) + near * rr(0.5, 1.2) * (0.8 + sc * 0.2);
    const trunkCol = mixHex(G.shade, "#3b2c22", 0.4 + 0.3 * near);
    out.push(dStrand(x0, y0, len, sway, trunkCol, weight, "rim"));
    trunks.push({ x: x0 + sway, y: y0 + len, near });
  }

  // --- shafts of light spilling down from the canopy gaps ------------------
  const shaftAnchors = [
    [W * 0.28, H * 0.1],
    [W * 0.6, H * 0.13],
    [W * 0.82, H * 0.08],
  ];
  for (let i = 0; i < 3; i++) {
    const ax = shaftAnchors[i][0] + rr(-W * 0.02, W * 0.02);
    const ay = shaftAnchors[i][1] + rr(-H * 0.01, H * 0.01);
    const lean = (ax < W * 0.5 ? -1 : 1) * rr(0.3, 0.55);
    const reach = H * rr(0.55, 0.72);
    const topHalf = W * rr(0.018, 0.03);
    const botHalf = topHalf * 2.4;
    const x0 = ax,
      x1 = ax + Math.tan(lean) * reach;
    const pts = [
      [x0 - topHalf, ay],
      [x0 + topHalf, ay],
      [x1 + botHalf, ay + reach],
      [x1 - botHalf, ay + reach],
    ];
    out.push(
      D(
        () => {
          fillStyle(mixHex(highlights[1], "#ffffff", 0.2), 75, 0.55, 0.4, 0.3);
          brush.polygon(pts);
          fillStyle(mixHex(highlights[0], "#ffffff", 0.35), 60, 0.55, 0.4, 0.3);
          brush.polygon(pts);
        },
        bboxOf(pts, 10, W, H),
        raxis(),
        rdir(),
        420,
        80
      )
    );
  }

  // --- fairy lights strung between two trunks + fireflies -------------------
  const lit = trunks.filter((t) => t.near > 0.5 && t.y > H * 0.18);
  if (lit.length >= 6) {
    const sorted = lit.sort((a, b) => a.x - b.x);
    const A = sorted[Math.floor(sorted.length * 0.28)];
    const B = sorted[Math.floor(sorted.length * 0.72)];
    const bbLights = bboxOf([[A.x, A.y], [B.x, B.y]], m * 0.08, W, H);
    out.push(D(() => drawFairyLights(h, A.x, A.y + m * 0.01, B.x, B.y + m * 0.01, C, m * 0.03), bbLights, raxis(), rdir(), 260, 60));
  }
  const fireflies = [];
  for (let i = 0; i < Math.round(10 + det * 10); i++) {
    fireflies.push({ color: p.random() < 0.6 ? highlights[0] : accents[3] || highlights[0], pts: jitterEllipse(W * rr(0.1, 0.9), H * rr(0.25, 0.8), m * 0.004, m * 0.004, 6, 0.2), op: 210 });
  }
  out.push(...dMarks(fireflies, 170, 26));

  // --- narrow earthy floor + mossy scatter ---------------------------------
  out.push(dBand(H * 0.85, H + 20, mixHex(washes[1], foliage[2], 0.5), 175, m * 0.014));
  const moss = [];
  for (let i = 0; i < Math.round(18 + dens * 16); i++) {
    const mx = rr(W * 0.05, W * 0.95),
      my = H * rr(0.82, 0.97);
    const ms = m * rr(0.008, 0.02);
    moss.push({ color: p.random() < 0.4 ? G.light : G.mid, pts: jitterEllipse(mx, my, ms, ms * 0.6, 7, 0.25, rr(0, p.TWO_PI)), op: 205 });
  }
  out.push(...dMarks(moss, 180, 30));

  const touchPts = [];
  for (let i = 0; i < 8; i++) touchPts.push([rr(W * 0.05, W * 0.95), rr(H * 0.8, H * 0.96), 8]);
  out.push(...dTouches(touchPts, C, Math.round(touch * 8), () => p.HALF_PI + rr(-0.35, 0.35)));

  return out;
}

export default createPaintEngine({ buildScene, ground: C.ground });