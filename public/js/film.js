// Lucklight legend films: ~19 s pixel films for every aura at 1 in a billion or rarer.
// Shots: 1 the shrine goes silent · 2 the legend's world (style scene) + backstory · 3 the light gathers · 4 reveal.
import { drawAuraAt } from './fx.js';

const W = 192, H = 108, TAU = Math.PI * 2;
const R = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453; return x - Math.floor(x); };
let C = null;
const px = (x, y, c) => { C.fillStyle = c; C.fillRect(Math.round(x), Math.round(y), 1, 1); };
const rect = (x, y, w, h, c) => { C.fillStyle = c; C.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const disc = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y))); rect(cx - w, cy + y, w * 2 + 1, 1, c); } };
const ring = (cx, cy, r, c, n = 60, sy = 1) => { for (let i = 0; i < n; i++) { const a = i / n * TAU; px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy, c); } };
const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) px(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); };
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
function sky(top, bot, y0 = 0, y1 = H) { for (let y = y0; y < y1; y++) rect(0, y, W, 1, mix(top, bot, (y - y0) / Math.max(1, y1 - y0 - 1))); }
const stars = (t, n = 60, maxY = H, c = '#fff6d8') => { for (let i = 0; i < n; i++) if (Math.sin(t * (1 + R(i, 2) * 3) + i) > -0.2) px(R(i) * W, R(i, 1) * maxY, c); };
const fade = (a, c = '#000') => { if (a <= 0) return; C.globalAlpha = Math.min(1, a); rect(0, 0, W, H, c); C.globalAlpha = 1; };

// ---------- style scenes (shot 2). lt = 0 … 8.4 s, p = aura palette (dark → light)
const SCENES = {
  cosmic(lt, p) {
    sky('#000000', p[0]);
    for (let i = 0; i < 140; i++) {
      const an = R(i) * TAU, d = ((lt * 0.25 + R(i, 1)) % 1) ** 2 * 130, x = 96 + Math.cos(an) * d, y = 54 + Math.sin(an) * d;
      line(x, y, x + Math.cos(an) * d * 0.06, y + Math.sin(an) * d * 0.06, d > 60 ? '#ffffff' : p[2]);
    }
    const g = Math.min(1, lt / 4);
    for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 120 * g; i++) {
      const d = i / 120 * 46, an = lt * 0.6 + arm / 3 * TAU + d * 0.12;
      px(96 + Math.cos(an) * d, 54 + Math.sin(an) * d * 0.45, d < 8 ? '#ffffff' : p[i % 3 ? 1 : 2]);
    }
    disc(28, 84, 10, p[1]); disc(25, 81, 4, p[2]); ring(28, 84, 17, p[3], 70, 0.3);
  },
  abyss(lt, p) {
    sky('#000000', p[0]);
    for (let k = 0; k < 6; k++) for (let y = H; y > H - 30 - lt * 9; y--) px(16 + k * 32 + Math.sin(y * 0.12 + lt * 2 + k) * 6, y, p[1]);
    for (let i = 0; i < Math.min(24, lt * 3.5); i++) {
      const x = 10 + R(i, 4) * 172, y = 8 + R(i, 5) * 70, bl = Math.sin(lt * 2 + i) < -0.85;
      if (bl) { rect(x - 3, y, 7, 1, p[1]); continue; }
      rect(x - 3, y - 1, 7, 3, p[1]); rect(x - 1, y - 1, 3, 3, p[2]); px(x + Math.round(Math.sin(lt + i)), y, p[3]);
    }
    fade(0.25 + Math.sin(lt * 3) * 0.1, p[0]);
  },
  storm(lt, p) {
    sky('#05060c', p[0], 0, 70);
    for (let y = 0; y < 26; y++) for (let x = 0; x < W; x += 2) if (R(x * 7 + y, 3) < 0.5 - y / 60) px((x + lt * 12) % W, y, '#2a2a3a');
    sky(p[0], '#020308', 70, H);
    for (let k = 0; k < 4; k++) for (let x = 0; x < W; x++) px(x, 74 + k * 8 + Math.sin(x * 0.08 + lt * (2 + k) + k) * 2, k % 2 ? p[1] : p[2]);
    for (let i = 0; i < 90; i++) { const x = (R(i) * 260 + lt * 160) % 260 - 40, y = (R(i, 1) * 120 + lt * 220) % 120; line(x, y, x - 3, y + 6, '#6a7a9a'); }
    const ph = (lt / 1.3) % 1, seed = Math.floor(lt / 1.3);
    if (ph < 0.18) {
      fade(0.35 * (1 - ph / 0.18), p[3]);
      let x = 30 + R(seed) * 130, y = 0;
      while (y < 74) { const nx = x + (R(seed * 9 + y) - 0.5) * 14, ny = y + 6; line(x, y, nx, ny, '#ffffff'); line(x + 1, y, nx + 1, ny, p[3]); x = nx; y = ny; }
    }
  },
  divine(lt, p) {
    sky(p[1], p[3]);
    for (let k = 0; k < 7; k++) { const x = ((k * 31 + lt * 9) % 230) - 20, w = 4 + (k % 3) * 3; for (let y = 0; y < H; y++) if (R(y * 3 + k, Math.floor(lt * 8)) > 0.35) rect(x, y, w, 1, '#ffffff'); }
    const g = Math.min(1, lt / 3), gc = '#fff8e0';
    rect(60, 30, 72 * g, 4, gc); rect(66, 40, 60 * g, 2, gc); rect(68, 30, 3, 50 * g, gc); rect(121, 30, 3, 50 * g, gc);
    for (let x = 0; x < W; x += 1) { const h = 8 + Math.sin(x * 0.15 + lt) * 3 + Math.sin(x * 0.05) * 3; rect(x, H - h, 1, h, x % 7 < 4 ? '#ffffff' : p[3]); }
    for (let i = 0; i < 14; i++) { const ph = (lt * 0.15 + R(i)) % 1; const x = R(i, 2) * W + Math.sin(lt * 2 + i) * 6, y = ph * H; px(x, y, '#ffffff'); px(x + 1, y + 1, p[2]); }
  },
  fire(lt, p) {
    sky('#140004', p[0], 0, H);
    for (let x = 0; x < W; x++) { const h = Math.max(0, 70 - Math.abs(x - 96) * 1.1); rect(x, H - h, 1, h, '#1a0806'); }
    rect(84, 38, 24, 3, p[2]); rect(88, 36, 16, 2, p[3]);
    for (let i = 0; i < 120; i++) { const ph = (lt * 0.4 + R(i)) % 1, x = 96 + (R(i, 1) - 0.5) * 30 * (1 + ph * 3), y = 38 - ph * 60 + Math.sin(lt * 4 + i) * 2; px(x, y, ph < 0.3 ? p[3] : ph < 0.6 ? p[2] : p[1]); }
    const s = Math.min(1, Math.max(0, (lt - 2) / 4));
    for (const d of [-1, 1]) for (let f = 0; f < 9; f++) { const len = (50 - f * 4) * s; for (let j = 0; j < len; j++) px(96 + d * (6 + j), 30 + f * 2.2 - j * 0.45 + Math.sin(lt * 3) * 2 * (j / 50), f === 0 ? p[3] : f % 2 ? p[2] : p[1]); }
  },
  ocean(lt, p) {
    sky('#020814', p[0], 0, 60); stars(lt, 30, 50);
    const arc = (lt / 8.4) * 1.4 - 0.2;
    for (let k = 0; k < 70; k++) { const u = k / 70, x = 20 + u * 152, y = 64 - Math.sin(Math.max(0, Math.min(Math.PI, (u + arc - 0.5) * Math.PI))) * 40 * Math.min(1, lt / 3); const r = 5 * Math.sin(Math.PI * Math.min(1, u * 1.05)); disc(x, y, Math.max(1, Math.round(r)), '#03050c'); }
    for (let k = 0; k < 5; k++) for (let x = 0; x < W; x++) { const y = 60 + k * 10 + Math.sin(x * (0.05 + k * 0.01) + lt * (1.5 + k * 0.3) + k) * (3 + k); rect(x, y, 1, H - y, k % 2 ? p[1] : mix(p[0], p[1], 0.5)); px(x, y, p[3]); }
    for (let i = 0; i < 16; i++) { const ph = (lt * 0.3 + R(i)) % 1; ring(R(i, 3) * W, H - ph * 50, 1.5, p[3], 8); }
  },
  time(lt, p) {
    sky('#05030c', p[0]);
    const cx = 96, cy = 54;
    disc(cx, cy, 40, '#0a0614'); ring(cx, cy, 40, p[2], 160); ring(cx, cy, 37, p[1], 140);
    for (let h = 0; h < 12; h++) { const a = h / 12 * TAU; line(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32, cx + Math.cos(a) * 36, cy + Math.sin(a) * 36, p[3]); }
    for (const [sp, len, c] of [[lt * 2.6, 30, p[3]], [lt * 0.6, 20, p[2]]]) { const a = sp - Math.PI / 2; line(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len, c); }
    for (const [gx, gy, r, sp] of [[16, 16, 14, 1], [176, 92, 16, -0.8], [176, 14, 10, 1.3], [14, 94, 12, -1.1]]) { ring(gx, gy, r, p[1], 50); for (let k = 0; k < 10; k++) { const a = lt * sp + k / 10 * TAU; px(gx + Math.cos(a) * (r + 2), gy + Math.sin(a) * (r + 2), p[2]); } }
    for (let i = 0; i < 40; i++) { const ph = (lt * 0.5 + R(i)) % 1; px(cx + (R(i, 1) - 0.5) * 6, cy + 42 + ph * 20, p[3]); }
  },
  beast(lt, p) {
    sky('#020310', p[0]); stars(lt, 50, 80);
    disc(150, 26, 16, '#f0e6c8'); disc(146, 22, 3, '#d8caa6');
    const N = 90;
    for (let k = N; k >= 0; k--) {
      const u = lt * 0.9 - k * 0.045, x = 96 + Math.cos(u) * 70 + Math.sin(u * 2) * 12, y = 50 + Math.sin(u * 1.5) * 26;
      const r = k < 4 ? 4 : Math.max(1, 3.5 - k / 30);
      disc(x, y, Math.round(r), k % 6 === 0 ? p[3] : k % 2 ? p[1] : p[2]);
      if (k === 0) { px(x + 2, y - 2, '#ffffff'); line(x, y - 3, x - 4, y - 8, p[3]); line(x + 2, y - 3, x + 4, y - 8, p[3]); }
    }
    for (let x = 0; x < W; x++) { const h = 10 + Math.sin(x * 0.1 + lt * 0.8) * 3; rect(x, H - h, 1, h, '#1a1c30'); }
  },
  nature(lt, p) {
    sky('#0a0c18', '#2a1a2a');
    const g = Math.min(1, lt / 4.5), base = H - 4, top = H - 4 - 70 * g;
    rect(92, top, 8, base - top, '#2a1a10'); rect(94, top, 2, base - top, '#3a2a18');
    const br = (x, y, a, len, d) => { if (d > 5 || len < 3) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; line(x, y, x2, y2, '#2a1a10'); if (d >= 3) disc(x2, y2, 4 - (d - 3), d % 2 ? p[1] : p[2]); br(x2, y2, a - 0.5, len * 0.72, d + 1); br(x2, y2, a + 0.5, len * 0.72, d + 1); };
    if (g > 0.3) br(96, top, -Math.PI / 2, 22 * g, 0);
    for (let i = 0; i < 70; i++) { const an = lt * 0.5 + R(i) * TAU, d = 20 + R(i, 1) * 60; px(96 + Math.cos(an) * d, top + 20 + Math.sin(an) * d * 0.4, p[i % 2 ? 2 : 3]); }
    for (let i = 0; i < 20; i++) if (Math.sin(lt * 3 + i) > 0.3) px(R(i, 5) * W, 60 + R(i, 6) * 40, '#f4f7a0');
    rect(0, H - 4, W, 4, '#141a10');
  },
  frost(lt, p) {
    sky('#0a1426', p[1]);
    for (let x = -46; x < 240; x++) { const h = 22 + Math.sin(x * 0.05 + lt * 1.2) * 6, a = (x + Math.floor(lt * 20)) % 9 < 4; for (let j = 0; j < h; j++) if (R(x * 31 + j, Math.floor(lt * 6)) < 0.6 - j / h * 0.5) px(x, 6 + j, a ? p[2] : '#7ae0c8'); }
    for (const [mx, mh] of [[40, 50], [96, 64], [156, 48]]) for (let y = 0; y < mh; y++) { const w = y * 0.9; rect(mx - w, H - mh + y, w * 2, 1, y < mh * 0.25 ? '#ffffff' : '#5a7088'); }
    for (let i = 0; i < 90; i++) { const x = (R(i) * 300 + lt * 70) % 300 - 50, y = (R(i, 1) * 120 + lt * 40) % 120; px(x, y, '#ffffff'); }
    const g = Math.min(1, lt / 4);
    for (const [cx, cy] of [[60, 50], [130, 40], [96, 70]]) for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; line(cx, cy, cx + Math.cos(a) * 9 * g, cy + Math.sin(a) * 9 * g, p[3]); }
  },
};
SCENES.finale = (lt, p) => { const order = ['cosmic', 'divine', 'nature', 'ocean', 'abyss']; const i = Math.min(order.length - 1, Math.floor(lt / 1.7)); SCENES[order[i]](lt, p); if (lt % 1.7 < 0.12) fade(0.8, '#fff6d0'); };

// ---------- player
let active = null;
export const filmPlaying = () => !!active;
export function skipFilm() { active?.skip(); }

export function playFilm(a, { sound, onEnd } = {}) {
  const el = document.getElementById('film'), cv = document.getElementById('filmcv'), ctx = cv.getContext('2d');
  const txt = document.getElementById('film-text'), nm = document.getElementById('film-name'), odds = document.getElementById('film-odds');
  const L = a.legend, p = a.c.length >= 4 ? a.c : [...a.c, ...a.c];
  const lines = L.lines, style = L.style, finale = style === 'finale';
  el.hidden = false; el.className = finale ? 'finale' : ''; nm.textContent = ''; nm.className = 'film-name'; txt.textContent = '';
  odds.textContent = `1 in ${Math.round(a.n).toLocaleString('en-US')}`;
  const END = finale ? 21 : 19, T1 = 3.2, T2 = finale ? 12.5 : 11.6, T3 = T2 + 3, T4 = T3 + 0.4;
  const typeAt = [[T1 + 0.3, 0], [T1 + 3.1, 1], [T1 + 5.9, 2], [T4 + 1.4, 3]];
  const fired = new Set(), once = (k, f) => { if (!fired.has(k)) { fired.add(k); f(); } };
  return new Promise(resolve => {
    const t0 = performance.now();
    const finish = () => { if (!active) return; active = null; el.hidden = true; resolve(); onEnd?.(); };
    active = { skip: finish };
    function frame(now) {
      if (!active) return;
      const t = (now - t0) / 1000; C = ctx; ctx.imageSmoothingEnabled = false; ctx.save();
      // shake grows in shot 1 and shot 3
      const sh = t < T1 ? Math.max(0, t - 1.2) * 0.8 : t > T2 && t < T3 ? (t - T2) * 1.2 : 0;
      if (sh) ctx.translate(Math.round((Math.random() - 0.5) * sh), Math.round((Math.random() - 0.5) * sh));
      if (t < T1) { // shot 1: the shrine goes silent, the sky cracks
        sky('#05060f', '#1c1e3a'); stars(t, 60, 70);
        rect(0, 92, W, 16, '#0a0a12'); rect(60, 38, 72, 4, '#05050a'); rect(66, 48, 60, 3, '#05050a'); rect(70, 38, 4, 54, '#05050a'); rect(118, 38, 4, 54, '#05050a');
        if (t > 1.2) { const g = Math.min(1, (t - 1.2) / 1.6); let x = 96, y = 0; for (let k = 0; k < 18 * g; k++) { const nx = x + (R(k, 7) - 0.5) * 16, ny = y + 4; line(x, y, nx, ny, p[3]); line(x + 1, y, nx + 1, ny, p[2]); x = nx; y = ny; } once('crack', () => sound?.('crack')); }
        fade(Math.max(0, (t - 2.6) / 0.6));
        once('start', () => sound?.('start'));
      } else if (t < T2) { // shot 2: the legend's world
        SCENES[style]((t - T1) * (finale ? 1 : 1), p);
        fade(1 - (t - T1) / 0.5);
      } else if (t < T3) { // shot 3: light gathers into the shrine
        const lt = t - T2; sky('#000000', p[0]);
        for (let i = 0; i < 260; i++) { const ph = (lt * 0.45 + R(i)) % 1, an = R(i, 1) * TAU + ph * 4, d = 120 * (1 - ph); px(96 + Math.cos(an) * d, 58 + Math.sin(an) * d * 0.6, p[i % 4]); }
        for (let k = 0; k < 3; k++) ring(96, 58, ((lt * 30 + k * 12) % 40), p[3], 50, 0.6);
        disc(96, 58, Math.round(lt * 4), '#ffffff');
        once('gather', () => sound?.('gather'));
      } else if (t < T4) { rect(0, 0, W, H, '#ffffff'); once('hit', () => sound?.('hit')); }
      else { // shot 4: reveal
        const lt = t - T4; sky(mix(p[0], '#000000', 0.5), p[0]);
        for (let k = 0; k < 16; k++) { const an = lt * 0.3 + k / 16 * TAU; for (let r = 20; r < 120; r += 2) px(96 + Math.cos(an) * r, 62 + Math.sin(an) * r, k % 2 ? p[1] : mix(p[0], p[2], 0.5)); }
        rect(0, 92, W, 16, mix(p[0], '#000000', 0.3)); ring(96, 92, 30, p[2], 80, 0.18);
        drawAuraAt(ctx, a, t, 96, 82); C = ctx;
        fade(1 - lt / 0.6, '#ffffff');
        once('name', () => { nm.textContent = a.name; nm.className = 'film-name show'; sound?.('reveal'); });
      }
      ctx.restore();
      // typed backstory
      let shown = '';
      for (const [at, i] of typeAt) if (t >= at) { const lineT = Math.min(lines[i].length, Math.floor((t - at) * 34)); shown = lines[i].slice(0, lineT); if (i < 3 && t > at + 2.7) shown = lines[i]; }
      if (t >= T2 && t < T4 + 1.4) shown = '';
      if (txt.textContent !== shown) txt.textContent = shown;
      if (t >= END) return finish();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
