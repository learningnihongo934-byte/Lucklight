// Lucklight sound: small WebAudio synth. No files.
let ac = null, master = null, muted = false, vol = 0.5;
const apply = () => { if (master) master.gain.value = muted ? 0 : vol; };
export const setMuted = m => { muted = m; apply(); };
export const setVolume = v => { vol = v; apply(); };
function ctx() {
  if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = muted ? 0 : vol; master.connect(ac.destination); }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(freq, start, dur, type = 'square', vol = 0.15, slide = 0) {
  const a = ctx(), o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + start;
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(start, dur, vol = 0.1, hp = 800) {
  const a = ctx(), len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t0 = a.currentTime + start;
  f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol; s.buffer = buf;
  s.connect(f); f.connect(g); g.connect(master); s.start(t0);
}
function bell(freq, start, dur, vol = 0.12) { tone(freq, start, dur, 'sine', vol); tone(freq * 2.76, start, dur * 0.5, 'sine', vol * 0.35); tone(freq * 5.4, start, dur * 0.25, 'sine', vol * 0.15); }

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const note = (root, i) => root * 2 ** (PENTA[i % PENTA.length] / 12) * 2 ** Math.floor(i / PENTA.length);

export const sfx = {
  click() { tone(660, 0, 0.05, 'square', 0.06); },
  shake() { noise(0, 0.12, 0.08, 2500); tone(180, 0, 0.08, 'triangle', 0.08); },
  tick(i = 0) { tone(note(440, i % 8), 0, 0.05, 'square', 0.05); },
  buy() { tone(523, 0, 0.08, 'square', 0.08); tone(784, 0.07, 0.12, 'square', 0.08); },
  craft() { noise(0, 0.15, 0.06, 1500); bell(523, 0.05, 0.6, 0.1); bell(659, 0.15, 0.6, 0.08); },
  deny() { tone(160, 0, 0.12, 'square', 0.08, 0.7); },
  result(tier, rank) {
    // rank 0..19 nudges pitch so each aura sounds a bit different
    const root = 330 * 2 ** ((rank % 7) / 12);
    if (tier === 0) { tone(note(root, 2), 0, 0.12, 'triangle', 0.1); return; }
    if (tier === 1) { tone(note(root, 2), 0, 0.1, 'triangle', 0.12); tone(note(root, 4), 0.08, 0.25, 'triangle', 0.12); return; }
    if (tier === 2) { [0, 2, 4, 5].forEach((n, i) => tone(note(root, n), i * 0.09, 0.3, 'square', 0.08)); bell(note(root, 7), 0.38, 1.2); return; }
    if (tier === 3) {
      noise(0, 0.9, 0.05, 3000); tone(55, 0, 2.2, 'sine', 0.25);
      [0, 2, 4, 5, 7, 9].forEach((n, i) => tone(note(root, n), 0.3 + i * 0.08, 0.35, 'square', 0.07));
      bell(note(root, 7), 0.85, 2.2, 0.14); bell(note(root, 9), 1.0, 2.2, 0.1);
      return;
    }
    // tier 4: gong + long rising sparkle
    tone(41, 0, 4, 'sine', 0.3); tone(82, 0, 3, 'sine', 0.12); noise(0, 2.5, 0.06, 400);
    for (let i = 0; i < 16; i++) tone(note(root, i), 1.2 + i * 0.07, 0.4, 'square', 0.05);
    bell(note(root, 10), 2.4, 3.5, 0.16); bell(note(root, 12), 2.6, 3.5, 0.12); bell(note(root, 14), 2.8, 3.5, 0.1);
  },
  visitor() { bell(784, 0, 0.8, 0.1); bell(659, 0.25, 1, 0.1); },
  quest() { [0, 2, 4].forEach((n, i) => tone(note(523, n), i * 0.07, 0.18, 'square', 0.06)); },
  achieve() { [0, 2, 4, 7].forEach((n, i) => tone(note(523, n), i * 0.08, 0.25, 'square', 0.07)); bell(note(523, 9), 0.34, 1.4, 0.1); },
  streak() { for (let i = 0; i < 6; i++) tone(1046 + i * 90, i * 0.05, 0.08, 'square', 0.05); bell(1318, 0.32, 1, 0.08); },
  film(k) {
    if (k === 'start') { tone(55, 0, 3, 'sine', 0.22); noise(0, 2.5, 0.03, 300); }
    else if (k === 'crack') { noise(0, 0.6, 0.12, 1200); tone(110, 0, 0.8, 'sawtooth', 0.05, 0.5); }
    else if (k === 'gather') { tone(110, 0, 3, 'sawtooth', 0.04, 4); tone(220, 0.5, 2.5, 'triangle', 0.05, 3); noise(0, 3, 0.04, 2000); }
    else if (k === 'hit') { tone(41, 0, 3, 'sine', 0.35); noise(0, 1.2, 0.14, 200); }
    else if (k === 'reveal') { [0, 2, 4, 7, 9, 12].forEach((n, i) => tone(note(330, n), i * 0.09, 0.4, 'square', 0.06)); bell(note(330, 12), 0.6, 3.5, 0.16); bell(note(330, 14), 0.8, 3.5, 0.12); }
  },
  spin() { tone(880 + Math.random() * 300, 0, 0.03, 'square', 0.04); },
};
