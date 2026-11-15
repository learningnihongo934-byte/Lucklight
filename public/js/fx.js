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
function hero(cx, cy, t, sil, pal) {
  const blink = (t % 4.3) < 0.13, ox = cx - 5, oy = cy - 9;
  for (let y = 0; y < HERO.length; y++) for (let x = 0; x < 10; x++) {
    let ch = HERO[y][x]; if (ch === '.') continue;
    if (ch === 'e' && blink) ch = 's';
    px(ox + x, oy + y, sil || (pal && pal[ch]) || HP[ch]);
  }
}

// ---------- scene: one cached backdrop per biome, plus live bits (stars, lanterns, koi, lava)
const BIOME_ART = {
  shrine: { sky: ['#141833', '#1a1e3e', '#222548', '#2c2c54', '#3a345e', '#4a3f66'], h1: '#262645', h2: '#1b1b33', g: ['#4d4a58', '#57535f', '#3a3744', '#6a6676'], moon: [128, 20, 7] },
  bamboo: { sky: ['#0c1a1a', '#10221e', '#163026', '#1c3a2c', '#244432', '#2e4e38'], h1: '#14281e', h2: '#0e1e16', g: ['#3a4a34', '#44543c', '#2a3626', '#56664a'], moon: [128, 18, 6] },
  snow: { sky: ['#1a2440', '#22304e', '#2c3c5c', '#3a4c6c', '#4c5e7c', '#62728c'], h1: null, h2: null, g: ['#c8d4e4', '#d8e2ee', '#a8b8cc', '#eef4fa'], moon: [30, 16, 6] },
  sky: { sky: ['#1a1040', '#2a1a5a', '#3c2670', '#5a3a84', '#7a5096', '#a06aa0'], h1: null, h2: null, g: ['#8a8494', '#9a94a4', '#6a6474', '#b0aaba'], moon: [128, 20, 7] },
  koi: { sky: ['#0a1830', '#0e2038', '#142a44', '#1c3450', '#263e5a', '#324a64'], h1: '#1a2a40', h2: '#122236', g: ['#4d4a58', '#57535f', '#3a3744', '#6a6676'], moon: [128, 20, 7] },
  moon: { sky: ['#0c0618', '#140a24', '#1e1030', '#2a163c', '#3a1e4a', '#4a2858'], h1: '#22163a', h2: '#170e2a', g: ['#3e3448', '#4a3e54', '#2e2638', '#5a4e66'], moon: [80, 30, 24] },
  volcano: { sky: ['#1a0606', '#260a08', '#360e0a', '#4a140c', '#62200e', '#7a3010'], h1: '#2a0e0a', h2: '#1a0806', g: ['#2e2826', '#383230', '#1e1a18', '#4a3c34'], moon: [30, 16, 5] },
};
const sceneCache = {};
function buildScene(b) {
  const A = BIOME_ART[b] || BIOME_ART.shrine;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const prev = C; C = cv.getContext('2d');
  const bands = A.sky;
  for (let y = 0; y < 92; y++) {
    const f = Math.min(1, y / 78) * (bands.length - 1), i = Math.floor(f), fr = f - i;
    for (let x = 0; x < W; x++) px(x, y, bands[Math.min(bands.length - 1, i + (((x + y) % 2 === 0 ? 0.25 : 0.75) < fr ? 1 : 0))]);
  }
  const [mx, my, mr] = A.moon, mc = b === 'volcano' ? '#f0a070' : '#efe3c8';
  disc(mx, my, mr, mc); px(mx - 3, my - 2, '#d8c9a6'); rect(mx + 1, my + 1, 2, 2, '#d8c9a6');
  if (b === 'moon') { for (let i = 0; i < 9; i++) disc(mx - 14 + R(i, 40) * 28, my - 12 + R(i, 41) * 24, 1 + Math.floor(R(i, 42) * 3), '#d8c9a6'); }
  if (A.h1) for (let x = 0; x < W; x++) {
    const h1 = 64 + Math.sin(x * 0.045) * 5 + Math.sin(x * 0.13 + 1) * 2; rect(x, h1, 1, 92 - h1, A.h1);
    const h2 = 74 + Math.sin(x * 0.09 + 2) * 3 + (R(x, 3) > 0.7 ? -2 : 0) + Math.abs(Math.sin(x * 0.6)) * -3; rect(x, h2, 1, 92 - h2, A.h2);
  }
  if (b === 'snow') for (const [cx, h] of [[24, 56], [70, 40], [128, 62], [168, 44]]) for (let y = 0; y < h; y++) { const w = y * 0.95; rect(cx - w, 92 - h + y, w * 2, 1, y < h * 0.3 ? '#eef4fa' : y % 7 === 0 ? '#5a6a88' : '#6a7a98'); }
  if (b === 'volcano') { for (let x = 0; x < W; x++) { const h = Math.max(0, 62 - Math.abs(x - 40) * 1.2); rect(x, 92 - h, 1, h, '#1e0a08'); } rect(32, 30, 16, 2, '#f06a2a'); for (let y = 32; y < 70; y++) px(38 + Math.sin(y * 0.3) * 3, y, y % 3 ? '#c8401a' : '#f08a3a'); }
  if (b === 'moon') { // pagoda silhouette
    for (let k = 0; k < 5; k++) { const y = 40 + k * 10, w = 14 - k; rect(146 - w - 4, y, (w + 4) * 2, 2, '#120a1e'); rect(146 - w + 2, y + 2, (w - 2) * 2, 8, '#160c24'); }
    rect(145, 30, 2, 10, '#120a1e');
  }
  if (b === 'bamboo') for (const [x0, n] of [[2, 6], [126, 6]]) for (let k = 0; k < n; k++) {
    const x = x0 + k * 6 + (k % 2) * 2, c = k % 2 ? '#3a6a2a' : '#2a5420';
    rect(x, 0, 3, 92, c); rect(x + 2, 0, 1, 92, '#1a3414');
    for (let y = 6 + k * 3; y < 92; y += 12) { rect(x - 1, y, 5, 1, '#5a8a3a'); if (R(k, y) > 0.5) { px(x + 3, y - 1, '#6aa04a'); px(x + 4, y - 2, '#6aa04a'); px(x + 5, y - 2, '#4a8a2a'); } }
  }
  if (b === 'sky') for (let i = 0; i < 26; i++) { const x = R(i, 50) * W, y = 80 + R(i, 51) * 14; disc(x, y, 3 + Math.floor(R(i, 52) * 5), i % 3 ? '#e8d8f0' : '#c8b0e0'); }
  // torii
  const red = '#b8342a', redD = '#8a2418', blk = '#1a1420';
  rect(52, 32, 4, 60, red); rect(55, 32, 1, 60, redD); rect(104, 32, 4, 60, red); rect(107, 32, 1, 60, redD);
  rect(50, 88, 8, 4, blk); rect(102, 88, 8, 4, blk);
  rect(46, 40, 68, 3, red); rect(46, 42, 68, 1, redD);
  rect(77, 31, 6, 9, red); rect(78, 33, 4, 5, '#f0d080');
  rect(40, 27, 80, 4, red); rect(40, 30, 80, 1, redD);
  rect(38, 25, 84, 2, blk); px(37, 24, blk); px(36, 23, blk); px(122, 24, blk); px(123, 23, blk);
  if (b === 'snow') { rect(38, 24, 84, 1, '#eef4fa'); rect(46, 39, 68, 1, '#eef4fa'); }
  // ground
  const [g1, g2, g3, g4] = A.g;
  for (let y = 92; y < H; y++) for (let x = 0; x < W; x++) {
    const row = Math.floor((y - 92) / 6), tile = (Math.floor(x / 12 + (row % 2) * 0.5) + row) % 2;
    px(x, y, (y - 92) % 6 === 0 || (x + (row % 2) * 6) % 12 === 0 ? g3 : tile ? g1 : g2);
  }
  rect(0, 92, W, 1, g4);
  if (b === 'koi') { for (let y = 100; y < H; y++) for (let x = 0; x < W; x++) if (Math.abs(x - 80) > 18 || y > 104) px(x, y, (x + y) % 9 === 0 ? '#3a6a9a' : y < 103 ? '#2a5a8a' : '#1e4a7a'); for (const [sx, sy] of [[40, 108], [120, 110], [80, 114]]) { rect(sx - 5, sy, 10, 3, '#6a6676'); rect(sx - 4, sy - 1, 8, 1, '#8a8694'); } }
  if (b === 'sky') for (let i = 0; i < 18; i++) disc(R(i, 60) * W, 110 + R(i, 61) * 10, 4 + Math.floor(R(i, 62) * 4), i % 2 ? '#e8d8f0' : '#d4c0e8');
  for (let y = 0; y < 4; y++) { const w = 13 - Math.abs(y - 1) * 2; rect(HERO_X - w, 89 + y, w * 2, 1, y < 2 ? '#7a7684' : '#5e5a68'); }
  for (const lx of [18, 142]) {
    rect(lx - 5, 89, 10, 3, '#6b6876'); rect(lx - 2, 78, 4, 11, '#7c7986'); rect(lx - 5, 76, 10, 2, '#6b6876');
    rect(lx - 4, 68, 8, 8, '#7c7986'); rect(lx - 2, 70, 4, 4, '#2a2020');
    rect(lx - 7, 65, 14, 3, b === 'snow' ? '#eef4fa' : '#8a8794'); rect(lx - 5, 63, 10, 2, '#8a8794'); rect(lx - 1, 61, 2, 2, '#8a8794');
  }
  if (b !== 'snow' && b !== 'sky') for (let i = 0; i < 14; i++) { const gx = Math.floor(R(i, 9) * W), gy = 92 + Math.floor(R(i, 8) * 26); if (Math.abs(gx - 80) < 16 && gy < 96) continue; px(gx, gy, '#3f5a2a'); px(gx + 1, gy - 1, '#567a34'); px(gx + 2, gy, '#3f5a2a'); }
  C = prev; return cv;
}

function sceneLive(t, b, phase) {
  if (phase !== 'day') for (let i = 0; i < 38; i++) {
    const sx = Math.floor(R(i) * W), sy = Math.floor(R(i, 1) * 58), [mx, my, mr] = (BIOME_ART[b] || BIOME_ART.shrine).moon;
    if (Math.hypot(sx - mx, sy - my) < mr + 3) continue;
    const tw = Math.sin(t * (1 + R(i, 2) * 2) + i);
    if (tw > -0.3) px(sx, sy, tw > 0.7 ? '#fff6d8' : '#a8a4c8');
  }
  for (const lx of [18, 142]) {
    const f = Math.sin(t * 9 + lx) * 0.5 + Math.sin(t * 13) * 0.5;
    rect(lx - 2, 70, 4, 4, f > 0.3 ? '#ffd27a' : '#f6b24a'); px(lx - 1 + (f > 0 ? 1 : 0), 71, '#fff0b0');
  }
  if (b === 'koi') for (let k = 0; k < 3; k++) { const u = t * 0.4 + k * 2.1, x = 80 + Math.cos(u) * (50 + k * 8), y = 110 + Math.sin(u * 2) * 3; const d = -Math.sin(u) > 0 ? 1 : -1; rect(x - 2, y, 4, 2, k === 1 ? '#f0f0f0' : '#f06a2a'); px(x - 3 * d, y, '#f0a060'); }
  if (b === 'volcano') { if (Math.sin(t * 2) > 0) rect(33, 29, 14, 1, '#ffd060'); for (let i = 0; i < 10; i++) { const ph = (t * 0.5 + R(i, 70)) % 1; px(40 + (R(i, 71) - 0.5) * 16 * (1 + ph), 30 - ph * 28, ph < 0.5 ? '#ffd060' : '#c8401a'); } }
}

// ---------- day/night tint and weather (drawn over the stage)
const PHASE_TINT = { dusk: 'rgba(230,120,70,0.16)', dawn: 'rgba(255,170,200,0.18)', day: 'rgba(185,215,255,0.32)' };
function weather(w, t) {
  if (!w || w === 'clear') return;
  if (w === 'rain' || w === 'storm') {
    const n = w === 'storm' ? 90 : 55, drift = w === 'storm' ? 0.5 : 0.2;
    for (let i = 0; i < n; i++) { const y = (R(i, 31) * 130 + t * 170) % 130 - 10, x = (R(i, 30) * 200 + y * drift) % 180 - 10; px(x, y, '#8aa8d8'); px(x - drift, y - 1, '#6a88b8'); }
    for (let i = 0; i < 8; i++) { const ph = (t * 3 + R(i, 33)) % 1; if (ph < 0.3) { const x = R(i, 34) * W, y = 93 + R(i, 35) * 24; px(x - 1, y, '#a8c8f0'); px(x + 1, y, '#a8c8f0'); } }
    if (w === 'storm') {
      C.fillStyle = 'rgba(10,10,30,0.25)'; C.fillRect(0, 0, W, H);
      const ph = (t / 5.3) % 1, seed = Math.floor(t / 5.3);
      if (ph < 0.05) { C.fillStyle = 'rgba(230,235,255,0.4)'; C.fillRect(0, 0, W, H); let x = 20 + R(seed, 36) * 120, y = 0; while (y < 70) { const nx = x + (R(seed * 7 + y, 37) - 0.5) * 10; line(x, y, nx, y + 5, '#ffffff'); x = nx; y += 5; } }
    }
  } else if (w === 'snow') {
    for (let i = 0; i < 60; i++) { const y = (R(i, 40) * 130 + t * 14 * (0.6 + R(i, 41) * 0.6)) % 130 - 6, x = (R(i, 42) * W + Math.sin(t + i) * 4 + W) % W; px(x, y, '#ffffff'); }
  } else if (w === 'fog') {
    C.globalAlpha = 0.16;
    for (let k = 0; k < 6; k++) { const y = 54 + k * 9 + Math.sin(t * 0.3 + k) * 2, off = (t * (4 + k) + k * 30) % 60; for (let x = -60; x < W; x += 60) rect(x + off, y, 46, 5, '#d0d8e8'); }
    C.globalAlpha = 1;
  } else if (w === 'sakura') {
    for (let i = 0; i < 26; i++) { const x = (R(i, 44) * 200 + t * 26 * (0.7 + R(i, 45) * 0.6)) % 200 - 20, y = (R(i, 46) * 110 + Math.sin(t * 1.5 + i) * 6 + t * 4) % 110; px(x, y, '#f8c8d8'); if (Math.sin(t * 5 + i) > 0) px(x + 1, y, '#e58fb0'); }
  }
}

// ---------- pets (follow the hero) and shrine visitors
const PET_ART = {
  fox: [['.o.o....', '.ooo...o', 'okow..oo', '.oooooow', '..ooooo.', '..o..o..'], { o: '#d8682a', w: '#fff0d0', k: '#1a1420' }],
  cat: [['.g.g....', '.ggg...g', 'gkgk...g', '.ggggggg', '..ggggg.', '..g..g..'], { g: '#5a5a68', k: '#f0d060' }],
  tanuki: [['.b.b....', '.bbb..kb', 'kwkw..bk', '.bbbbbbb', '..bwwbb.', '..b..b..'], { b: '#7a5a3a', k: '#2a1a10', w: '#f0e0c0' }],
  crane: [['.r......', '.wwy....', '.w......', '.w..www.', '.wwwwwkk', '..w..w..'], { w: '#f4f0e8', r: '#d8302a', y: '#e0b040', k: '#1a1420' }],
  dragonling: [['y...y...', 'gg.ggg..', 'gwgggggy', '.gggg.g.', '..g.gg..', '.g...g..'], { g: '#2fa070', y: '#f2d24a', w: '#ffffff' }],
};
function pet(id, t) {
  const art = PET_ART[id]; if (!art) return;
  const [rows, pal] = art, fly = id === 'dragonling' || id === 'crane';
  const x = HERO_X - 20 + Math.round(Math.sin(t * 0.7) * 2), y = HERO_Y + (fly ? -10 + Math.round(Math.sin(t * 2.5) * 2) : 3 - (Math.sin(t * 5) > 0.6 ? 1 : 0));
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') px(x + i, y + j, pal[r[i]]); });
}
const VISITOR_ART = {
  monk: { h: '#f0c8a0', r: '#c87a2a', b: '#8a4a1a' }, farmer: { r: '#6a8a3a', b: '#4a5a2a' }, child: { r: '#e07a9a', b: '#5a6ab8' },
  merchant: { r: '#3a5a9a', b: '#2a2a3a' }, ronin: { r: '#5a5a6a', b: '#2a2a34' }, fox: { h: '#efe6d2', r: '#efe6d2', b: '#d8682a', s: '#fff6e0' },
};
function visitor(v, t) {
  if (!v) return;
  const x = Math.round(v.x), y = HERO_Y, walking = v.walking;
  hero(x, y - (walking && Math.sin(t * 10) > 0 ? 1 : 0), t + 1.7, null, VISITOR_ART[v.kind]);
  if (v.kind === 'farmer') { rect(x - 7, y - 10, 14, 1, '#d8b060'); rect(x - 4, y - 12, 8, 2, '#e8c070'); }
  if (v.kind === 'merchant') { rect(x - 4, y - 11, 8, 2, '#2a2a3a'); }
  if (v.kind === 'ronin') { rect(x - 1, y - 11, 2, 2, '#1a1420'); line(x + 5, y - 2, x + 9, y - 8, '#c8c8d0'); }
  if (v.kind === 'fox') for (const d of [-1, 1]) { px(x + d * 3, y - 10, '#d8682a'); px(x + d * 4, y - 11, '#d8682a'); }
  if (v.waiting && !walking) { const by = y - 18 + Math.round(Math.sin(t * 4)); rect(x - 3, by - 6, 7, 8, '#fff6e0'); rect(x - 2, by - 7, 5, 1, '#fff6e0'); rect(x, by - 5, 1, 4, '#c4402b'); px(x, by, '#c4402b'); px(x - 1, by + 2, '#fff6e0'); }
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
  foxfire(a, t, cx, cy, L, p = {}) {
    for (let i = 0; i < 9; i++) {
      const an = t * 0.9 + i / 9 * TAU, s = Math.sin(an); if ((L === 'f') !== (s > 0)) continue;
      const x = cx + Math.cos(an) * 18, y = cy - 1 + s * 5 + Math.sin(t * 3 + i) * 2;
      px(x, y + 1, a.c[1]); px(x - 1, y, a.c[1]); px(x + 1, y, a.c[1]); px(x, y, a.c[3]); px(x, y - 1, a.c[2]);
      px(x + Math.sin(t * 8 + i), y - 2, a.c[2]); if (Math.sin(t * 10 + i) > 0) px(x, y - 3, a.c[1]);
    }
    if (L === 'f') { if (p.noEars) return; // fox ears
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
  // Lucklight reborn: the whole shrine turns to light
  lucklight(a, t, cx, cy, L) {
    const GOLD = { c: ['#a8741a', '#ffd060', '#fff0b0', '#fffaf0'] }, KOI = { c: ['#ffc04a', '#ffe8a0', '#fffaf0', '#ffffff'] }, SLIP = { c: ['#8a2a1c', '#c4402b', '#c4402b', '#fff6e0'] };
    FX.orbit(KOI, t, cx, cy, L, { g: 'fish', n: 6, r: 27, ry: 8, sp: 0.7, y: -2, bob: 1 });
    if (L === 'b') {
      for (let k = 0; k < 24; k++) {
        const an = t * 0.22 + k / 24 * TAU, c = a.c[k % 5];
        for (let r = 12; r < 110; r++) if (r < 34 || (r + k) % 3 === 0) px(cx + Math.cos(an) * r, cy - 8 + Math.sin(an) * r, r < 34 ? c : k % 2 ? c : '#fff6d0');
      }
      for (let m = 0; m < 3; m++) { const r = 14 + m * 7, d = m % 2 ? -1 : 1; for (let i = 0; i < 64; i++) { const an = t * 0.5 * d + i / 64 * TAU; px(cx + Math.cos(an) * r, cy - 8 + Math.sin(an) * r, i % 8 === 0 ? '#ffffff' : '#ffd060'); } }
      ell(null, cx, cy - 8, 34, 34, '#fff0b0', 110, t);
      for (let i = 0; i < 6; i++) { const an = -t * 0.5 + i / 6 * TAU; glyph('star', cx + Math.cos(an) * 34, cy - 8 + Math.sin(an) * 34, GOLD, i); }
      FX.wings(GOLD, t, cx, cy, 'b', { n: 2, len: 18, sp: 1.6 });
      for (let i = 0; i < 10; i++) { const x = R(i, 80) * W, y = 120 - ((t * 7 * (0.7 + R(i, 81) * 0.6) + R(i, 82) * 140) % 140); rect(x - 1, y - 2, 3, 4, '#d9532c'); px(x, y - 1, '#ffe8a0'); px(x, y, '#ffd060'); if (Math.sin(t * 6 + i) > 0) px(x, y + 2, '#ffd060'); }
      for (let i = 0; i < 14; i++) { const ph = (t / (5 + R(i, 83) * 3) + R(i, 84)) % 1, x = (R(i, 85) * 180 + Math.sin(t * 1.3 + i) * 8) % 170 - 5; glyph('slip', x, ph * 120 - 6, SLIP, i, Math.sin(t * 3 + i) > 0); }
      for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; ell(null, cx, cy + 9, 6 + ph * 34, (6 + ph * 34) * 0.22, ph < 0.4 ? '#ffffff' : '#ffd060', 60); }
    } else {
      FX.crown(GOLD, t, cx, cy, 'f');
      ell(null, cx, cy - 15 + Math.sin(t * 2), 7, 2, '#ffffff', 28);
      for (let i = 0; i < 18; i++) if (Math.sin(t * 4 + i * 1.9) > 0.55) glyph('star', cx + (R(i, 86) - 0.5) * 70, cy - 14 + (R(i, 87) - 0.5) * 50, GOLD, i);
    }
  },
};

// sky tint for rare auras (drawn over the scene, under the hero)
const TINT = { eclipse: 'rgba(8,6,12,0.45)', oni: 'rgba(60,8,8,0.35)', aurora: 'rgba(20,80,70,0.18)', glitch: 'rgba(0,0,0,0.25)', dragon: 'rgba(10,50,40,0.2)', halo: 'rgba(255,230,160,0.12)', void: 'rgba(10,0,20,0.55)', lucklight: 'rgba(255,220,150,0.12)' };

// ---------- glyphs: tiny sprites, digits = palette index
const GLYPH = {
  clover: ['.1.1.', '11211', '.121.', '11211', '.1.1.'],
  leaf: ['.2.', '121', '.1.', '.0.'],
  bubble: ['.111.', '12..1', '1...1', '1...1', '.111.'],
  note: ['..2', '..2', '..2', '222', '22.'],
  rune: [['212', '.2.', '2.2'], ['2.2', '222', '2.2'], ['222', '2.2', '.2.'], ['2..', '222', '..2']],
  heart: ['.1.1.', '12111', '.111.', '..1..'],
  coin: ['.2.', '232', '.2.'],
  star: ['..3..', '..2..', '32323', '..2..', '..3..'],
  shard: ['.3.', '323', '121', '121', '.1.'],
  sword: ['.3.', '.2.', '.2.', '.2.', '.2.', '101', '.0.'],
  link: ['111', '1.1', '111'],
  fish: ['.111.1', '122211', '.111.1'],
  thorn: ['1.1', '.2.', '1.1'],
  daruma: ['.11.', '1221', '1111', '1111', '.11.'],
  lotus: ['..2..', '.121.', '11111'],
  petal: ['12', '.1'],
  drop: ['.2.', '121', '.1.'],
  flake: ['2.2', '.3.', '2.2'],
  feather: ['..1', '.21', '21.', '1..'],
  gear: ['.1.1.', '11211', '12.21', '11211', '.1.1.'],
  crane: ['1...1', '21.12', '.222.', '..2..'],
  candle: ['.3.', '.2.', '.1.', '.1.', '010'],
  bell: ['.1.', '121', '121', '111', '.3.'],
  moth: ['1.1', '121', '1.1'],
  ghost: ['.111.', '12121', '11111', '1.1.1'],
  drum: ['.111.', '12321', '.111.'],
  acorn: ['.00.', '0110', '1221', '1221', '.11.'],
  corn: ['.0.', '121', '232', '121', '232', '.1.'],
  pumpkin: ['..0..', '.121.', '12321', '12121', '.111.'],
  pie: ['.333.', '32223', '11111'],
  wishbone: ['2...2', '.2.2.', '..2..', '..2..'],
  maple: ['..2..', '2.2.2', '.222.', '22222', '..1..'],
  slip: ['333', '323', '333', '313'],
  turkey: ['2.3.3.2', '.32223.', '3211123', '.21012.', '..111..', '..1.1..'],
};
function glyph(name, x, y, a, i = 0, flip = false) {
  let g = GLYPH[name]; if (Array.isArray(g[0])) g = g[i % g.length];
  const w = g[0].length, h = g.length, ox = Math.round(x - w / 2), oy = Math.round(y - h / 2), last = a.c.length - 1;
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) { const ch = g[r][flip ? w - 1 - c : c]; if (ch !== '.') px(ox + c, oy + r, a.c[Math.min(+ch, last)]); }
}
const top = a => a.c[a.c.length - 1];

// ---------- generic layered effects (params from data.js)
Object.assign(FX, {
  orbit(a, t, cx, cy, L, p) {
    const n = p.n || 5, r = p.r || 17, ry = p.ry ?? 5, sp = p.sp || 0.8, oy = p.y ?? -1;
    for (let i = 0; i < n; i++) {
      const an = t * sp + i / n * TAU, s = Math.sin(an); if ((L === 'f') !== (s > 0)) continue;
      const x = cx + Math.cos(an) * r, y = cy + oy + s * ry + Math.sin(t * 2 + i) * (p.bob ?? 1.5);
      if (p.g) glyph(p.g, x, y, a, i, Math.cos(an) * Math.sign(sp) > 0);
      else { px(x, y, top(a)); px(x + 1, y, a.c[1]); px(x, y + 1, a.c[1]); px(x + 1, y + 1, a.c[0]); }
    }
  },
  rise(a, t, cx, cy, L, p) {
    const n = p.n || 10, h = p.h || 32, w = p.w || 28;
    for (let i = 0; i < n; i++) {
      if ((L === 'f') !== (R(i, 7) > 0.5)) continue;
      const ph = (t / (p.per || 3) * (0.7 + R(i) * 0.6) + R(i, 1)) % 1;
      const x = cx + (R(i, 2) - 0.5) * w + Math.sin(t * 1.5 + i) * (p.sway ?? 2), y = cy + 9 - ph * h;
      if (p.g) glyph(p.g, x, y, a, i); else px(x, y, a.c[ph < 0.3 ? a.c.length - 1 : 1 + (i % 2)]);
    }
  },
  fall(a, t, cx, cy, L, p) {
    const n = p.n || 10, h = p.h || 38, w = p.w || 34;
    for (let i = 0; i < n; i++) {
      if ((L === 'f') !== (R(i, 7) > 0.4)) continue;
      const ph = (t / (p.per || 3) * (0.7 + R(i) * 0.6) + R(i, 1)) % 1;
      const x = cx + (R(i, 2) - 0.5) * w + Math.sin(t * 1.2 + i) * (p.sway ?? 2), y = cy - 28 + ph * h;
      if (p.g) glyph(p.g, x, y, a, i); else px(x, y, pick(a, i));
    }
  },
  breeze(a, t, cx, cy, L, p) {
    const n = p.n || 8;
    for (let i = 0; i < n; i++) {
      if ((L === 'f') !== (R(i, 4) > 0.5)) continue;
      const y0 = cy - 14 + R(i) * 26, sp = (p.sp || 40) * (0.7 + R(i, 1) * 0.6), x0 = ((t * sp + R(i, 2) * 120) % 120) - 60, len = p.len || 6 + Math.floor(R(i, 3) * 6);
      for (let j = 0; j < len; j++) { const x = cx + x0 - j; if (Math.abs(x - cx) > 52) continue; px(x, y0 + Math.sin((x0 - j) * 0.15 + i) * 1.5, a.c[j < 2 ? a.c.length - 1 : j < len / 2 ? 1 : 0]); }
    }
  },
  ripple(a, t, cx, cy, L, p) {
    const n = p.n || 3, per = p.per || 1.6;
    for (let k = 0; k < n; k++) {
      const ph = (t / per + k / n) % 1, rx = 4 + ph * (p.r || 22), ry = rx * (p.flat ?? 0.25);
      ell(L, cx, cy + (p.y ?? 9), rx, ry, a.c[ph < 0.3 ? a.c.length - 1 : ph < 0.7 ? 1 : 0], Math.max(12, Math.round(rx * 2.6)));
    }
    if (p.drop && L === 'f') { const ph = (t / per) % 1; if (ph > 0.7) px(cx + 3, cy - 20 + (ph - 0.7) * 95, a.c[2]); }
  },
  smoke(a, t, cx, cy, L, p) {
    const n = p.n || 8, f = Math.floor(t * 4);
    for (let i = 0; i < n; i++) {
      if ((L === 'f') !== (R(i, 6) > 0.6)) continue;
      const ph = (t / (p.per || 3.5) + R(i)) % 1, x = cx + (R(i, 1) - 0.5) * (p.w || 30) + Math.sin(t + i) * 3, y = cy + (p.y ?? 8) - ph * (p.h || 30), r = 1 + Math.floor(ph * (p.size || 4));
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
        if (xx * xx + yy * yy > r * r || R(i * 31 + xx * 7 + yy, f) < ph * 0.8) continue;
        px(x + xx, y + yy, a.c[xx + yy > 0 ? 0 : ph < 0.3 ? 2 : 1]);
      }
    }
  },
  beam(a, t, cx, cy, L, p) {
    const w = p.w || 10, last = a.c.length - 1;
    if (L !== 'b') { for (let i = 0; i < 8; i++) { const ph = (t * 0.6 + R(i)) % 1; px(cx + (R(i, 1) - 0.5) * w * 1.6, cy + 8 - ph * 60, a.c[last]); } return; }
    const f = Math.floor(t * 12);
    for (let y = 0; y < cy + 9; y++) {
      const ww = w + Math.sin(y * 0.25 - t * 6);
      for (let x = -Math.ceil(ww); x <= ww; x++) {
        const e = Math.abs(x) / ww; if (e > 0.35 && R(x * 13 + y * 7, f) < e) continue;
        px(cx + x, y, e < 0.2 ? a.c[last] : e < 0.5 ? a.c[last - 1] : a.c[1]);
      }
    }
    ell(null, cx, cy + 9, w + 6, 3, a.c[last], 40, t);
  },
  rays(a, t, cx, cy, L, p) {
    if (L !== 'b') return;
    const n = p.n || 8;
    for (let k = 0; k < n; k++) {
      const an = t * (p.sp || 0.4) + k / n * TAU, c = a.c[k % a.c.length];
      for (let r = 10; r < (p.len || 56); r++) if (r < 22 || (r + k) % 2 === 0) px(cx + Math.cos(an) * r, cy - 6 + Math.sin(an) * r, c);
    }
  },
  rings(a, t, cx, cy, L, p) {
    const n = p.n || 2;
    for (let k = 0; k < n; k++) {
      const r = (p.r || 16) + k * 5, tilt = (k % 2 ? -1 : 1) * (p.tilt ?? 0.35), sp = (k % 2 ? -1 : 1) * (p.sp || 1);
      for (let i = 0; i < 48; i++) {
        const an = i / 48 * TAU, s = Math.sin(an); if ((L === 'f') !== (s > 0)) continue;
        const x0 = Math.cos(an) * r, tick = (i + Math.floor(t * sp * 8) % 48 + 48) % 6 === 0;
        px(cx + x0, cy - 2 + s * r * 0.3 + x0 * tilt, tick ? top(a) : a.c[1 + (k % 2)]);
      }
    }
  },
  wings(a, t, cx, cy, L, p) {
    if (L !== 'b') return;
    const flap = Math.sin(t * (p.sp || 3)) * 2, n = p.n || 1, last = a.c.length - 1;
    for (let w = 0; w < n; w++) for (const d of [-1, 1]) for (let f = 0; f < 6; f++) {
      const len = (p.len || 12) - f * 1.4 - w * 2, by = cy - 4 + f * 2 - w * 5;
      for (let j = 0; j < len; j++) px(cx + d * (5 + j), by - j * (0.55 - w * 0.45) - flap * (j / len), f === 0 ? a.c[last] : j > len - 2 ? a.c[0] : a.c[1 + (f % 2)]);
    }
  },
  helix(a, t, cx, cy, L, p) {
    const N = p.n || 40, r = p.r || 14, st = p.strands || 2;
    for (let s = 0; s < st; s++) for (let k = 0; k < N; k++) {
      const an = t * (p.sp || 2) + k * 0.35 + s * TAU / st, sn = Math.sin(an); if ((L === 'f') !== (sn > 0)) continue;
      px(cx + Math.cos(an) * r * (1 - k / N * 0.3), cy + 9 - k * (p.h || 44) / N, k % 5 === 0 ? top(a) : a.c[1 + (s % 2)]);
    }
  },
  galaxy(a, t, cx, cy, L, p) {
    if (L !== 'b') { for (let i = 0; i < 6; i++) if (Math.sin(t * 3 + i * 2) > 0.5) px(cx + (R(i) - 0.5) * 40, cy - 6 + (R(i, 1) - 0.5) * 24, top(a)); return; }
    const arms = p.arms || 2, R0 = p.r || 30;
    for (let arm = 0; arm < arms; arm++) for (let i = 0; i < 70; i++) {
      const d = i / 70 * R0, an = -t * (p.sp || 0.5) + arm / arms * TAU + d * 0.18 + (R(i, arm) - 0.5) * 0.5;
      px(cx + Math.cos(an) * d, cy - 4 + Math.sin(an) * d * (p.flat || 0.45), d < 6 ? top(a) : a.c[i % 3 ? 1 : 2]);
    }
    if (p.core) { disc(cx, cy - 4, p.core, a.c[0]); ell(null, cx, cy - 4, p.core + 1, p.core + 1, a.c[2], 40, t); }
  },
  matrix(a, t, cx, cy, L) {
    if (L !== 'b') return;
    const f = Math.floor(t * 8);
    for (let i = 0; i < 13; i++) {
      const x = cx - 39 + i * 6 + Math.floor(R(i) * 3), sp = 20 + R(i, 1) * 25, head = ((t * sp + R(i, 2) * 80) % 80) - 10;
      for (let j = 0; j < 10; j++) {
        const y = head - j * 2; if (y < 0 || y > cy + 9) continue;
        px(x, y, j === 0 ? top(a) : j < 3 ? a.c[2] : a.c[1]); if (R(i * 50 + j, f) > 0.5) px(x + 1, y, a.c[1]);
      }
    }
  },
  eyes(a, t, cx, cy, L, p) {
    if (L !== 'b') return;
    for (let i = 0; i < (p.n || 6); i++) {
      const x = Math.round(cx + (R(i, 11) - 0.5) * (p.w || 60)), y = Math.round(cy - 26 + R(i, 12) * 32);
      if (Math.abs(x - cx) < 9 && y > cy - 14) continue;
      if (Math.sin(t * (0.8 + R(i, 13)) + i * 3) < -0.7) { rect(x - 2, y, 5, 1, a.c[1]); continue; }
      rect(x - 2, y - 1, 5, 3, a.c[1]); rect(x - 1, y - 1, 3, 3, a.c[2]);
      px(x + Math.round(Math.max(-1, Math.min(1, (cx - x) / 20))), y, a.c[0]);
    }
  },
  crown(a, t, cx, cy, L) {
    if (L !== 'f') return;
    const y = cy - 12 + Math.round(Math.sin(t * 2) * 0.6), c = a.c;
    rect(cx - 4, y, 8, 2, c[1]);
    for (const x of [-4, -1, 0, 3]) { px(cx + x, y - 1, c[1]); px(cx + x, y - 2, c[2]); }
    px(cx - 1, y - 3, top(a)); px(cx, y - 3, top(a)); px(cx - 2, y, c[3] || top(a)); px(cx + 1, y, c[3] || top(a));
    for (let i = 0; i < 5; i++) if (Math.sin(t * 4 + i * 2) > 0.6) glyph('star', cx + (R(i) - 0.5) * 30, cy - 14 + R(i, 1) * 20, a, i);
  },
  infinity(a, t, cx, cy, L, p) {
    const r = p.r || 24, head = (t * 0.5 % 1) * 90;
    for (let i = 0; i < 90; i++) {
      const s = i / 90 * TAU, den = 1 + Math.sin(s) ** 2, x = r * Math.cos(s) / den, z = r * Math.sin(s) * Math.cos(s) / den;
      if ((L === 'f') !== (z > 0)) continue;
      const dd = (i - head + 90) % 90;
      px(cx + x, cy - 2 + z * 0.35, dd < 4 ? top(a) : dd < 20 ? a.c[2] : a.c[1]);
    }
  },
  clock(a, t, cx, cy, L) {
    if (L !== 'b') return;
    const ox = cx, oy = cy - 14;
    disc(ox, oy, 12, a.c[0]); ell(null, ox, oy, 12, 12, a.c[2], 60);
    for (let h = 0; h < 12; h++) { const an = h / 12 * TAU; px(ox + Math.cos(an) * 10, oy + Math.sin(an) * 10, top(a)); }
    for (const [sp, len] of [[2.5, 9], [0.4, 6]]) { const an = t * sp - Math.PI / 2; line(ox, oy, ox + Math.cos(an) * len, oy + Math.sin(an) * len, a.c[2]); }
  },
});

// layers of an aura: [{ f, ...params }], each with its own palette view
const specCache = new Map();
function layers(a) {
  let s = specCache.get(a.id);
  if (!s) {
    s = (Array.isArray(a.fx) ? a.fx : [a.fx]).map(x => typeof x === 'string' ? { f: x } : x).map(p => ({ p, a: p.c ? { ...a, c: p.c } : a }));
    specCache.set(a.id, s);
  }
  return s;
}
const runFx = (a, t, cx, cy, L) => { for (const l of layers(a)) FX[l.p.f](l.a, t, cx, cy, L, l.p); };
const tintOf = a => a.tint || TINT[a.id];

// Harvest Festival dressing: falling maple leaves and pumpkins by the lanterns
const AUTUMN = { c: ['#5a1a0a', '#c84a1a', '#f09a2a', '#ffe68a'] }, PUMPKIN = { c: ['#3a5a1a', '#c86a1a', '#f0a040', '#ffe0a0'] };
function harvest(t) {
  for (const [x, y] of [[26, 89], [10, 90], [134, 89], [150, 90]]) glyph('pumpkin', x, y, PUMPKIN);
  for (let i = 0; i < 12; i++) {
    const ph = (t / (6 + R(i, 20) * 4) + R(i, 21)) % 1;
    glyph('maple', ((R(i, 22) * 200 + ph * 50 + Math.sin(t + i) * 6) % 180) - 10, ph * 104 - 6, AUTUMN, i);
  }
}

// Lucklight makes the torii glow
function toriiGlow(t) {
  const c = Math.sin(t * 3) > 0 ? '#ffe68a' : '#fff6d0';
  for (const [x, y, w, h] of [[38, 24, 84, 8], [46, 39, 68, 5], [51, 31, 6, 62], [103, 31, 6, 62]]) { rect(x - 1, y - 1, w + 2, 1, c); rect(x - 1, y + h, w + 2, 1, c); rect(x - 1, y, 1, h, c); rect(x + w, y, 1, h, c); }
  rect(78, 33, 4, 5, '#ffffff');
}

// full stage. o = { ev, biome, phase, weather, pet, visitor }
export function drawStage(ctx, a, t, o = {}) {
  C = ctx; ctx.imageSmoothingEnabled = false;
  const b = BIOME_ART[o.biome] ? o.biome : 'shrine';
  ctx.drawImage(sceneCache[b] ||= buildScene(b), 0, 0);
  sceneLive(t, b, o.phase);
  if (PHASE_TINT[o.phase]) { ctx.fillStyle = PHASE_TINT[o.phase]; ctx.fillRect(0, 0, W, H); }
  if (a?.id === 'lucklight') toriiGlow(t);
  if (o.ev) harvest(t);
  if (a && tintOf(a)) { ctx.fillStyle = tintOf(a); ctx.fillRect(0, 0, W, H); }
  if (a) runFx(a, t, HERO_X, HERO_Y, 'b');
  if (o.pet) pet(o.pet, t);
  visitor(o.visitor, t);
  hero(HERO_X, HERO_Y, t);
  if (a) runFx(a, t, HERO_X, HERO_Y, 'f');
  weather(o.weather, t);
}

// hero + aura at any spot of any canvas (legend films)
export function drawAuraAt(ctx, a, t, cx, cy) {
  C = ctx; ctx.imageSmoothingEnabled = false;
  runFx(a, t, cx, cy, 'b'); hero(cx, cy, t); runFx(a, t, cx, cy, 'f');
}

// small preview (collection cards, reveal). unknown = draws a dark silhouette with no aura
export function drawThumb(ctx, a, t, unknown) {
  C = ctx; ctx.imageSmoothingEnabled = false;
  const w = ctx.canvas.width, h = ctx.canvas.height, cx = w / 2, cy = Math.round(h * 0.58);
  ctx.fillStyle = unknown ? '#2a2530' : '#1b1e38'; ctx.fillRect(0, 0, w, h);
  if (unknown) { hero(cx, cy, 0, '#14111a'); return; }
  if (tintOf(a)) { ctx.fillStyle = tintOf(a); ctx.fillRect(0, 0, w, h); }
  runFx(a, t, cx, cy, 'b'); hero(cx, cy, t); runFx(a, t, cx, cy, 'f');
}
