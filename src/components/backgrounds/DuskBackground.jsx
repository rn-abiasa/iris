// DuskBackground — standing on a hilltop watching the night arrive (wish page).
//
// LOW horizon (just a dark hill silhouette in the bottom quarter): the night
// sky owns >70% of the frame — gradient indigo bands, a sweep of stars, a
// thin crescent moon and warm lanterns lifting off the hillside. No path:
// the wish is entirely in the sky.
import { createPaintEngine } from "../../lib/paintEngine";

const C = {
  seed: 6395,
  ground: "#f4eee2",
  washes: ["#3a3a63", "#2c2c52", "#1f2140", "#161832"],
  foliage: ["#243428", "#182018", "#0f1610", "#33452f"],
  accents: ["#e9c46a", "#f4a261", "#e0e0f0", "#cdb4db"],
  highlights: ["#ffe9a8", "#fdf6e3"],
};

// A warm floating lantern — the wish, rising.
function drawLantern(h, x, y, s, C) {
  const { brush, mixHex, jitterEllipse, fillStyle, washStyle } = h;
  fillStyle(C.highlights[0], 210, 0.4, 0.5, 0.3);
  brush.polygon(jitterEllipse(x, y, s * 0.35, s * 0.5, 10, 0.12));
  washStyle(mixHex(C.highlights[0], "#ffffff", 0.4), 230);
  brush.polygon(jitterEllipse(x, y - s * 0.05, s * 0.15, s * 0.2, 8, 0.1));
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
  } = h;
  const { coverage, detail: det, touch } = S;
  const { washes, foliage, accents, highlights } = C;
  const out = [];

  // The hill skyline sits low in the frame.
  const horizonY = H * 0.8;

  p.randomSeed(C.seed);
  p.noiseSeed(C.seed);

  // --- night sky: deep wash, gradient bands, warm afterglow, faint band ----
  if (coverage > 0.02) out.push(dWash(washes[0], Math.round(150 + coverage * 90)));
  out.push(dBand(-20, H * 0.42, washes[2], 195, m * 0.02));
  out.push(dBand(H * 0.38, horizonY + H * 0.04, washes[3], 215, m * 0.014));
  out.push(dBlob(W * 0.5, horizonY - H * 0.05, W * 0.3, H * 0.07, mixHex(highlights[1], washes[1], 0.5), 105, 0.7, 0.45, 0, 0.25, 460));
  out.push(dBlob(W * 0.5, H * 0.3, W * 0.46, H * 0.17, mixHex(accents[3] || washes[1], washes[3], 0.45), 62, 0.75, 0.4, -0.18, 0.3, 520));

  // --- stars -----------------------------------------------------------------
  const stars = [];
  for (let i = 0; i < Math.round(46 + det * 30); i++) {
    const y = H * rr(0.02, 0.78);
    const x = rr(0, W);
    const s = m * rr(0.0026, 0.006) * (1.7 - (y / H) * 1.2);
    stars.push({ color: p.random() < 0.6 ? highlights[1] : pickOne(accents), pts: jitterEllipse(x, y, s, s, 5, 0.35), op: rr(170, 245) });
  }
  out.push(...dMarks(stars, 150, 24));

  // --- crescent moon (a bright disc shaved by an offset night-tone circle) --
  const moonX = W * 0.74 + rr(-W * 0.02, W * 0.02);
  const moonY = H * (0.13 + rr(-0.02, 0.02));
  const moonR = m * 0.05;
  const bbMoon = [Math.max(0, moonX - moonR * 1.6), Math.max(0, moonY - moonR * 1.6), Math.min(W, moonX + moonR * 1.6), Math.min(H, moonY + moonR * 1.6)].map(Math.round);
  out.push(
    D(
      () => {
        washStyle(mixHex(highlights[1], "#ffffff", 0.32), 140);
        brush.polygon(jitterEllipse(moonX, moonY, moonR * 1.35, moonR * 1.35, 14, 0.08));
        washStyle(highlights[1], 240);
        brush.polygon(jitterEllipse(moonX, moonY, moonR, moonR, 14, 0.05));
        const cutX = moonX + moonR * 0.45,
          cutY = moonY - moonR * 0.08;
        washStyle(mixHex(washes[3], "#161832", 0.5), 235);
        brush.polygon(jitterEllipse(cutX, cutY, moonR * 0.93, moonR * 0.93, 14, 0.06));
      },
      bbMoon,
      raxis(),
      rdir(),
      340,
      60
    )
  );

  // --- the dark hill silhouette ---------------------------------------------
  const hillPts = [[-10, horizonY + H * 0.12]];
  const nH = 9;
  for (let i = 0; i <= nH; i++) {
    const x = -10 + (W + 20) * (i / nH);
    const swell = Math.abs(Math.sin(i * 2.2));
    const bump = swell > 0.35 ? (swell - 0.35) / 0.65 : 0;
    const y = horizonY - H * rr(0.012, 0.05) * bump + rr(-H * 0.006, H * 0.008);
    hillPts.push([x, y]);
  }
  hillPts.push([W + 10, horizonY + H * 0.12], [W + 10, H + 20], [-10, H + 20]);
  out.push(D(() => { fillStyle(mixHex(foliage[2], "#0b0d15", 0.5), 225, 0.3, 0.5, 0.35); brush.polygon(hillPts); }, bboxOf(hillPts, m * 0.04, W, H), "x", rdir(), 480, 90));

  // a few scruffy trees standing on the skyline
  for (let i = 0; i < 6; i++) {
    const tx0 = W * rr(0.08, 0.92);
    const ty0 = horizonY - H * rr(0.01, 0.04);
    const tl = -H * rr(0.02, 0.05);
    out.push(dStrand(tx0, ty0, tl, rr(-2, 2), mixHex(foliage[1], "#0b0d15", 0.4), rr(0.8, 1.3), "rim"));
  }

  // --- lanterns lifting off the hill ------------------------------------------
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const lx = W * (0.5 + (t - 0.5) * 0.22 + rr(-0.03, 0.03));
    const ly = horizonY - H * (0.05 + 0.5 * t) + rr(-H * 0.01, H * 0.01);
    const ls = m * (0.042 - t * 0.018);
    const bbL = [Math.max(0, lx - ls * 1.2), Math.max(0, ly - ls * 1.6), Math.min(W, lx + ls * 1.2), Math.min(H, ly + ls * 0.6)].map(Math.round);
    out.push(D(() => drawLantern(h, lx, ly, ls, C), bbL, raxis(), rdir(), 260, 60));
  }

  // grass hints along the hilltop
  const touchPts = [];
  for (let i = 0; i < 8; i++) touchPts.push([rr(0, W), rr(horizonY, H * 0.96), 8]);
  out.push(...dTouches(touchPts, C, Math.round(touch * 8), () => p.HALF_PI + rr(-0.3, 0.3)));

  return out;
}

export default createPaintEngine({ buildScene, ground: C.ground });