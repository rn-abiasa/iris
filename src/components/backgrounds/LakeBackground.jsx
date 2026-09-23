// LakeBackground — standing at the water's edge (memories page).
//
// Low viewpoint, HIGH horizon (sky is a sliver, water fills >60% of the
// frame): layered horizontal ripples receding toward a distant wooded shore, a
// small wooden boat drifting as the focal point, and reeds framing only the
// bottom corners. There is deliberately NO path in this scene — the rhythm is
// horizontal (water), not the vertical strands of the garden.
import { createPaintEngine } from "../../lib/paintEngine";

const C = {
  seed: 2041,
  ground: "#f4eee2",
  washes: ["#dce6ea", "#c9dbe0", "#aac4d6", "#9fc2b8"],
  foliage: ["#5f8a78", "#3f6b5c", "#2c4a40", "#a8c9a0"],
  accents: ["#e8a7c0", "#c98fb0", "#7f9fc4", "#d7e6ee", "#f0c9dc"],
  highlights: ["#f4e7b0", "#fff8ea"],
};

// A small wooden sailboat — focal object unique to the lake.
function drawBoat(h, x, y, s) {
  const { brush, mixHex, fillStyle, washStyle, strokeStyle } = h;
  const S = h.S;
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

function drawBoatReflection(h, x, y, s) {
  const { brush, mixHex, jitterEllipse, fillStyle } = h;
  const wood = mixHex(C.accents[1] || C.accents[0], "#3a2313", 0.55);
  fillStyle(wood, 90, 0.6, 0.6, 0.3);
  brush.polygon(jitterEllipse(x, y, s * 1.15, s * 0.22, 10, 0.2));
}

function buildScene(W, H, m, h) {
  const S = h.S;
  const {
    p,
    brush,
    rr,
    pickOne,
    mixHex,
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
    washStyle,
    foliageCols,
  } = h;
  const { water, coverage, density: dens, scale: sc, detail: det, touch } = S;
  const { washes, foliage, highlights } = C;
  const out = [];

  // The horizon is HIGH: the sky is a thin band and the water dominates.
  const topY = H * 0.3;

  p.randomSeed(C.seed);
  p.noiseSeed(C.seed);

  const G = foliageCols(C);

  // --- the small sky -----------------------------------------------------
  if (coverage > 0.02) out.push(dWash(washes[0], Math.round(coverage * 200)));
  out.push(dBand(-20, topY + H * 0.04, washes[2], Math.round(185 - water * 40), m * 0.028));

  // --- distant wooded shore silhouette just above the waterline ----------
  out.push(dBand(topY - H * 0.03, topY + H * 0.015, mixHex(foliage[0], washes[3], 0.6), 170, m * 0.012));
  for (let i = 0; i < 7; i++) {
    const x = (W * (i + 0.5)) / 7 + rr(-W * 0.03, W * 0.03);
    const y = topY + rr(-H * 0.006, H * 0.012);
    out.push(dBlob(x, y, W * rr(0.02, 0.045), m * rr(0.004, 0.01), mixHex(foliage[1], washes[2], 0.45), 165, 0.4, 0.5, 0, 0.15, 320));
  }

  // --- the water itself --------------------------------------------------
  const waterBase = mixHex(washes[3], washes[0], 0.45);
  out.push(dBand(topY + H * 0.02, H + 20, waterBase, 165, m * 0.02));

  // sky reflection shimmer right under the shore
  for (let i = 0; i < 5; i++) {
    const y = topY + H * rr(0.03, 0.17);
    out.push(dBlob(W * rr(0.15, 0.85), y, W * rr(0.06, 0.14), m * rr(0.006, 0.013), mixHex(washes[2], highlights[0], 0.4), 120, 0.5, 0.4, 0, 0.25, 300));
  }

  // --- layered horizontal ripples: tight near the horizon, wide near us ---
  const RIPPLE_LAYERS = 8;
  for (let i = 0; i < RIPPLE_LAYERS; i++) {
    const t = i / (RIPPLE_LAYERS - 1);
    const y0 = topY + H * 0.05 + (H - topY) * 0.9 * Math.pow(t, 1.55);
    const thick = m * (0.004 + 0.026 * t);
    const cool = i % 3 === 0;
    out.push(
      dBand(
        y0,
        y0 + thick,
        cool ? mixHex(highlights[1], waterBase, 0.3) : mixHex(waterBase, foliage[1], 0.45),
        Math.round(cool ? 190 - water * 50 : 150 - water * 40),
        m * (0.005 + 0.024 * t)
      )
    );
    // a thin highlight line riding each ripple crest
    out.push(
      dBand(
        y0 - m * 0.002,
        y0 + m * 0.001,
        mixHex(highlights[1], "#ffffff", 0.35),
        140,
        m * (0.004 + 0.014 * t)
      )
    );
  }

  // --- boat + reflection (the focal point) ------------------------------
  const by = H * (0.5 + rr(-0.02, 0.03));
  const bx = W * 0.5 + rr(-W * 0.07, W * 0.07);
  const bs0 = m * rr(0.055, 0.07);
  const bbBoat = [Math.max(0, bx - bs0 * 2.2), Math.max(0, by - bs0 * 2.4), Math.min(W, bx + bs0 * 2.2), Math.min(H, by + bs0 * 1.4)].map(Math.round);
  out.push(D(() => drawBoatReflection(h, bx, by + bs0 * 0.45, bs0), bbBoat, raxis(), rdir(), 240, 60));
  out.push(D(() => drawBoat(h, bx, by, bs0), bbBoat, raxis(), rdir(), 360, 90));

  // --- reeds framing the bottom corners (no flowers — pure water edge) ---
  for (const side of [-1, 1]) {
    const cx0 = W * (0.5 + side * 0.4);
    const cy0 = H * (0.92 + rr(0, 0.03));
    // low shoreline bank in the corner
    out.push(dBlob(cx0 + side * W * 0.05, H * 0.97, W * 0.24, H * 0.07, mixHex(foliage[2], washes[3], 0.4), 185, 0.5, 0.55, side * 0.12, 0.15, 360));
    for (let i = 0; i < 13 + Math.round(dens * 8); i++) {
      const x0 = cx0 + rr(-W * 0.11, W * 0.09);
      const y0 = cy0 + rr(0, H * 0.02);
      const len = -H * rr(0.16, 0.34) * (0.45 + 0.55 * Math.pow(p.random(), 0.6));
      const sway = -side * rr(6, 22) * (m / 600);
      const color = p.random() < 0.35 ? G.deep : mixHex(foliage[1], foliage[2], 0.4);
      out.push(dStrand(x0, y0, len, sway, color, rr(0.7, 1.05) * sc * (1.5 - 0.6 * det), "rim"));
      if (i % 4 === 0) {
        const tx = x0 + sway,
          ty = y0 + len;
        const bb = [Math.max(0, tx - 8), Math.max(0, ty - 12), Math.min(W, tx + 8), Math.min(H, ty + 6)].map(Math.round);
        out.push(D(() => { washStyle(mixHex(washes[1], "#4a3320", 0.5), 225); brush.polygon(jitterEllipse(tx, ty, m * 0.006, m * 0.012, 8, 0.12)); }, bb, "y", -1, 160, 26));
      }
    }
  }

  // --- sun sparkle riding the ripples ------------------------------------
  const sparkle = [];
  for (let i = 0; i < Math.round(14 + det * 14); i++) {
    const y = H * rr(0.34, 0.96),
      x = rr(W * 0.06, W * 0.94);
    sparkle.push({ color: pickOne(highlights), pts: jitterEllipse(x, y, m * 0.01, m * 0.003, 6, 0.3, 0), op: 200 });
  }
  out.push(...dMarks(sparkle, 180, 30));

  // loose painter's touches on the water
  const touchPts = [];
  for (let i = 0; i < 6; i++) touchPts.push([rr(0, W), rr(topY + H * 0.2, H * 0.97), 8]);
  out.push(...dTouches(touchPts, C, Math.round(touch * 10), () => rr(0, p.TWO_PI)));

  return out;
}

export default createPaintEngine({ buildScene, ground: C.ground });