// MountainBackground — a wide vista from a distance (message page).
//
// LOW horizon (sky dominates >50%): atmospheric mountain layers receding
// far-blue → near-green-gold, a narrow valley pinched between two dark
// foreground slopes, and a tiny cabin far down that valley. The path, when
// present, is a whisper in the valley — never the main element.
import { createPaintEngine } from "../../lib/paintEngine";

const C = {
  seed: 3092,
  ground: "#f4eee2",
  washes: ["#e7d9c9", "#d7c6d8", "#b9a8c6", "#8f97b6"],
  foliage: ["#4c6b52", "#33503b", "#213328", "#7fa06e"],
  accents: ["#d98a4f", "#c76b4a", "#e0b04a", "#f0d9a0", "#b5522f"],
  highlights: ["#ffd9a0", "#fff3e0"],
};

// A tiny hut — focal point unique to the valley vista.
function drawCabin(h, x, y, s) {
  const { brush, mixHex, jitterEllipse, fillStyle, washStyle } = h;
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
function buildScene(W, H, m, h) {
  const S = h.S;
  const {
    p,
    brush,
    rr,
    pickOne,
    mixHex,
    vivid,
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
    strokeStyle,
    foliageCols,
  } = h;
  const { water, coverage, density: dens, scale: sc, touch } = S;
  const { washes, foliage, accents, highlights } = C;
  const out = [];

  // LOW horizon — the sky owns the frame; the highest ridge peaks at ~0.26H.
  const seamY = H * 0.66;

  p.randomSeed(C.seed);
  p.noiseSeed(C.seed);

  const G = foliageCols(C);

  // --- the big sky ---------------------------------------------------------
  if (coverage > 0.02) out.push(dWash(washes[0], Math.round(coverage * 200)));
  out.push(dBand(-20, H * 0.3, washes[1], Math.round(180 - water * 40), m * 0.03));
  out.push(dBand(H * 0.26, H * 0.56, washes[2], Math.round(195 - water * 40), m * 0.024));
  // sun glow
  out.push(dBlob(W * 0.5 + rr(-W * 0.05, W * 0.05), H * 0.2, W * 0.12, H * 0.07, highlights[1], 110, 0.6, 0.45, 0, 0.2, 420));
  // drifting clouds
  for (let i = 0; i < 4; i++) {
    out.push(dBlob(W * rr(0.12, 0.88), H * rr(0.07, 0.3), W * rr(0.09, 0.2), m * rr(0.006, 0.014), mixHex(highlights[1], washes[0], 0.3), 150, 0.55, 0.4, 0, 0.25, 380));
  }

  // --- silhouette birds high in the sky -----------------------------------
  for (let i = 0; i < 4; i++) {
    const bx0 = W * rr(0.25, 0.82),
      by0 = H * rr(0.05, 0.2);
    const bw = m * rr(0.014, 0.024);
    const bbBird = [Math.max(0, bx0 - bw * 1.2), Math.max(0, by0 - bw), Math.min(W, bx0 + bw * 1.2), Math.min(H, by0 + bw * 0.5)].map(Math.round);
    out.push(
      D(
        () => {
          strokeStyle("flick", mixHex(foliage[2], "#000000", 0.35), 0.9 * S.brushSize);
          brush.spline(
            [
              [bx0 - bw, by0 + bw * 0.35],
              [bx0 - bw * 0.35, by0 - bw * 0.15],
              [bx0, by0 - bw * 0.7],
              [bx0 + bw * 0.45, by0 - bw * 0.25],
              [bx0 + bw, by0 + bw * 0.35],
            ],
            0.3
          );
        },
        bbBird,
        "x",
        rdir(),
        150,
        30
      )
    );
  }

  // --- atmospheric ridge layers (farther = paler & bluer) -----------------
  const ridge = (baseY, amp, n = 8) => {
    const pts = [[-10, baseY + 5]];
    for (let i = 0; i <= n; i++) {
      const x = -10 + (W + 20) * (i / n);
      const bump = Math.abs(Math.sin(i * 2.3 + baseY * 0.013));
      const peak = baseY - amp * (0.35 + 0.65 * bump) * rr(0.8, 1.12);
      pts.push([x, peak]);
    }
    pts.push([W + 10, baseY + 5], [W + 10, H + 20], [-10, H + 20]);
    return pts;
  };

  const farR = ridge(H * 0.36, H * 0.1);
  out.push(D(() => { fillStyle(mixHex(washes[2], "#b8c4d8", 0.55), 155, 0.3, 0.42, 0.3); brush.polygon(farR); }, bboxOf(farR, m * 0.05, W, H), "x", rdir(), 520, 90));

  const midR = ridge(H * 0.52, H * 0.13);
  out.push(D(() => { fillStyle(mixHex(washes[3], "#8d9db4", 0.35), 175, 0.3, 0.45, 0.3); brush.polygon(midR); }, bboxOf(midR, m * 0.05, W, H), "x", rdir(), 540, 90));

  // a last, nearer ridge glimpsed behind the valley lips
  const nearR = ridge(H * 0.62, H * 0.06, 7);
  out.push(D(() => { fillStyle(mixHex(foliage[0], washes[3], 0.5), 185, 0.3, 0.5, 0.3); brush.polygon(nearR); }, bboxOf(nearR, m * 0.05, W, H), "x", rdir(), 480, 80));

  // --- the valley floor (the two dark slopes open like a V over it) -------
  const seamHalf = W * 0.065;
  const botHalf = W * 0.2;
  const valleyTrap = [
    [W * 0.5 - seamHalf, seamY],
    [W * 0.5 + seamHalf, seamY],
    [W * 0.5 + botHalf, H + 20],
    [W * 0.5 - botHalf, H + 20],
  ];
  out.push(D(() => { fillStyle(mixHex(washes[1], G.mid, 0.35), 190, 0.35, 0.45, 0.3); brush.polygon(valleyTrap); }, bboxOf(valleyTrap, m * 0.05, W, H), "y", -1, 500, 90));

  // the path, tiny and incidental — just streaks down the valley centre
  const pathTrap = [
    [W * 0.5 - W * 0.012, seamY + H * 0.03],
    [W * 0.5 + W * 0.012, seamY + H * 0.03],
    [W * 0.5 + W * 0.028, H * 0.92],
    [W * 0.5 - W * 0.028, H * 0.92],
  ];
  out.push(D(() => { fillStyle(mixHex(washes[1], highlights[0], 0.5), 200, 0.35, 0.4, 0.3); brush.polygon(pathTrap); }, bboxOf(pathTrap, 10, W, H), "y", -1, 420, 80));

  // --- the cabin, far down the valley --------------------------------------
  const cx = W * 0.5 + rr(-W * 0.02, W * 0.02);
  const cy = seamY + H * 0.03;
  const cs = m * rr(0.085, 0.11);
  const bbCabin = [Math.max(0, cx - cs), Math.max(0, cy - cs * 1.4), Math.min(W, cx + cs), Math.min(H, cy + cs)].map(Math.round);
  out.push(D(() => drawCabin(h, cx, cy, cs), bbCabin, raxis(), rdir(), 360, 85));

  // chimney smoke
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    out.push(
      dBlob(
        cx + cs * 0.36 + rr(-cs * 0.05, cs * 0.1) * (1 + t),
        cy - cs * 0.95 - cs * 0.5 * t,
        cs * (0.08 + t * 0.05),
        cs * (0.08 + t * 0.05),
        mixHex(highlights[1], "#8a8a90", 0.35),
        Math.round(140 - t * 60),
        0.6,
        0.5,
        0,
        0.2,
        260
      )
    );
  }

  // --- the two dark foreground slopes closing into the valley --------------
  const leftSlope = [
    [-10, H * 0.6],
    [W * 0.5 - seamHalf, seamY],
    [W * 0.5 - botHalf, H + 20],
    [-10, H + 20],
  ];
  const rightSlope = [
    [W + 10, H * 0.6],
    [W * 0.5 + seamHalf, seamY],
    [W * 0.5 + botHalf, H + 20],
    [W + 10, H + 20],
  ];
  out.push(D(() => { fillStyle(mixHex(G.shade, washes[3], 0.4), 200, 0.3, 0.5, 0.3); brush.polygon(leftSlope); }, bboxOf(leftSlope, 10, W, H), "y", -1, 520, 90));
  out.push(D(() => { fillStyle(mixHex(G.deep, G.shade, 0.45), 205, 0.3, 0.5, 0.3); brush.polygon(rightSlope); }, bboxOf(rightSlope, 10, W, H), "y", -1, 520, 90));

  // --- pines climbing the foreground slopes -------------------------------
  const PINE_COUNT = 8 + Math.round(dens * 6);
  for (let i = 0; i < PINE_COUNT; i++) {
    const side = i < PINE_COUNT / 2 ? -1 : 1;
    const y = H * rr(0.74, 0.98);
    const x = W * 0.5 + side * rr(W * (0.2 + 0.08 * p.random()), W * 0.5);
    const len = -H * rr(0.1, 0.2);
    const col = p.random() < 0.4 ? G.deep : G.shade;
    out.push(dStrand(x, y, len, -side * rr(2, 6), col, rr(1.0, 1.6) * (0.8 + sc * 0.2), "rim"));
  }

  // --- wildflowers at the camera's edge -----------------------------------
  const wild = [];
  for (let i = 0; i < Math.round(10 + dens * 8); i++) {
    const side = p.random() < 0.5 ? -1 : 1;
    const y = H * rr(0.74, 0.96);
    const x = W * 0.5 + side * rr(W * 0.16, W * 0.46);
    const s = m * rr(0.006, 0.011);
    wild.push({ color: vivid(pickOne(accents), S.vivid), pts: jitterEllipse(x, y, s, s * 0.7, 6, 0.2), op: 210 });
  }
  out.push(...dMarks(wild, 170, 30));

  const touchPts = [];
  for (let i = 0; i < 8; i++) {
    const y = H * rr(0.72, 0.97);
    const side = p.random() < 0.5 ? -1 : 1;
    touchPts.push([W * 0.5 + side * rr(W * 0.06, W * 0.44), y, 10]);
  }
  out.push(...dTouches(touchPts, C, Math.round(touch * 12), () => p.HALF_PI + rr(-0.2, 0.2)));

  return out;
}

export default createPaintEngine({ buildScene, ground: C.ground });