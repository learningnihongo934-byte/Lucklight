// Lucklight pixel renderer: the night shrine, the hero sprite, and every aura effect.
// Everything is drawn in logical pixels; the canvas is scaled up with image-rendering: pixelated.
export const W = 160, H = 120;
export const HERO_X = 80, HERO_Y = 82; // hero centre (feet at y+8)

const TAU = Math.PI * 2;
const R = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453; return x - Math.floor(x); };
let C = null;
const px = (x, y, c) => { C.fillStyle = c; C.fillRect(Math.round(x), Math.round(y), 1, 1); };
const rect = (x, y, w, h, c) => { C.fillStyle = c; C.fillRect(Math.round(x), Math.round(y), w, h); };
const disc = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); rect(cx - w, cy + y, w * 2 + 1, 1, c); } };
const line = (x0, y0, x1, y1, c) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) px(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
};
// ellipse of dots; L = 'b' draws the far half, 'f' the near half, null all
const ell = (L, cx, cy, rx, ry, c, n = 36, ph = 0) => {
  for (let i = 0; i < n; i++) {
    const a = ph + i / n * TAU, s = Math.sin(a);
    if (L === 'b' && s > 0) continue; if (L === 'f' && s <= 0) continue;
    px(cx + Math.cos(a) * rx, cy + s * ry, c);
  }
};

// ---------- hero
const HERO = [
  '...kkkk...', '.kkhhhhkk.', 'khhhhhhhhk', 'khhsssshhk', 'khsesseshk', 'khsssssshk',
  '.kssssssk.', '..kwwwwk..', '.krrwwrrk.', 'krrrwwrrrk', 'krrrbbrrrk', 'ksrbbbbrsk',
  '.krrrrrrk.', '.krrrrrrk.', '.kbbbbbbk.', '.kbbkkbbk.', '.kbk..kbk.', '.kkk..kkk.',
];
const HP = { k: '#1a1420', h: '#2b2238', s: '#f0c8a0', e: '#1a1420', w: '#efe6d2', r: '#b8342a', b: '#2a3a6a' };
function hero(cx, cy, t, sil) {
  const blink = (t % 4.3) < 0.13, ox = cx - 5, oy = cy - 9;
  for (let y = 0; y < HERO.length; y++) for (let x = 0; x < 10; x++) {
    let ch = HERO[y][x]; if (ch === '.') continue;
    if (ch === 'e' && blink) ch = 's';
    px(ox + x, oy + y, sil || HP[ch]);
  }
}

// ---------- scene (static part cached)
let sceneCache = null;
function buildScene() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const prev = C; C = cv.getContext('2d');
  const bands = ['#141833', '#1a1e3e', '#222548', '#2c2c54', '#3a345e', '#4a3f66'];
  for (let y = 0; y < 78; y++) {
    const f = y / 78 * (bands.length - 1), i = Math.floor(f), fr = f - i;
    for (let x = 0; x < W; x++) {
      const d = ((x + y) % 2 === 0 ? 0.25 : 0.75) < fr; // ordered dither between bands
      px(x, y, bands[Math.min(bands.length - 1, i + (d ? 1 : 0))]);
    }
  }
  // moon
  disc(128, 20, 7, '#efe3c8'); px(125, 18, '#d8c9a6'); rect(129, 21, 2, 2, '#d8c9a6'); px(131, 17, '#d8c9a6');
  // far hills + trees
  for (let x = 0; x < W; x++) {
    const h1 = 64 + Math.sin(x * 0.045) * 5 + Math.sin(x * 0.13 + 1) * 2;
    rect(x, h1, 1, 92 - h1, '#262645');
    const h2 = 74 + Math.sin(x * 0.09 + 2) * 3 + (R(x, 3) > 0.7 ? -2 : 0) + Math.abs(Math.sin(x * 0.6)) * -3;
    rect(x, h2, 1, 92 - h2, '#1b1b33');
  }
  // torii
  const red = '#b8342a', redD = '#8a2418', blk = '#1a1420';
  rect(52, 32, 4, 60, red); rect(55, 32, 1, 60, redD); rect(104, 32, 4, 60, red); rect(107, 32, 1, 60, redD);
  rect(50, 88, 8, 4, blk); rect(102, 88, 8, 4, blk);
  rect(46, 40, 68, 3, red); rect(46, 42, 68, 1, redD);
  rect(77, 31, 6, 9, red); rect(78, 33, 4, 5, '#f0d080');
  rect(40, 27, 80, 4, red); rect(40, 30, 80, 1, redD);
  rect(38, 25, 84, 2, blk); px(37, 24, blk); px(36, 23, blk); px(122, 24, blk); px(123, 23, blk);
  // ground: stone plaza
  for (let y = 92; y < H; y++) for (let x = 0; x < W; x++) {
    const tile = ((Math.floor(x / 12 + (Math.floor((y - 92) / 6) % 2) * 0.5)) + Math.floor((y - 92) / 6)) % 2;
    let c = tile ? '#4d4a58' : '#57535f';
    if ((y - 92) % 6 === 0 || (x + (Math.floor((y - 92) / 6) % 2) * 6) % 12 === 0) c = '#3a3744';
    px(x, y, c);
  }
  rect(0, 92, W, 1, '#6a6676');
  // pedestal
  for (let y = 0; y < 4; y++) { const w = 13 - Math.abs(y - 1) * 2; rect(HERO_X - w, 89 + y, w * 2, 1, y < 2 ? '#7a7684' : '#5e5a68'); }
  // stone lanterns
  for (const lx of [18, 142]) {
    rect(lx - 5, 89, 10, 3, '#6b6876'); rect(lx - 2, 78, 4, 11, '#7c7986'); rect(lx - 5, 76, 10, 2, '#6b6876');
    rect(lx - 4, 68, 8, 8, '#7c7986'); rect(lx - 2, 70, 4, 4, '#2a2020');
    rect(lx - 7, 65, 14, 3, '#8a8794'); rect(lx - 5, 63, 10, 2, '#8a8794'); rect(lx - 1, 61, 2, 2, '#8a8794');
  }
  // grass tufts
  for (let i = 0; i < 14; i++) { const gx = Math.floor(R(i, 9) * W), gy = 92 + Math.floor(R(i, 8) * 26); if (Math.abs(gx - 80) < 16 && gy < 96) continue; px(gx, gy, '#3f5a2a'); px(gx + 1, gy - 1, '#567a34'); px(gx + 2, gy, '#3f5a2a'); }
  C = prev; return cv;
}

function sceneLive(t) {
  for (let i = 0; i < 38; i++) {
    const sx = Math.floor(R(i) * W), sy = Math.floor(R(i, 1) * 58);
    if (Math.hypot(sx - 128, sy - 20) < 10) continue;
    const tw = Math.sin(t * (1 + R(i, 2) * 2) + i);
    if (tw > -0.3) px(sx, sy, tw > 0.7 ? '#fff6d8' : '#a8a4c8');
  }
  for (const lx of [18, 142]) {
    const f = Math.sin(t * 9 + lx) * 0.5 + Math.sin(t * 13) * 0.5;
    rect(lx - 2, 70, 4, 4, f > 0.3 ? '#ffd27a' : '#f6b24a'); px(lx - 1 + (f > 0 ? 1 : 0), 71, '#fff0b0');
  }
}

// ---------- aura effects. each: (a, t, cx, cy, L) with L = 'b' (behind hero) or 'f' (in front)
const pick = (a, i) => a.c[i % a.c.length];
const FX = {
  motes(a, t, cx, cy, L) {
    if (L === 'b') { ell(null, cx, cy + 9, 12, 3, a.c[0], 24, t * 0.3); return; }
    for (let i = 0; i < 16; i++) {
      const p = (t / (3 + R(i) * 2) + R(i, 1)) % 1;
      px(cx + (R(i, 2) - 0.5) * 26 + Math.sin(t * 1.3 + i) * 1.5, cy + 9 - p * 30, pick(a, i + (p > 0.5 ? 1 : 0)));
    }
  },
  leaves(a, t, cx, cy, L) {
    if (L === 'b') { ell(null, cx, cy + 9, 13, 3, a.c[1], 30, -t * 0.4); return; }
    for (let i = 0; i < 12; i++) {
      const p = (t / (2.6 + R(i) * 2) + R(i, 1)) % 1, x = cx + (R(i, 2) - 0.5) * 28 + Math.sin(t * 2 + i) * 2, y = cy + 9 - p * 32;
      px(x, y, pick(a, i)); if (Math.sin(t * 4 + i) > 0) px(x + 1, y - 1, a.c[2]); else px(x - 1, y, a.c[0]);
    }
  },
  rain(a, t, cx, cy, L) {
    if (L === 'b') { ell(null, cx, cy + 9, 14, 3, a.c[0], 28); return; }
    for (let i = 0; i < 18; i++) {
      const x = cx + (R(i) - 0.5) * 34, y = cy - 22 + ((t * 70 * (0.8 + R(i, 1) * 0.4) + R(i, 2) * 40) % 31);
      px(x, y, a.c[1]); px(x, y + 1, a.c[2]); px(x, y + 2, a.c[1]);
      if (y > cy + 5) { px(x - 1, cy + 9, a.c[2]); px(x + 1, cy + 9, a.c[2]); }
    }
  },
  fireflies(a, t, cx, cy, L) {
    for (let i = 0; i < 12; i++) {
      const x = cx + Math.sin(t * 0.7 * (0.5 + R(i)) + R(i, 1) * 6) * 17, y = cy - 2 + Math.cos(t * 0.9 * (0.5 + R(i, 2)) + R(i, 3) * 6) * 14;
      const front = Math.cos(t * 0.7 * (0.5 + R(i)) + R(i, 1) * 6) > 0;
      if ((L === 'f') !== front) continue;
      const b = Math.sin(t * 3 + i * 1.7);
      if (b > -0.2) { px(x, y, b > 0.6 ? a.c[2] : a.c[1]); if (b > 0.6) { px(x + 1, y, a.c[0]); px(x - 1, y, a.c[0]); px(x, y + 1, a.c[0]); px(x, y - 1, a.c[0]); } }
    }
  },
  flame(a, t, cx, cy, L) {
    const n = L === 'b' ? 34 : 14;
    for (let i = 0; i < n; i++) {
      const k = i + (L === 'b' ? 0 : 100), p = (t / (0.9 + R(k) * 0.7) + R(k, 1)) % 1;
      const spread = L === 'b' ? 14 : 9;
      const x = cx + (R(k, 2) - 0.5) * spread * 2 * (1 - p * 0.6) + Math.sin(t * 6 + k) * 1;
      const y = cy + 9 - p * (L === 'b' ? 30 : 20);
      const ci = p < 0.25 ? 3 : p < 0.5 ? 2 : p < 0.8 ? 1 : 0;
      px(x, y, a.c[ci]); if (L === 'b' && p < 0.5) px(x, y + 1, a.c[ci]);
    }
  },
  petals(a, t, cx, cy, L) {
    if (L === 'b') ell(null, cx, cy + 9, 14, 3, a.c[0], 30, t * 0.2);
    for (let i = 0; i < 14; i++) {
      const front = R(i, 5) > 0.5; if ((L === 'f') !== front) continue;
      const p = (t / (3 + R(i) * 2) + R(i, 1)) % 1;
      const x = cx - 22 + p * 44 + Math.sin(t * 2 + i) * 3, y = cy - 18 + R(i, 2) * 26 + p * 8 + Math.sin(t * 3 + i) * 2;
      const fl = Math.sin(t * 5 + i) > 0;
      px(x, y, a.c[1]); px(x + (fl ? 1 : 0), y + (fl ? 0 : 1), a.c[2]); if (fl) px(x - 1, y + 1, a.c[0]);
    }
  },
  frost(a, t, cx, cy, L) {
    for (let i = 0; i < 6; i++) {
      const an = t * 0.8 + i / 6 * TAU, s = Math.sin(an);
      if ((L === 'f') !== (s > 0)) continue;
      const x = cx + Math.cos(an) * 16, y = cy + s * 5 - 2 + Math.sin(t * 2 + i) * 2;
      px(x, y, a.c[2]); px(x - 1, y, a.c[1]); px(x + 1, y, a.c[1]); px(x, y - 1, a.c[1]); px(x, y + 1, a.c[1]);
      px(x - 2, y - 2, a.c[0]); px(x + 2, y + 2, a.c[0]); px(x + 2, y - 2, a.c[0]); px(x - 2, y + 2, a.c[0]);
    }
    if (L === 'f') for (let i = 0; i < 14; i++) { const x = cx + (R(i) - 0.5) * 40, y = cy - 24 + ((t * 9 * (0.7 + R(i, 1) * 0.6) + R(i, 2) * 40) % 36); px(x + Math.sin(t + i) * 2, y, a.c[2]); }
    else ell(null, cx, cy + 9, 14, 3, a.c[1], 36, 0);
  },
  waves(a, t, cx, cy, L) {
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 64; i++) {
      const an = i / 64 * TAU, s = Math.sin(an); if ((L === 'f') !== (s > 0)) continue;
      const r = 15 + ring * 4 + Math.sin(an * 6 + t * 3 + ring) * 1.5;
      const y = cy + 2 + s * 5 + Math.sin(an * 3 - t * 4) * 2 - ring * 3;
      px(cx + Math.cos(an) * r, y, a.c[1 + ring + (Math.sin(an * 6 + t * 3) > 0.7 ? 1 : 0)]);
    }
    if (L === 'b') for (let i = 0; i < 8; i++) { const p = (t * 0.8 + R(i)) % 1; px(cx + (R(i, 1) - 0.5) * 30, cy + 6 - p * 26, a.c[3]); }
  },
  bolts(a, t, cx, cy, L) {
    const seed = Math.floor(t / 0.55), ph = (t / 0.55) % 1;
    if (L === 'b') {
      ell(null, cx, cy + 9, 14, 3, a.c[1], 36, t);
      if (ph < 0.35) for (let b = 0; b < 2; b++) {
        let x = cx + (R(seed, b) - 0.5) * 30, y = cy - 32;
        while (y < cy + 6) { const nx = x + (R(seed * 7 + y, b) - 0.5) * 6, ny = y + 3; line(x, y, nx, ny, ph < 0.15 ? a.c[3] : a.c[2]); x = nx; y = ny; }
      }
    } else for (let i = 0; i < 10; i++) {
      if (R(seed * 3 + i, 4) > 0.6) continue;
      const an = R(seed + i, 1) * TAU, r = 7 + R(seed + i, 2) * 6, x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r * 1.1;
      px(x, y, a.c[3]); px(x + 1, y + 1, a.c[2]);
    }
  },
  lanterns(a, t, cx, cy, L) {
    if (L === 'b') ell(null, cx, cy + 9, 15, 3, a.c[1], 40, t * 0.5);
    for (let i = 0; i < 5; i++) {
      const an = t * 0.6 + i / 5 * TAU, s = Math.sin(an); if ((L === 'f') !== (s > 0)) continue;
      const x = Math.round(cx + Math.cos(an) * 19), y = Math.round(cy - 4 + s * 4 + Math.sin(t * 2 + i) * 2);
      const glow = Math.sin(t * 7 + i) > 0;
      px(x, y - 3, '#1a1420'); rect(x - 1, y - 2, 3, 4, a.c[1]); px(x, y - 1, glow ? a.c[3] : a.c[2]); px(x, y, a.c[2]); rect(x - 1, y + 2, 3, 1, '#1a1420');
      if (glow) { px(x - 2, y, a.c[0]); px(x + 2, y, a.c[0]); }
    }
  },
  foxfire(a, t, cx, cy, L) {
    for (let i = 0; i < 9; i++) {
      const an = t * 0.9 + i / 9 * TAU, s = Math.sin(an); if ((L === 'f') !== (s > 0)) continue;
      const x = cx + Math.cos(an) * 18, y = cy - 1 + s * 5 + Math.sin(t * 3 + i) * 2;
      px(x, y + 1, a.c[1]); px(x - 1, y, a.c[1]); px(x + 1, y, a.c[1]); px(x, y, a.c[3]); px(x, y - 1, a.c[2]);
      px(x + Math.sin(t * 8 + i), y - 2, a.c[2]); if (Math.sin(t * 10 + i) > 0) px(x, y - 3, a.c[1]);
    }
    if (L === 'f') { // fox ears
      const ex = cx, ey = cy - 9, o = '#d8682a', ins = '#fff0d0';
      for (const d of [-1, 1]) { const bx = ex + d * 3; px(bx, ey - 1, o); px(bx + d, ey - 1, o); px(bx + d, ey - 2, o); px(bx + d * 2, ey - 2, o); px(bx + d * 2, ey - 3, o); px(bx + d, ey - 1, ins); }
    } else ell(null, cx, cy + 9, 14, 3, a.c[1], 36, -t);
  },
  eclipse(a, t, cx, cy, L) {
    if (L !== 'b') { for (let i = 0; i < 6; i++) { const p = (t * 0.5 + R(i)) % 1; px(cx + (R(i, 1) - 0.5) * 36, cy + 8 - p * 34, a.c[3]); } return; }
    const ox = cx, oy = cy - 14;
    for (let i = 0; i < 48; i++) { const an = i / 48 * TAU, len = 13 + Math.floor((Math.sin(t * 3 + i * 1.7) * 0.5 + 0.5) * 4 + (i % 4 === 0 ? 3 : 0)); for (let r = 12; r < len; r++) px(ox + Math.cos(an) * r, oy + Math.sin(an) * r, r > len - 2 ? a.c[2] : a.c[3]); }
    disc(ox, oy, 11, a.c[0]); ell(null, ox, oy, 11, 11, a.c[1], 48);
  },
  comets(a, t, cx, cy, L) {
    for (let k = 0; k < 3; k++) {
      const tilt = [-0.35, 0.3, 0.05][k], sp = [1.6, -1.3, 2][k], rx = [20, 17, 23][k], ry = [6, 8, 4][k];
      for (let j = 0; j < 14; j++) {
        const an = t * sp - j * 0.07 * Math.sign(sp) + k * 2, s = Math.sin(an); if ((L === 'f') !== (s > 0)) continue;
        const x0 = Math.cos(an) * rx, y0 = s * ry, x = cx + x0, y = cy - 2 + y0 + x0 * tilt;
        px(x, y, j === 0 ? a.c[3] : j < 3 ? a.c[2] : j < 8 ? a.c[1] : a.c[0]);
        if (j === 0) { px(x + 1, y, a.c[2]); px(x, y + 1, a.c[2]); }
      }
    }
  },
  oni(a, t, cx, cy, L) {
    if (L === 'b') {
      for (let i = 0; i < 46; i++) {
        const p = (t / (0.8 + R(i) * 0.5) + R(i, 1)) % 1, x = cx + (R(i, 2) - 0.5) * 30 * (1 - p * 0.3) + Math.sin(t * 7 + i), y = cy + 9 - p * 40;
        px(x, y, a.c[p < 0.2 ? 3 : p < 0.5 ? 2 : p < 0.8 ? 1 : 0]);
      }
      for (let i = 0; i < 5; i++) { let x = cx + (i - 2) * 6, y = cy + 10; for (let j = 0; j < 5; j++) { x += (R(i, j) - 0.5) * 4; y += 1; px(x, y, Math.sin(t * 4 + i) > 0 ? a.c[3] : a.c[2]); } }
    } else {
      const hy = cy - 9; // horns
      for (const d of [-1, 1]) { px(cx + d * 2 + (d < 0 ? -1 : 0), hy, '#f0e0c0'); px(cx + d * 3 + (d < 0 ? -1 : 0), hy - 1, '#f0e0c0'); px(cx + d * 3 + (d < 0 ? -1 : 0), hy - 2, '#d0c0a0'); px(cx + d * 4 + (d < 0 ? -1 : 0), hy - 3, '#d0c0a0'); }
      if (Math.sin(t * 2) > 0.2) { px(cx - 2, cy - 5, '#ff3a2a'); px(cx + 1, cy - 5, '#ff3a2a'); }
    }
  },
  aurora(a, t, cx, cy, L) {
    if (L === 'b') {
      for (let x = -46; x <= 46; x++) {
        const top = cy - 40 + Math.sin(x * 0.12 + t * 1.2) * 4 + Math.sin(x * 0.05 - t * 0.7) * 3;
        const len = 18 + Math.sin(x * 0.2 + t * 2) * 5, fade = 1 - Math.abs(x) / 47;
        for (let j = 0; j < len; j++) {
          if (R(x * 31 + j, Math.floor(t * 6)) > fade * (1 - j / len) * 1.2) continue;
          px(cx + x, top + j, a.c[j < len * 0.3 ? 3 : j < len * 0.6 ? 1 : (x + Math.floor(t * 4)) % 9 < 4 ? 2 : 0]);
        }
      }
      ell(null, cx, cy + 9, 15, 3, a.c[1], 40, t);
    } else for (let i = 0; i < 8; i++) { const b = Math.sin(t * 4 + i * 2); if (b > 0.5) px(cx + (R(i) - 0.5) * 34, cy - 10 + (R(i, 1) - 0.5) * 30, a.c[3]); }
  },
  glitch(a, t, cx, cy, L) {
    const f = Math.floor(t * 12);
    if (L === 'b') {
      for (let i = 0; i < 9; i++) { const w = 2 + Math.floor(R(f, i) * 10), h = 1 + Math.floor(R(f, i + 20) * 3); rect(cx + (R(f, i + 40) - 0.5) * 44, cy + (R(f, i + 60) - 0.5) * 40, w, h, a.c[1 + (i % 3)]); }
      ell(null, cx, cy + 9, 14, 3, a.c[2], 36, f);
    } else {
      if (R(f, 99) > 0.6) { const sy = cy - 9 + Math.floor(R(f, 98) * 18), off = (R(f, 97) > 0.5 ? 2 : -2); for (let x = -6; x < 6; x++) px(cx + x + off, sy, a.c[R(f, x) > 0.5 ? 1 : 2]); }
      for (let i = 0; i < 6; i++) if (R(f, i + 80) > 0.5) px(cx + (R(f, i + 81) - 0.5) * 22, cy + (R(f, i + 82) - 0.5) * 24, a.c[3]);
    }
  },
  dragon(a, t, cx, cy, L) {
    const N = 46;
    for (let k = N - 1; k >= 0; k--) {
      const an = t * 1.4 - k * 0.24, s = Math.sin(an); if ((L === 'f') !== (s > 0)) continue;
      const x = cx + Math.cos(an) * (19 - k * 0.12), y = cy + 8 - k * 0.75 + s * 5;
      const c = k === 0 ? a.c[3] : k % 3 === 0 ? a.c[2] : a.c[1];
      px(x, y, c); px(x, y + 1, a.c[0]);
      if (k === 0) { rect(x - 1, y - 1, 3, 3, a.c[1]); px(x, y - 1, a.c[3]); px(x + Math.cos(an + 1.6) * 2, y - 2, a.c[3]); px(x - Math.cos(an + 1.6) * 2, y - 2, a.c[3]); }
      if (k % 9 === 4) px(x, y - 1, a.c[3]);
    }
    if (L === 'b') for (let i = 0; i < 10; i++) { const p = (t * 0.4 + R(i)) % 1; px(cx + (R(i, 1) - 0.5) * 44, cy + 10 - p * 44, a.c[3]); }
  },
  halo(a, t, cx, cy, L) {
    if (L === 'b') {
      for (let i = 0; i < 9; i++) { const x = cx + (i - 4) * 5; for (let y = 0; y < 50; y += 1) if (R(i * 100 + y, Math.floor(t * 8)) > 0.55 + y / 120) px(x + (y % 3 === 0 ? 1 : 0), cy - 50 + y, a.c[2]); }
      const flap = Math.sin(t * 3) * 2;
      for (const d of [-1, 1]) for (let f = 0; f < 6; f++) {
        const len = 12 - f * 1.4, by = cy - 4 + f * 2;
        for (let j = 0; j < len; j++) px(cx + d * (5 + j), by - j * 0.55 - flap * (j / len), f === 0 ? a.c[3] : j > len - 2 ? a.c[1] : a.c[2]);
      }
    } else ell(null, cx, cy - 13 + Math.sin(t * 2), 6, 2, Math.sin(t * 4) > 0 ? a.c[3] : a.c[1], 26);
  },
  void(a, t, cx, cy, L) {
    if (L === 'b') {
      const r = 20 + Math.sin(t * 1.5) * 2;
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y * 1.1); if (d < r && R(x * 77 + y, 3) < 1 - d / r + 0.25) px(cx + x, cy - 2 + y, d < r * 0.6 ? a.c[0] : a.c[1]); }
      ell(null, cx, cy - 2, r, r / 1.1, a.c[2], 70, t);
    }
    for (let i = 0; i < 24; i++) {
      const p = (t * 0.35 + R(i)) % 1, an = R(i, 1) * TAU + p * 5, d = 34 * (1 - p), s = Math.sin(an);
      if ((L === 'f') !== (s > 0)) continue;
      px(cx + Math.cos(an) * d, cy - 2 + s * d * 0.6, p > 0.8 ? a.c[3] : a.c[2]);
    }
  },
  lucklight(a, t, cx, cy, L) {
    if (L === 'b') {
      for (let k = 0; k < 12; k++) {
        const an = t * 0.4 + k / 12 * TAU, c = a.c[k % 5];
        for (let r = 9; r < 60; r += 1) if ((r + k) % 2 === 0 || r < 24) px(cx + Math.cos(an) * r, cy - 6 + Math.sin(an) * r, r < 30 ? c : a.c[(k + 1) % 5]);
      }
      disc(cx, cy - 6, 8, a.c[5]);
      ell(null, cx, cy + 9, 18, 4, a.c[Math.floor(t * 6) % 5], 50, t);
    } else {
      ell(null, cx, cy - 13 + Math.sin(t * 2), 6, 2, a.c[5], 26);
      for (let i = 0; i < 16; i++) {
        const an = t * 1.2 + i / 16 * TAU, x = cx + Math.cos(an) * 24, y = cy - 4 + Math.sin(an) * 10;
        if (Math.sin(t * 5 + i) > 0) { px(x, y, a.c[5]); px(x - 1, y, a.c[i % 5]); px(x + 1, y, a.c[i % 5]); px(x, y - 1, a.c[i % 5]); px(x, y + 1, a.c[i % 5]); } else px(x, y, a.c[i % 5]);
      }
    }
  },
};

// sky tint for rare auras (drawn over the scene, under the hero)
const TINT = { eclipse: 'rgba(8,6,12,0.45)', oni: 'rgba(60,8,8,0.35)', aurora: 'rgba(20,80,70,0.18)', glitch: 'rgba(0,0,0,0.25)', dragon: 'rgba(10,50,40,0.2)', halo: 'rgba(255,230,160,0.12)', void: 'rgba(10,0,20,0.55)', lucklight: 'rgba(255,220,150,0.12)' };

// full stage: scene + aura + hero. a = aura object or null
export function drawStage(ctx, a, t) {
  C = ctx; ctx.imageSmoothingEnabled = false;
  if (!sceneCache) sceneCache = buildScene();
  ctx.drawImage(sceneCache, 0, 0);
  sceneLive(t);
  if (a && TINT[a.id]) { ctx.fillStyle = TINT[a.id]; ctx.fillRect(0, 0, W, H); }
  if (a) FX[a.fx](a, t, HERO_X, HERO_Y, 'b');
  hero(HERO_X, HERO_Y + (Math.floor(t * 1.4) % 2 === 0 ? 0 : 0), t);
  if (a) FX[a.fx](a, t, HERO_X, HERO_Y, 'f');
}

// small preview (collection cards, reveal). unknown = draws a dark silhouette with no aura
export function drawThumb(ctx, a, t, unknown) {
  C = ctx; ctx.imageSmoothingEnabled = false;
  const w = ctx.canvas.width, h = ctx.canvas.height, cx = w / 2, cy = Math.round(h * 0.58);
  ctx.fillStyle = unknown ? '#2a2530' : '#1b1e38'; ctx.fillRect(0, 0, w, h);
  if (unknown) { hero(cx, cy, 0, '#14111a'); return; }
  if (TINT[a.id]) { ctx.fillStyle = TINT[a.id]; ctx.fillRect(0, 0, w, h); }
  FX[a.fx](a, t, cx, cy, 'b'); hero(cx, cy, t); FX[a.fx](a, t, cx, cy, 'f');
}
