// Lucklight: draw fortunes at a night shrine, collect auras, get luckier.
import { AURAS, AURA, reward, tierOf, GRADES, UPGRADES, cooldownBase, CHARMS, GEAR, EVENT } from './data.js';
import { HARVEST } from './more.js';
import { LEGENDS } from './lore.js';
import { drawStage, drawThumb } from './fx.js';
import { playFilm, skipFilm, filmPlaying } from './film.js';
import { phaseAt, weatherAt, PHASES, WEATHERS, BIOMES, BIOME, tagsOf } from './world.js';
import { LINES, LINE, lineCost, PETS, PET, UNLOCKS } from './offer.js';
import { makeVisitor, makeDailies, DAILY_BONUS, STORY, storyValue, ACHIEVEMENTS, achValue, streakReward } from './quests.js';
import { sfx, setMuted, setVolume } from './sfx.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-US');
const short = n => n < 1e4 ? fmt(n) : n < 1e6 ? (n / 1e3).toFixed(1) + 'K' : n < 1e9 ? (n / 1e6).toFixed(2) + 'M' : n < 1e12 ? (n / 1e9).toFixed(2) + 'B' : (n / 1e12).toFixed(2) + 'T';
const short2 = n => n < 1000 ? (+n.toFixed(2)).toString() : short(n);
const CH = Object.fromEntries(CHARMS.map(c => [c.id, c])), GR = Object.fromEntries(GEAR.map(g => [g.id, g]));
const CORE = AURAS.filter(a => !a.ev), EVA = AURAS.filter(a => a.ev === EVENT.id);
const GRADE5 = { kanji: '神吉', word: 'Divine luck' };
const gradeOf = a => a.n >= 1e9 ? GRADE5 : GRADES[tierOf(a.n)];
const STYLE_NAME = { cosmic: 'Cosmic', abyss: 'Abyss', storm: 'Storm', divine: 'Divine', fire: 'Fire', ocean: 'Ocean', time: 'Time', beast: 'Beast', nature: 'Nature', frost: 'Frost', finale: 'Finale' };

// ---------- save (v3 = the 1,000-aura fresh start)
const KEY = 'lucklight.v3';
try { localStorage.removeItem('lucklight.save'); } catch {}
const fresh = () => ({
  v: 3, mon: 0, rolls: 0, inv: {}, found: {}, equipped: null, best: null,
  up: { luck: 0, speed: 0, fortune: 0, multi: 0, auto: 0 }, lines: {}, unl: {}, pets: {}, pet: null, biomes: { shrine: true }, biome: 'shrine',
  charms: {}, active: {}, slip: null, owned: {}, gear: { hand: null, neck: null, ring: null },
  name: '', pid: '', mute: false, auto: false, dial: null, drawSize: null, log: [], gift: '', evForce: null, adminLuck: 1, tainted: false, tokens: 0, lantern: 0,
  stats: { monEarned: 0, used: 0, crafted: 0, visitors: 0, dailies: 0 }, perm: { luck: 0, mon: 0 },
  visitor: null, nextVisitor: 0, dailies: null, story: 0, ach: {}, titles: [], title: '', streak: { last: '', days: 0, claimed: '' }, tut: 0, wForce: null, pForce: null,
  set: { autoWear: true, cut: 'all', stopAt: 0, stopNew: false, vol: 50, music: true, musicVol: 35, popups: true, autoQuiet: false },
});
let S = fresh();
function load(raw) {
  const s = JSON.parse(raw), f = fresh();
  return Object.assign(f, s, ...['up', 'gear', 'set', 'stats', 'perm', 'streak'].map(k => ({ [k]: { ...f[k], ...s[k] } })));
}
try { const raw = localStorage.getItem(KEY); if (raw) S = load(raw); } catch {}
if (!S.pid) S.pid = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
setInterval(save, 3000); addEventListener('pagehide', save);
setMuted(S.mute); setVolume(S.set.vol / 100);

// ---------- music: "yoiyami core theme" by Yoiyami (CC0, OpenGameArt). Starts on the first click or key.
const music = new Audio('audio/yoiyami.mp3'); music.loop = true; music.preload = 'none';
let unlocked = false, duck = 1;
const syncMusic = () => {
  music.volume = Math.max(0, Math.min(1, S.set.musicVol / 100 * duck));
  if (S.set.music && unlocked) music.play().catch(() => {}); else music.pause();
};
const unlock = () => { if (unlocked) return; unlocked = true; syncMusic(); };
addEventListener('pointerdown', unlock, { capture: true }); addEventListener('keydown', unlock, { capture: true });
const popupsOn = () => S.set.popups && !(S.auto && S.set.autoQuiet);

// ---------- festival + world
const today = () => new Date().toLocaleDateString('en-CA');
const left = ms => { ms = Math.max(0, ms); const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60; return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}:${String(s).padStart(2, '0')}`; };
const eventOn = () => S.evForce === 'on' ? true : S.evForce === 'off' ? false : Date.now() >= EVENT.start && Date.now() < EVENT.end;
const POOL_ON = AURAS.filter(a => !a.ev || a.ev === EVENT.id), POOL_OFF = CORE;
const lanternOn = () => S.lantern > Date.now();
const harvestOn = () => eventOn() || lanternOn();
const pool = () => harvestOn() ? POOL_ON : POOL_OFF;
function world() {
  const now = Date.now();
  const ph = S.pForce ? { ...PHASES.find(p => p.id === S.pForce), left: 0 } : phaseAt(now);
  const we = S.wForce ? { ...WEATHERS.find(w => w.id === S.wForce), left: 0 } : weatherAt(now);
  return { ph, we, bi: BIOME[S.biome] || BIOME.shrine };
}

// ---------- rules
const lv = id => S.lines[id] || 0;
const eff = id => LINE[id].eff(lv(id));
const disc = c => Math.round(c * (1 - eff('bargain')));
const petB = kind => { const p = PET[S.pet]; return p && p.kind === kind ? p.v * (1 + eff('treats')) : 0; };
const gearOn = () => [S.gear.hand, S.gear.neck, S.unl.ring ? S.gear.ring : null].filter(Boolean).map(id => GR[id]).filter(Boolean);
const baseMax = () => 1.15 ** S.up.luck * (1 + gearOn().reduce((s, g) => s + g.luck, 0)) * eff('deep') * (1 + S.perm.luck / 100) * (1 + petB('luck'));
const bellEvery = () => 10 - lv('bell');
function luckParts(k = 0) {
  const now = Date.now(), max = baseMax(), base = S.dial ? Math.min(S.dial, max) : max, cp = 1 + eff('charmpow');
  let charm = 1; for (const [id, until] of Object.entries(S.active)) if (until > now) charm *= CH[id].mult * cp;
  const ev = eventOn() ? EVENT.luck : 1;
  const bell = S.up.fortune > 0 && (S.rolls + k + 1) % bellEvery() === 0 ? S.up.fortune + 1 : 1;
  const slip = S.slip && k === 0 ? CH[S.slip].mult * (1 + eff('slipfold')) : 1;
  const admin = S.adminLuck || 1;
  return { max, base, charm, ev, bell, slip, admin, total: base * charm * ev * bell * slip * admin };
}
const cooldown = () => cooldownBase(S.up.speed) * (1 - gearOn().reduce((s, g) => s + g.speed, 0)) * (1 - eff('swift')) * (1 - petB('speed'));
const maxDraw = () => 1 + S.up.multi;
const drawN = () => Math.max(1, Math.min(maxDraw(), S.drawSize || maxDraw()));
const charmSecs = c => Math.round(c.secs * (1 + eff('charmtime')) * (1 + petB('charm')));
const lanternSecs = () => HARVEST.lantern.secs + eff('oil') * 60;
const monFor = n => reward(n) * (1 + eff('mon')) * (1 + S.perm.mon / 100) * (1 + petB('mon')) * (n >= 1000 ? 1 + eff('favor') : 1);
const bestN = () => S.best ? AURA[S.best].n : 1;
const bestOwned = () => { for (let i = AURAS.length - 1; i >= 0; i--) if (S.inv[AURAS[i].id] > 0) return AURAS[i].id; return null; };
const canPay = (need, mon) => S.mon >= mon && Object.entries(need).every(([k, v]) => (S.inv[k] || 0) >= v);
function pay(need, mon) {
  S.mon -= mon; for (const [k, v] of Object.entries(need)) S.inv[k] -= v;
  if (S.equipped && !(S.inv[S.equipped] > 0)) S.equipped = bestOwned();
}
// world boosts: auras whose tags match the time of day, weather or backdrop roll as if luck were higher
let boostKey = '', boostArr = [];
function boosts(p) {
  const { ph, we, bi } = world(), sense = eff('sense'), att = eff('attune');
  const key = [ph.id, we.id, bi.id, sense, att, p.length].join('|');
  if (key !== boostKey) {
    boostKey = key;
    const phM = 1 + (ph.mult - 1) * (1 + sense), weM = 1 + (we.mult - 1) * (1 + sense), biM = 1 + (bi.mult - 1) * (1 + att);
    boostArr = p.map(a => { const t = tagsOf(a); let m = 1; if (ph.tags.some(x => t.includes(x))) m *= phM; if (we.tags.some(x => t.includes(x))) m *= weM; if (bi.tags.some(x => t.includes(x))) m *= biM; return m; });
  }
  return boostArr;
}
function rollOne(L) { const p = pool(), b = boosts(p); for (let i = p.length - 1; i > 0; i--) if (Math.random() * p[i].n < L * b[i]) return p[i]; return p[0]; }

// ---------- arcade + leaderboard
const arcadeScore = (score, m) => { try { if (window.parent !== window) window.parent.postMessage({ rennkoArcade: 1, type: 'score', score, meta: m }, 'https://arcade.rennko.tech'); } catch {} };
const arcadeBest = () => { if (S.best && !S.tainted) arcadeScore(Math.round(Math.log10(AURA[S.best].n) * 100) / 100, { aura: AURA[S.best].name }); };
let lastPost = 0;
async function postScore() {
  if (!S.name || !S.best || S.tainted) return;
  lastPost = S.rolls;
  try { await fetch('/api/score', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: S.pid, name: S.name, best: S.best, rolls: S.rolls, title: S.title }) }); } catch {}
}

// ---------- quests: context, rewards, progress
const ctxQ = () => ({
  S, bestN, drawN, foundCore: () => CORE.filter(a => S.found[a.id]), petsOwned: () => Object.keys(S.pets).length,
  biomesOwned: () => Object.keys(S.biomes).filter(b => b !== 'shrine').length, legendsFound: () => LEGENDS.filter(l => S.found[l.id]).length,
  gearCount: () => Object.keys(S.owned).length, festFound: () => EVA.filter(a => S.found[a.id]).length,
});
function rewardText(r, mult = 1) {
  const p = [];
  if (r.mon) p.push(`${short(Math.round(r.mon * mult))} mon`);
  if (r.tokens) p.push(`${Math.round(r.tokens * mult)} tokens`);
  if (r.charm) p.push(`${(r.n || 1) > 1 ? r.n + ' × ' : ''}${CH[r.charm].name}`);
  if (r.perm?.luck) p.push(`+${r.perm.luck}% luck forever`);
  if (r.perm?.mon) p.push(`+${r.perm.mon}% mon forever`);
  if (r.title) p.push(`title "${r.title}"`);
  return p.join(' · ');
}
function grant(r, mult = 1) {
  if (r.mon) { const m = Math.round(r.mon * mult); S.mon += m; S.stats.monEarned += m; }
  if (r.tokens) S.tokens += Math.round(r.tokens * mult);
  if (r.charm) S.charms[r.charm] = (S.charms[r.charm] || 0) + (r.n || 1);
  if (r.perm?.luck) S.perm.luck = +(S.perm.luck + r.perm.luck).toFixed(2);
  if (r.perm?.mon) S.perm.mon = +(S.perm.mon + r.perm.mon).toFixed(2);
  if (r.title && !S.titles.includes(r.title)) S.titles.push(r.title);
  return rewardText(r, mult);
}
const qMult = () => 1 + eff('scholar');
function ensureDailies() { if (!S.dailies || S.dailies.day !== today()) S.dailies = makeDailies(today(), ctxQ()); }
function dq(id, add) {
  for (const d of S.dailies?.list || []) if (d.id === id && !d.done) {
    d.progress = Math.min(d.goal, d.progress + add);
    if (d.progress >= d.goal) { d.done = true; ping(`Daily quest done: ${d.text}`); }
  }
}
function questRoll(got, freshList, best) {
  ensureDailies();
  const { ph, we } = world();
  dq('roll', got.length); dq('new', freshList.length);
  for (const d of S.dailies.list) if (d.id === 'rare' && !d.done && best.n >= d.goal) { d.progress = d.goal; d.done = true; ping(`Daily quest done: ${d.text}`); }
  if (ph.id === 'night') dq('night', got.length);
  if (['rain', 'snow', 'fog', 'storm'].includes(we.id)) dq('weather', got.length);
  const v = S.visitor;
  if (v) { if (v.req.type === 'draw') v.progress += got.length; if (v.req.type === 'find' && best.n >= v.req.goal) v.progress = v.req.goal; }
}
function visitorReady() {
  const v = S.visitor; if (!v) return false;
  return v.req.type === 'bring' ? (S.inv[v.req.aura] || 0) >= v.req.goal : v.req.type === 'mon' ? S.mon >= v.req.goal : v.progress >= v.req.goal;
}
function visitorProgress() {
  const v = S.visitor;
  return v.req.type === 'bring' ? `you hold ${fmt(Math.min(S.inv[v.req.aura] || 0, v.req.goal))}/${v.req.goal}` : v.req.type === 'mon' ? `you have ${short(S.mon)}` : v.req.type === 'find' ? (v.progress >= v.req.goal ? 'found!' : 'not yet') : `${fmt(Math.min(v.progress, v.req.goal))}/${fmt(v.req.goal)}`;
}
function updateStreak() {
  const t = today(), st = S.streak; if (st.last === t) return;
  const y = new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
  st.days = st.last === y ? st.days + 1 : 1; st.last = t;
}
function checkAch() {
  const cx = ctxQ();
  for (const a of ACHIEVEMENTS) if (!S.ach[a.id] && achValue(cx, a.key) >= a.goal) {
    S.ach[a.id] = 1; const txt = grant({ ...a.reward, ...(a.title ? { title: a.title } : {}) });
    ping(`Achievement · ${a.name} · ${txt}`, 'gold'); sfx.achieve?.();
  }
}
const storyReady = () => S.story < STORY.length && storyValue(ctxQ(), STORY[S.story].goal[0]) >= STORY[S.story].goal[1];
function questsBadge() {
  ensureDailies();
  const d = S.dailies, any = S.streak.claimed !== today() || visitorReady() || storyReady() || d.list.some(x => x.done && !x.claimed) || (d.list.every(x => x.claimed) && !d.bonus);
  document.querySelector('#tabs [data-tab="quests"]')?.classList.toggle('badge', any);
}
// visitors arrive every few minutes once you've started drawing
const vis = { x: 200, leaving: null };
function tickVisitor() {
  const now = Date.now();
  if (S.visitor && now > S.visitor.until) { vis.leaving = S.visitor.kind; S.visitor = null; S.nextVisitor = now + 3 * 6e4; toast('The visitor got tired of waiting and left.'); }
  if (!S.visitor && S.rolls >= 20 && now >= S.nextVisitor) {
    S.visitor = makeVisitor(ctxQ()); vis.x = 200; vis.leaving = null;
    sfx.visitor?.(); ping(`${S.visitor.name} has come to the shrine.`);
  }
}

// ---------- drawing
// draw `n` auras and put them in the bag; returns a summary
function drawBatch(n) {
  const crit = eff('crit'), got = [];
  for (let k = 0; k < n; k++) { const L = luckParts(k).total; got.push(rollOne(L)); if (crit && Math.random() < crit) got.push(rollOne(L)); }
  S.slip = null;
  let earned = 0, best = null; const fr = [];
  for (const a of got) {
    S.rolls++; S.inv[a.id] = (S.inv[a.id] || 0) + 1;
    const isNew = !S.found[a.id];
    if (isNew) { S.found[a.id] = S.rolls; fr.push(a); }
    earned += monFor(a.n); if (!best || a.n > best.n) best = a;
    if (a.ev) S.tokens += Math.round(HARVEST.tokens(a.n) * (1 + eff('purse')));
    if (tierOf(a.n) >= 2 || isNew) S.log.unshift({ id: a.id, r: S.rolls, nw: isNew ? 1 : 0 });
  }
  if (S.log.length > 40) S.log.length = 40;
  earned = Math.round(earned); S.mon += earned; S.stats.monEarned += earned;
  const newBest = !S.best || best.n > AURA[S.best].n; if (newBest) S.best = best.id;
  if (!S.equipped || (S.set.autoWear && best.n > AURA[S.equipped].n)) S.equipped = best.id;
  questRoll(got, fr, best);
  return { got, best, earned, fresh: fr, newBest };
}

let revealing = false, readyAt = 0, rollStart = 0;
function roll() {
  const now = performance.now();
  if (revealing || now < readyAt || filmPlaying()) return;
  const N = drawN(), r = drawBatch(N);
  rollStart = now; readyAt = now + cooldown();
  if (S.auto && ((S.set.stopAt && r.best.n >= S.set.stopAt) || (S.set.stopNew && r.fresh.length))) { S.auto = false; toast(`Auto-draw stopped on ${r.best.name}.`); }
  sfx.shake(); burst(r.best.c[Math.min(2, r.best.c.length - 1)]); popText(`+${short(r.earned)} mon`);
  if (tierOf(r.best.n) >= 2) flash(r.best.c[Math.min(1, r.best.c.length - 1)]);
  reveal(r.best, r.fresh.includes(r.best), r.earned, r.got.length, r.fresh.length).then(() => {
    if (r.newBest) { arcadeBest(); postScore(); } else if (S.rolls - lastPost >= 250) postScore();
  });
  refresh();
}

const wait = ms => new Promise(r => setTimeout(r, ms));
let skipCut = null;
const waitSkip = ms => new Promise(r => { const t = setTimeout(done, ms); function done() { clearTimeout(t); skipCut = null; r(); } skipCut = done; });
let cutAura = null;
async function film(a) {
  duck = 0.35; syncMusic();
  await playFilm(a, { sound: k => sfx.film?.(k) });
  duck = 1; syncMusic();
}
async function reveal(a, isNew, earned, N, nNew) {
  const tier = tierOf(a.n), rank = AURAS.indexOf(a), mode = S.set.cut;
  const big = popupsOn() && (mode === 'all' || (mode === 'new' && isNew));
  revealing = true;
  if (a.legend && popupsOn() && mode !== 'off') {
    await film(a);
    showSlip(a, isNew, earned, N, nNew, true); revealing = false; refresh(); return;
  }
  if (tier >= 1 && big) {
    const slip = $('#slip'), p = pool(), ri = p.indexOf(a); slip.className = 'slip spinning';
    const steps = tier === 1 ? 7 : 12;
    for (let i = 0; i < steps; i++) {
      const fake = p[Math.floor(Math.random() * Math.min(p.length, Math.max(ri, 0) + 6))];
      slip.innerHTML = `<div class="grade">？</div><div class="nm" style="--ac:${fake.c[1]}">${esc(fake.name)}</div><div class="odds">1 in ${fmt(fake.n)}</div>`;
      sfx.spin(); await wait(40 + i * (tier === 1 ? 8 : 12));
    }
  }
  sfx.result(tier, rank);
  const shown = tier >= 2 && big;
  if (shown) await cutscene(a, tier, isNew);
  showSlip(a, isNew, earned, N, nNew, shown);
  revealing = false;
  refresh();
}
async function cutscene(a, tier, isNew) {
  const cut = $('#cut'), g = gradeOf(a);
  cutAura = a;
  cut.style.setProperty('--ac', a.c[Math.min(1, a.c.length - 1)]);
  cut.style.setProperty('--ac2', a.c[a.c.length - 1]);
  cut.querySelector('.grade').textContent = g.kanji;
  cut.querySelector('.gword').textContent = g.word;
  cut.querySelector('.nm').textContent = a.name;
  cut.querySelector('.odds').textContent = `1 in ${fmt(a.n)}`;
  cut.querySelector('.new').hidden = !isNew;
  cut.className = `show t${tier}`;
  document.body.classList.toggle('shake', tier >= 3);
  await waitSkip([0, 0, 1900, 3300, 5600][tier]);
  cut.className = ''; cutAura = null;
  document.body.classList.remove('shake');
}
function showSlip(a, isNew, earned, N = 1, nNew = 0, shown = false) {
  const g = gradeOf(a), tier = a.n >= 1e9 ? 5 : tierOf(a.n), slip = $('#slip');
  slip.className = `slip t${Math.min(tier, 4)}${tier >= 5 ? ' legend' : ''}`;
  slip.innerHTML = `<div class="grade" title="${g.word}">${g.kanji}</div>
    <div class="nm" style="--ac:${a.c[Math.min(1, a.c.length - 1)]}">${esc(a.name)}${isNew ? '<span class="stamp">NEW</span>' : ''}${a.ev ? '<span class="evtag">Festival</span>' : ''}${a.legend ? '<span class="evtag legendtag">Legend</span>' : ''}</div>
    <div class="odds">1 in ${fmt(a.n)}${N > 1 ? ` · best of ${N} rolls` : ''}</div>
    <div class="earn">${earned ? `+${fmt(earned)} mon` : ''}${nNew > (isNew ? 1 : 0) ? ` · ${nNew} new auras` : ''}</div>`;
  if (tier >= 2 && !shown && popupsOn()) toast(`${g.word}: ${a.name}, 1 in ${fmt(a.n)}`);
}

// ---------- juice
function popText(txt) { const el = document.createElement('span'); el.className = 'pop'; el.textContent = txt; $('#pops').append(el); setTimeout(() => el.remove(), 1100); }
function burst(color) {
  const b = $('#roll').getBoundingClientRect();
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('i'); s.className = 'spark';
    const an = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40;
    s.style.cssText = `left:${b.left + b.width / 2 + scrollX}px;top:${b.top + b.height / 2 + scrollY}px;--dx:${Math.cos(an) * d}px;--dy:${Math.sin(an) * d - 20}px;background:${i % 3 ? color : '#ffe68a'}`;
    document.body.append(s); setTimeout(() => s.remove(), 650);
  }
}
function flash(color) { const w = $('.stagewrap'); w.style.setProperty('--fl', color); w.classList.remove('flash'); void w.offsetWidth; w.classList.add('flash'); }
function ping(msg, cls = '') { toast(msg, cls); sfx.quest?.(); }

// ---------- UI
let tab = 'index';
const TABS = { index: 'Collection', shrine: 'Offerings', charms: 'Charms', craft: 'Craft', quests: 'Quests', theater: 'Theater', market: 'Market', board: 'Board', settings: 'Settings' };
$('#tabs').innerHTML = Object.entries(TABS).map(([k, v], i) => `<button data-tab="${k}" title="Key ${i + 1}">${v}</button>`).join('');
const ui = { q: '', f: 'all', page: 0 };
const PAGE = 60;
const head = (k, t) => `<h4 class="sec" data-k="${k}">${t}</h4>`;
const bar = (v, g) => `<span class="pbar"><i style="width:${Math.min(100, Math.round(v / g * 100))}%"></i></span>`;
function need(n, mon) {
  return Object.entries(n).map(([k, v]) => { const have = S.inv[k] || 0; return `<span class="chip ${have >= v ? 'ok' : ''}">${esc(AURA[k].name)} ${fmt(Math.min(have, v))}/${v}</span>`; }).join('') +
    `<span class="chip ${S.mon >= mon ? 'ok' : ''}">${short(mon)} mon</span>`;
}
const sel = (key, val, opts) => `<select data-set="${key}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const chk = (key, on) => `<input type="checkbox" data-set="${key}" ${on ? 'checked' : ''}>`;
const thumb = (a, unk = false) => `<canvas class="thumb" width="48" height="48" data-a="${a.id}" data-u="${unk ? 1 : 0}"></canvas>`;

const VIEWS = {
  index() {
    const q = ui.q.trim().toLowerCase(), f = ui.f;
    const list = AURAS.filter(a => {
      if (f === 'event' && !a.ev) return false;
      if (f === 'legend' && !a.legend) return false;
      if (f === 'found' && !S.found[a.id]) return false;
      if (f === 'missing' && S.found[a.id]) return false;
      return !q || (S.found[a.id] && a.name.toLowerCase().includes(q)) || fmt(a.n).replace(/,/g, '').startsWith(q.replace(/,/g, ''));
    });
    const pages = Math.max(1, Math.ceil(list.length / PAGE)); ui.page = Math.min(ui.page, pages - 1);
    const found = CORE.filter(a => S.found[a.id]).length, efound = EVA.filter(a => S.found[a.id]).length;
    return [`<p class="lede" data-k="head">${found} of ${CORE.length} auras found · festival ${efound}/${EVA.length}. Showing ${list.length}.</p>`,
      ...list.slice(ui.page * PAGE, ui.page * PAGE + PAGE).map(a => {
        const f = !!S.found[a.id], cnt = S.inv[a.id] || 0, on = S.equipped === a.id;
        return `<div class="card ${f ? '' : 'unk'} ${on ? 'on' : ''} ${a.legend ? 'leg' : ''}" data-k="a-${a.id}">${thumb(a, !f)}
          <div class="info"><b>${f ? esc(a.name) : '? ? ?'}${a.ev ? ' <span class="evtag">Festival</span>' : ''}${a.legend ? ' <span class="evtag legendtag">Legend</span>' : ''}</b><span>1 in ${fmt(a.n)}</span><span class="cnt">${f ? `held ×${fmt(cnt)}` : 'not found'}</span></div>
          <div class="btns">${a.legend ? `<button data-act="film" data-id="${a.id}">Film</button>` : ''}${f ? `<button data-act="wear" data-id="${a.id}" ${on || !cnt ? 'disabled' : ''}>${on ? 'Worn' : 'Wear'}</button>` : ''}</div>
        </div>`;
      }),
      `<div class="pager" data-k="pager"><button data-act="page" data-id="-1" ${ui.page ? '' : 'disabled'}>Prev</button><span>Page ${ui.page + 1} of ${pages}</span><button data-act="page" data-id="1" ${ui.page < pages - 1 ? '' : 'disabled'}>Next</button></div>`];
  },
  shrine() {
    const p = luckParts(), mx = p.max, bg = eff('bargain'), rows = [];
    rows.push(`<p class="lede" data-k="head">Leave mon at the offering box. Luck now ×${short2(p.total)}: base ×${short2(p.base)}${S.dial ? ` (dial, max ×${short2(mx)})` : ''} · charms ×${short2(p.charm)}${p.ev > 1 ? ` · festival ×${p.ev}` : ''}${S.perm.luck ? ` · blessings +${S.perm.luck}%` : ''}.</p>`);
    rows.push(`<div class="row" data-k="dial"><div class="info"><b>Luck dial</b><span>Turn your base luck down to grind smaller auras: any value from ×1 to your max ×${short2(mx)}. Charms, the tenth bell and the festival still multiply on top.</span></div>
        <div class="btns"><input type="number" min="1" step="any" data-set="dial" value="${S.dial ?? ''}" placeholder="max"><button data-act="dialmax" ${S.dial ? '' : 'disabled'}>Max</button></div></div>`);
    if (S.up.multi) rows.push(`<div class="row" data-k="size"><div class="info"><b>Draw size</b><span>How many auras each draw rolls, up to ${maxDraw()}. The reveal shows the rarest.</span></div>
        <div class="btns"><input type="number" min="1" max="${maxDraw()}" step="1" data-set="drawSize" value="${drawN()}"></div></div>`);
    rows.push(head('h-up', 'Shrine upgrades'));
    for (const u of UPGRADES) {
      const l = S.up[u.id], max = l >= u.max, cost = disc(u.cost(l));
      rows.push(`<div class="row" data-k="u-${u.id}"><div class="info"><b>${u.name}</b> <span class="lvl">${u.max > 1 ? `Lv ${l}/${u.max}` : max ? 'Owned' : ''}</span>
          <span>${max ? (u.id === 'auto' ? 'Auto-draw unlocked' : 'Maxed out') : u.desc(l)}</span></div>
          ${max ? '' : `<button data-act="buy" data-id="${u.id}" ${S.mon >= cost ? '' : 'disabled'}>${short(cost)} mon</button>`}</div>`);
    }
    for (const ln of LINES) {
      const l = lv(ln.id), max = l >= ln.max, cost = lineCost(ln, l, bg);
      rows.push(`<div class="row" data-k="l-${ln.id}"><div class="info"><b>${ln.name}</b> <span class="lvl">Lv ${l}/${ln.max}</span>
          <span>${max ? `Maxed: ${ln.desc(ln.eff(l), ln.eff(l)).split(' → ')[0]}` : ln.desc(ln.eff(l), ln.eff(l + 1))}</span></div>
          ${max ? '' : `<button data-act="line" data-id="${ln.id}" ${S.mon >= cost ? '' : 'disabled'}>${short(cost)} mon</button>`}</div>`);
    }
    rows.push(head('h-unl', 'Unlocks'));
    for (const u of UNLOCKS) { const c = disc(u.cost); rows.push(`<div class="row" data-k="x-${u.id}"><div class="info"><b>${u.name}</b><span>${u.desc}</span></div>${S.unl[u.id] ? '<span class="lvl">Owned</span>' : `<button data-act="unlock" data-id="${u.id}" ${S.mon >= c ? '' : 'disabled'}>${short(c)} mon</button>`}</div>`); }
    rows.push(head('h-pets', 'Pets · one follows you at a time'));
    for (const pt of PETS) { const c = disc(pt.cost), own = S.pets[pt.id], on = S.pet === pt.id; rows.push(`<div class="row ${on ? 'on' : ''}" data-k="p-${pt.id}"><div class="info"><b>${pt.name}</b><span>${pt.desc}${eff('treats') ? ` (+${Math.round(eff('treats') * 100)}% from treats)` : ''}</span></div>${own ? `<button data-act="pet" data-id="${pt.id}" ${on ? 'disabled' : ''}>${on ? 'Following' : 'Call'}</button>` : `<button data-act="pet" data-id="${pt.id}" ${S.mon >= c ? '' : 'disabled'}>Adopt · ${short(c)}</button>`}</div>`); }
    rows.push(head('h-bio', 'Backdrops · each boosts its own kind of aura'));
    for (const b of BIOMES) { const c = disc(b.cost), own = S.biomes[b.id], on = S.biome === b.id; rows.push(`<div class="row ${on ? 'on' : ''}" data-k="b-${b.id}"><div class="info"><b>${b.name}</b><span>Boosts ${b.tags.join(' & ')} auras ×${short2(1 + (b.mult - 1) * (1 + eff('attune')))}</span></div>${own ? `<button data-act="biome" data-id="${b.id}" ${on ? 'disabled' : ''}>${on ? 'Here' : 'Go'}</button>` : `<button data-act="biome" data-id="${b.id}" ${S.mon >= c ? '' : 'disabled'}>Unlock · ${short(c)}</button>`}</div>`); }
    return rows;
  },
  charms() {
    const now = Date.now();
    const act = Object.entries(S.active).filter(([, u]) => u > now).map(([id, u]) => `${CH[id].name} ×${short2(CH[id].mult * (1 + eff('charmpow')))} · ${left(u - now)}`);
    if (S.slip) act.push(`${CH[S.slip].name} ×${fmt(CH[S.slip].mult * (1 + eff('slipfold')))} on your next roll`);
    return [`<p class="lede" data-k="head">${act.length ? 'Active: ' + act.join(' &nbsp;|&nbsp; ') : 'Fold auras and mon into charms. Timed charms of different kinds multiply.'}${S.unl.helper ? ' Charm Helper relights them for you.' : ''}</p>`,
      ...CHARMS.map(c => {
        const have = S.charms[c.id] || 0, secs = charmSecs(c);
        return `<div class="row" data-k="c-${c.id}"><div class="info"><b>${c.name}</b>${c.ev ? ' <span class="evtag">Festival</span>' : ''} <span class="lvl">held ${have}</span>
          <span>${c.once ? `Next roll: luck ×${fmt(c.mult * (1 + eff('slipfold')))}` : `Luck ×${short2(c.mult * (1 + eff('charmpow')))} for ${secs >= 120 ? Math.round(secs / 60) + ' min' : secs + 's'}`}</span><span class="chips">${need(c.need, c.mon)}</span></div>
          <div class="btns"><button data-act="charm" data-id="${c.id}" ${canPay(c.need, c.mon) ? '' : 'disabled'}>Craft</button>
          <button data-act="use" data-id="${c.id}" ${have ? '' : 'disabled'}>Use</button></div></div>`;
      })];
  },
  craft() {
    return [`<p class="lede" data-k="head">Gear is crafted once and kept. Wear one hand piece and one neck piece${S.unl.ring ? ', plus any piece in your ring slot' : ''}.${S.unl.ring && S.gear.ring ? ` Ring: ${GR[S.gear.ring].name}.` : ''}</p>`,
      ...GEAR.map(g => {
        const own = S.owned[g.id], worn = S.gear[g.slot] === g.id, ring = S.gear.ring === g.id;
        return `<div class="row ${worn || ring ? 'on' : ''}" data-k="g-${g.id}"><div class="info"><b>${g.name}</b> <span class="lvl">${g.slot}${ring ? ' · in ring slot' : ''}</span>
          <span>Luck +${g.luck}${g.speed ? `, draws ${Math.round(g.speed * 100)}% faster` : ''}</span>${own ? '' : `<span class="chips">${g.tokens ? `<span class="chip ${S.tokens >= g.tokens ? 'ok' : ''}">${g.tokens} harvest tokens · Harvest Market</span>` : need(g.need, g.mon)}</span>`}</div>
          <div class="btns">${own ? `<button data-act="gear" data-id="${g.id}" ${ring ? 'disabled' : ''}>${worn ? 'Take off' : 'Wear'}</button>${S.unl.ring ? `<button data-act="ring" data-id="${g.id}" ${worn ? 'disabled' : ''}>${ring ? 'Unring' : 'Ring'}</button>` : ''}` : g.tokens ? `<button data-act="tab" data-id="market">Market</button>` : `<button data-act="forge" data-id="${g.id}" ${canPay(g.need, g.mon) ? '' : 'disabled'}>Craft</button>`}</div></div>`;
      })];
  },
  quests() {
    ensureDailies();
    const cx = ctxQ(), now = Date.now(), m = qMult(), rows = [], st = S.streak, sc = st.claimed !== today();
    const sr = streakReward(st.days, eff('basket'), bestN());
    rows.push(`<div class="row ${sc ? 'ready' : ''}" data-k="q-streak"><div class="info"><b>Login streak · day ${st.days}</b><span>${rewardText(sr)}${sc ? '' : ' · claimed, come back tomorrow'}</span></div><button data-act="streak" ${sc ? '' : 'disabled'}>${sc ? 'Claim' : 'Claimed'}</button></div>`);
    rows.push(head('h-vis', 'Shrine visitor'));
    if (S.visitor) {
      const v = S.visitor, ready = visitorReady();
      rows.push(`<div class="row ${ready ? 'ready' : ''}" data-k="q-vis"><div class="info"><b>${esc(v.name)}</b><span class="say">"${esc(v.hi)}"</span><span>${esc(v.req.text)} · ${visitorProgress()}</span><span class="chips"><span class="chip ok">${rewardText(v.reward, m)}</span></span><span>Leaves in ${left(v.until - now)}</span></div><button data-act="visit" ${ready ? '' : 'disabled'}>${v.req.type === 'bring' ? 'Hand over' : v.req.type === 'mon' ? 'Offer' : 'Done'}</button></div>`);
    } else rows.push(`<p class="lede" data-k="q-vis0">${S.rolls < 20 ? 'Draw a few fortunes and travelers will start to visit.' : `No one at the gate. Next visitor in about ${left(S.nextVisitor - now)}.`}</p>`);
    rows.push(head('h-day', 'Daily quests · new ones every day'));
    S.dailies.list.forEach((d, i) => rows.push(`<div class="row ${d.done && !d.claimed ? 'ready' : ''}" data-k="q-d${i}"><div class="info"><b>${esc(d.text)}</b>${bar(d.progress, d.goal)}<span class="chips"><span class="chip ${d.done ? 'ok' : ''}">${rewardText(d.reward, m)}</span></span></div><button data-act="daily" data-id="${i}" ${d.done && !d.claimed ? '' : 'disabled'}>${d.claimed ? 'Claimed' : d.done ? 'Claim' : `${d.id === 'rare' ? (d.done ? 1 : 0) : fmt(d.progress)}/${d.id === 'rare' ? 1 : fmt(d.goal)}`}</button></div>`));
    const all = S.dailies.list.every(d => d.claimed);
    rows.push(`<div class="row ${all && !S.dailies.bonus ? 'ready' : ''}" data-k="q-bonus"><div class="info"><b>All three done</b><span>${rewardText(DAILY_BONUS, m)}</span></div><button data-act="dailybonus" ${all && !S.dailies.bonus ? '' : 'disabled'}>${S.dailies.bonus ? 'Claimed' : 'Claim'}</button></div>`);
    rows.push(head('h-story', `The shrine's story · ${Math.min(S.story + 1, STORY.length)} of ${STORY.length}`));
    if (S.story < STORY.length) {
      const c = STORY[S.story], v = storyValue(cx, c.goal[0]), done = v >= c.goal[1];
      rows.push(`<div class="row story ${done ? 'ready' : ''}" data-k="q-story${S.story}"><div class="info"><b>${S.story + 1}. ${esc(c.title)}</b><span class="say">${esc(c.text)}</span><span>${esc(c.goalText)}</span>${bar(Math.min(v, c.goal[1]), c.goal[1])}<span class="chips"><span class="chip ok">${rewardText(c.reward, m)}</span></span></div><button data-act="story" ${done ? '' : 'disabled'}>${done ? 'Claim' : 'In progress'}</button></div>`);
    } else rows.push(`<p class="lede" data-k="q-story-end">You have finished the shrine's story. The last lantern is lit.</p>`);
    const nAch = Object.keys(S.ach).length;
    rows.push(head('h-ach', `Achievements · ${nAch}/${ACHIEVEMENTS.length} · blessings +${S.perm.luck}% luck, +${S.perm.mon}% mon`));
    rows.push(`<div class="row" data-k="q-title"><div class="info"><b>Title</b><span>Shown on the stage and the board. Earn more from achievements and the story.</span></div>${sel('title', S.title, [['', 'None'], ...S.titles.map(t => [t, t])])}</div>`);
    rows.push(`<div class="achgrid" data-k="q-achs">${ACHIEVEMENTS.map(a => { const done = S.ach[a.id], v = achValue(cx, a.key); return `<div class="ach ${done ? 'done' : ''}" title="${esc(a.name)}${a.title ? ` · title ${a.title}` : ''}"><b>${esc(a.name)}</b><span>${done ? '✓ ' + rewardText(a.reward) : bar(Math.min(v, a.goal), a.goal)}</span>${a.title ? `<em>${esc(a.title)}</em>` : ''}</div>`; }).join('')}</div>`);
    return rows;
  },
  theater() {
    const found = LEGENDS.filter(l => S.found[l.id]).length;
    return [`<p class="lede" data-k="head">Every legend has its own film and backstory. ${found} of ${LEGENDS.length} drawn. Watch any of them, any time.</p>`,
      ...LEGENDS.map(l => { const a = AURA[l.id], f = !!S.found[a.id]; return `<div class="card leg ${f ? '' : 'unk'}" data-k="t-${a.id}">${thumb(a)}<div class="info"><b>${esc(a.name)}</b><span>1 in ${short(a.n)} · ${STYLE_NAME[l.style]}</span><span class="cnt say">"${esc(l.lines[0])}"</span></div><div class="btns"><span class="lvl">${f ? 'Drawn' : ''}</span><button data-act="film" data-id="${a.id}">Watch</button></div></div>`; })];
  },
  market() {
    const now = Date.now(), L = HARVEST.lantern, lit = lanternOn(), secs = lanternSecs();
    const card = (k, name, sub, btn, th = '') => `<div class="row" data-k="${k}">${th}<div class="info"><b>${name}</b>${sub}</div>${btn}</div>`;
    return [`<p class="lede" data-k="head">Harvest Market, open all year. You have <b class="tok">${fmt(S.tokens)} harvest tokens</b>. Every festival aura you draw pays tokens (Acorn 2 up to Cornucopia 15); the festival's daily gift adds ${HARVEST.giftTokens}.</p>`,
      card('m-lantern', 'Harvest Lantern', `<span>Festival auras can roll for ${Math.round(secs / 60)} minutes, even when the festival is over. Stacks up to ${L.max / 60} minutes.</span><span>${lit ? `Lit: ${left(S.lantern - now)} left` : eventOn() ? 'The festival is running, so festival auras already roll.' : 'Not lit'}</span>`,
        `<button data-act="lantern" ${S.mon >= L.mon && S.lantern - now <= (L.max - secs) * 1000 ? '' : 'disabled'}>${short(L.mon)} mon</button>`),
      card('m-basket', 'Harvest Basket', `<span>Charm: luck ×${CH.basket.mult} for ${CH.basket.secs / 60} min. Held ${S.charms.basket || 0}.</span>`,
        `<button data-act="buybasket" ${S.tokens >= HARVEST.basket ? '' : 'disabled'}>${HARVEST.basket} tokens</button>`),
      ...GEAR.filter(g => g.tokens).map(g => card(`m-${g.id}`, g.name, `<span>${g.slot} gear · luck +${g.luck}${g.speed ? `, draws ${Math.round(g.speed * 100)}% faster` : ''}</span>`,
        S.owned[g.id] ? `<button data-act="gear" data-id="${g.id}">${S.gear[g.slot] === g.id ? 'Take off' : 'Wear'}</button>` : `<button data-act="buygear" data-id="${g.id}" ${S.tokens >= g.tokens ? '' : 'disabled'}>${g.tokens} tokens</button>`)),
      ...EVA.map(a => card(`m-${a.id}`, esc(a.name), `<span>1 in ${fmt(a.n)} · held ×${fmt(S.inv[a.id] || 0)}</span>`,
        `<button data-act="buyaura" data-id="${a.id}" ${S.tokens >= HARVEST.auras[a.id] ? '' : 'disabled'}>${fmt(HARVEST.auras[a.id])} tokens</button>`, thumb(a))),
    ];
  },
  settings() {
    const st = S.set;
    return [`<p class="lede" data-k="head">Keys: Space draw · A auto · 1–9 tabs · Esc closes · \` opens the command bar.</p>`,
      `<div class="row" data-k="s-pop"><div class="info"><b>Popups</b><span>Name spins, full-screen reveal slips, legend films and rare-draw toasts. Off keeps drawing quiet.</span></div>${chk('popups', st.popups)}</div>`,
      `<div class="row" data-k="s-quiet"><div class="info"><b>Quiet auto-draw</b><span>No popups while auto-draw is on, popups again when you draw by hand.</span></div>${chk('autoQuiet', st.autoQuiet)}</div>`,
      `<div class="row" data-k="s-music"><div class="info"><b>Music</b><span>"yoiyami core theme" by Yoiyami (CC0). ${st.musicVol}%</span></div><div class="btns">${chk('music', st.music)}<input type="range" min="0" max="100" data-set="musicVol" value="${st.musicVol}"></div></div>`,
      `<div class="row" data-k="s-vol"><div class="info"><b>Sound effects</b><span>Draw shakes, ticks, reveal stingers and clicks. ${st.vol}%</span></div><div class="btns">${chk('sfx', !S.mute)}<input type="range" min="0" max="100" data-set="vol" value="${st.vol}"></div></div>`,
      `<div class="row" data-k="s-wear"><div class="info"><b>Auto-wear</b><span>Put on any aura rarer than the one you wear.</span></div>${chk('autoWear', st.autoWear)}</div>`,
      `<div class="row" data-k="s-cut"><div class="info"><b>Reveals</b><span>Name spins, slips and legend films. Click to skip any of them.</span></div>${sel('cut', st.cut, [['all', 'Always'], ['new', 'New auras only'], ['off', 'Off']])}</div>`,
      `<div class="row" data-k="s-stop"><div class="info"><b>Stop auto-draw</b><span>Turn auto off when you draw something at least this rare.</span></div>${sel('stopAt', st.stopAt, [[0, 'Never'], [1e3, '1 in 1K'], [1e4, '1 in 10K'], [1e5, '1 in 100K'], [1e6, '1 in 1M'], [1e7, '1 in 10M'], [1e8, '1 in 100M'], [1e9, '1 in 1B']])}</div>`,
      `<div class="row" data-k="s-new"><div class="info"><b>Stop on new auras</b><span>Turn auto off on any first-time aura.</span></div>${chk('stopNew', st.stopNew)}</div>`,
      `<div class="row" data-k="s-tour"><div class="info"><b>Shrine tour</b><span>Show the short guided tour again.</span></div><button data-act="tour">Restart tour</button></div>`,
      `<div class="row" data-k="s-save"><div class="info"><b>Save</b><span>Copy a save code to move to another browser, or paste one in.</span></div>
        <div class="btns"><button data-act="export">Export</button><button data-act="import">Import</button><button data-act="reset">Reset</button></div></div>`,
      `<div class="row" data-k="s-stats"><div class="info"><b>Stats</b><span>${fmt(S.rolls)} rolls · ${short(S.stats.monEarned)} mon earned · ${S.stats.visitors} visitors helped · rarest ${S.best ? `${esc(AURA[S.best].name)} (1 in ${fmt(AURA[S.best].n)})` : 'none yet'}${S.tainted ? ' · admin save (not posted to the board)' : ''}</span></div></div>`,
    ];
  },
};

function patch(el, rows) {
  const tmp = document.createElement('div'); tmp.innerHTML = rows.join('');
  const nk = [...tmp.children];
  if (el.children.length !== nk.length || [...el.children].some((c, i) => c.dataset.k !== nk[i].dataset.k)) { el.replaceChildren(...nk); return; }
  nk.forEach((n, i) => {
    const o = el.children[i]; if (o.outerHTML === n.outerHTML || o.contains(document.activeElement)) return;
    // keep the already-painted aura preview so cards don't flash when their count changes
    const oc = o.querySelector('canvas.thumb'), nc = n.querySelector('canvas.thumb');
    if (oc && nc && oc.dataset.a === nc.dataset.a && oc.dataset.u === nc.dataset.u) nc.replaceWith(oc);
    o.replaceWith(n);
  });
}

function renderStats() {
  const p = luckParts();
  $('#luck').textContent = '×' + short2(p.total);
  $('#rolls').textContent = fmt(S.rolls);
  $('#autowrap').hidden = !S.up.auto; $('#auto').checked = !!S.auto;
  $('#mute').textContent = S.mute ? 'SFX off' : 'SFX on';
  $('#musicbtn').textContent = S.set.music ? 'Music on' : 'Music off';
  $('#popbtn').textContent = S.set.popups ? 'Popups on' : 'Popups off';
  for (const b of ['#mute', '#musicbtn', '#popbtn']) $(b).classList.toggle('off', /off/.test($(b).textContent));
  const now = Date.now(), chips = [];
  if (S.title) chips.push(`<span class="ttl">${esc(S.title)}</span>`);
  if (S.dial && S.dial < p.max) chips.push(`<span>Dial ×${short2(p.base)}</span>`);
  if (drawN() > 1) chips.push(`<span>×${drawN()} per draw</span>`);
  for (const [id, u] of Object.entries(S.active)) if (u > now) chips.push(`<span>${CH[id].name} ${left(u - now)}</span>`);
  if (S.slip) chips.push(`<span>${CH[S.slip].name} ready</span>`);
  if (lanternOn()) chips.push(`<span>Harvest Lantern ${left(S.lantern - now)}</span>`);
  if (S.adminLuck > 1) chips.push(`<span class="hot">Admin luck ×${short2(S.adminLuck)}</span>`);
  if (S.up.fortune) { const iv = bellEvery(), l = iv - (S.rolls % iv); chips.push(`<span class="${l === 1 ? 'hot' : ''}">${l === 1 ? `Tenth bell ×${S.up.fortune + 1} next!` : `Bell in ${l}`}</span>`); }
  const eq = S.equipped ? AURA[S.equipped] : null;
  const html = (eq ? `<span class="eq">Wearing ${esc(eq.name)} · 1 in ${fmt(eq.n)}</span>` : '') + chips.join('');
  if ($('#buffs').innerHTML !== html) $('#buffs').innerHTML = html;
  renderWorld(); renderEvent(); renderRecent(); questsBadge();
}
function renderWorld() {
  const { ph, we, bi } = world(), sense = eff('sense'), att = eff('attune');
  const parts = [[ph.name, ph.tags, 1 + (ph.mult - 1) * (1 + sense), ph.left], ...(we.mult > 1 ? [[we.name, we.tags, 1 + (we.mult - 1) * (1 + sense), we.left]] : [[we.name, [], 1, we.left]]), [bi.name, bi.tags, 1 + (bi.mult - 1) * (1 + att), 0]];
  const html = `<span class="wl">${parts.map(([n, , , l]) => `<b>${n}</b>${l ? ` <small>${left(l)}</small>` : ''}`).join(' · ')}</span><span class="wb">${parts.filter(x => x[1].length).map(([, t, m]) => `${t.join(', ')} ×${short2(m)}`).join(' · ')}</span>`;
  if ($('#world').innerHTML !== html) $('#world').innerHTML = html;
}
const clock = ms => { ms = Math.max(0, ms); const d = Math.floor(ms / 864e5), p = n => String(n).padStart(2, '0'); return `${d ? d + 'd ' : ''}${p(Math.floor(ms / 36e5) % 24)}:${p(Math.floor(ms / 6e4) % 60)}:${p(Math.floor(ms / 1e3) % 60)}`; };
function renderEvent() {
  const el = $('#event'), on = eventOn();
  el.hidden = !on; if (!on) return;
  if (!el.firstChild) el.innerHTML = `<div class="evinfo"><b class="evtitle"></b><span class="evsub"></span></div>
    <div class="evclock"><small class="evlbl"></small><span class="evtime"></span></div><button data-act="gift"></button>`;
  const now = Date.now(), found = EVA.filter(a => S.found[a.id]).length, claimed = S.gift === today();
  const isDay = now >= EVENT.day && now < EVENT.day + 864e5, forced = now >= EVENT.end || now < EVENT.start;
  const set = (q, v) => { const n = el.querySelector(q); if (n.textContent !== v) n.textContent = v; };
  set('.evtitle', (isDay ? 'Happy Thanksgiving! ' : '') + EVENT.name);
  set('.evsub', `${forced ? '' : `Ends ${new Date(EVENT.end - 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · `}Festival luck ×${EVENT.luck} · ${found}/${EVA.length} harvest auras`);
  if (forced) { set('.evlbl', 'Forced on'); set('.evtime', 'admin'); }
  else if (now < EVENT.day) { set('.evlbl', 'Thanksgiving in'); set('.evtime', clock(EVENT.day - now)); }
  else if (isDay) { set('.evlbl', 'Today is Thanksgiving! Ends in'); set('.evtime', clock(EVENT.end - now)); }
  else { set('.evlbl', 'Festival ends in'); set('.evtime', clock(EVENT.end - now)); }
  const b = el.querySelector('button'); b.disabled = claimed; set('button', claimed ? 'Gift claimed' : "Today's gift");
}
function renderRecent() {
  const html = S.log.slice(0, 12).map(l => { const a = AURA[l.id]; return a ? `<li><span class="nm2">${esc(a.name)}${l.nw ? ' <i>new</i>' : ''}</span><span>1 in ${short(a.n)} · #${fmt(l.r)}</span></li>` : ''; }).join('') || '<li class="empty">Rare draws show up here.</li>';
  if ($('#recent').innerHTML !== html) $('#recent').innerHTML = html;
}

let lbTimer = 0, listT = 0, listQueued = false;
function refresh() {
  renderStats();
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('on', b.dataset.tab === tab);
  $('#tab-list').hidden = tab === 'board'; $('#tab-board').hidden = tab !== 'board'; $('#colbar').hidden = tab !== 'index';
  if (tab === 'board') return;
  const now = performance.now();
  if (now - listT > 300) { listT = now; patch($('#tab-list'), VIEWS[tab]()); }
  else if (!listQueued) { listQueued = true; setTimeout(() => { listQueued = false; refresh(); }, 320 - (now - listT)); }
}
function setTab(t) {
  tab = t; listT = 0; $('#tab-list').replaceChildren(); $('#tab-list').scrollTop = 0; refresh();
  if (t === 'board') loadBoard();
}

async function loadBoard() {
  $('#lbname').value = S.name || '';
  $('#lbme').textContent = S.tainted ? 'This save used admin commands, so it is not posted.' : S.best ? `Your rarest: ${AURA[S.best].name} (1 in ${fmt(AURA[S.best].n)}) · ${fmt(S.rolls)} rolls` : 'Draw a fortune first.';
  try {
    const d = await (await fetch('/api/top')).json();
    const list = (rows, by) => rows.length ? rows.map((p, i) => `<li class="${p.name === S.name && S.name ? 'me' : ''}"><span class="rk">${i + 1}</span><span class="who">${esc(p.name)}${p.title ? ` <em>${esc(p.title)}</em>` : ''}</span><span class="val">${by === 'best' ? `${esc(AURA[p.best]?.name || p.best)} · 1 in ${short(p.n)}` : `${fmt(p.rolls)} rolls`}</span></li>`).join('') : '<li class="empty">No one yet. The board started fresh with the 1,000-aura update.</li>';
    $('#lbbest').innerHTML = list(d.best || [], 'best');
    $('#lbrolls').innerHTML = list(d.rolls || [], 'rolls');
  } catch { $('#lbbest').innerHTML = '<li class="empty">Board is offline.</li>'; $('#lbrolls').innerHTML = ''; }
}

let toastT = 0;
function toast(msg, cls = '') { const t = $('#toast'); t.textContent = msg; t.className = `toast show ${cls}`; clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), cls === 'gold' ? 3600 : 2400); }

// ---------- actions
function act(kind, id) {
  const now = Date.now();
  if (kind === 'wear') { if (S.inv[id] > 0) { S.equipped = id; sfx.click(); } }
  else if (kind === 'buy') {
    const u = UPGRADES.find(x => x.id === id), l = S.up[id], cost = disc(u.cost(l));
    if (l >= u.max || S.mon < cost) { sfx.deny(); return; }
    S.mon -= cost; S.up[id]++; sfx.buy(); dq('buy', 1);
    if (id === 'auto') { S.auto = true; toast('The shrine helper will draw for you. Toggle it under the button (or press A).'); }
    if (id === 'multi' && (!S.drawSize || S.drawSize === l + 1)) S.drawSize = null;
  } else if (kind === 'line') {
    const ln = LINE[id], l = lv(id), cost = lineCost(ln, l, eff('bargain'));
    if (l >= ln.max || S.mon < cost) { sfx.deny(); return; }
    S.mon -= cost; S.lines[id] = l + 1; sfx.buy(); dq('buy', 1); boostKey = '';
  } else if (kind === 'unlock') {
    const u = UNLOCKS.find(x => x.id === id), c = disc(u.cost); if (S.unl[id] || S.mon < c) { sfx.deny(); return; }
    S.mon -= c; S.unl[id] = true; sfx.craft(); dq('buy', 1); toast(`${u.name} unlocked.`);
  } else if (kind === 'pet') {
    const pt = PET[id];
    if (!S.pets[id]) { const c = disc(pt.cost); if (S.mon < c) { sfx.deny(); return; } S.mon -= c; S.pets[id] = true; dq('buy', 1); toast(`${pt.name} adopted. ${pt.desc}.`); sfx.craft(); }
    else sfx.click();
    S.pet = id;
  } else if (kind === 'biome') {
    const b = BIOME[id];
    if (!S.biomes[id]) { const c = disc(b.cost); if (S.mon < c) { sfx.deny(); return; } S.mon -= c; S.biomes[id] = true; dq('buy', 1); toast(`${b.name} unlocked.`); sfx.craft(); }
    else sfx.click();
    S.biome = id; boostKey = '';
  } else if (kind === 'charm') {
    const c = CH[id]; if (!canPay(c.need, c.mon)) { sfx.deny(); return; }
    pay(c.need, c.mon); S.charms[id] = (S.charms[id] || 0) + 1; S.stats.crafted++; dq('craft', 1); sfx.craft(); toast(`Folded a ${c.name}.`);
  } else if (kind === 'use') {
    if (!useCharm(id)) return;
  } else if (kind === 'forge') {
    const g = GR[id]; if (S.owned[id] || g.tokens || !canPay(g.need, g.mon)) { sfx.deny(); return; }
    pay(g.need, g.mon); S.owned[id] = true; S.gear[g.slot] = id; sfx.craft(); toast(`Crafted ${g.name} and put it on.`);
  } else if (kind === 'gear') {
    const g = GR[id]; S.gear[g.slot] = S.gear[g.slot] === id ? null : id; sfx.click();
  } else if (kind === 'ring') { S.gear.ring = S.gear.ring === id ? null : id; sfx.click(); }
  else if (kind === 'tab') { setTab(id); return; }
  else if (kind === 'page') { ui.page = Math.max(0, ui.page + +id); $('#tab-list').scrollTop = 0; listT = 0; refresh(); return; }
  else if (kind === 'film') { const a = AURA[id]; if (a?.legend) film(a); return; }
  else if (kind === 'lantern') {
    const L = HARVEST.lantern, secs = lanternSecs();
    if (S.mon < L.mon || S.lantern - now > (L.max - secs) * 1000) { sfx.deny(); return; }
    S.mon -= L.mon; S.lantern = Math.max(S.lantern, now) + secs * 1000; sfx.craft(); toast('The Harvest Lantern is lit: festival auras can roll.');
  } else if (kind === 'buyaura') {
    const price = HARVEST.auras[id]; if (!price || S.tokens < price) { sfx.deny(); return; }
    S.tokens -= price; S.inv[id] = (S.inv[id] || 0) + 1; if (!S.found[id]) S.found[id] = S.rolls || 1; sfx.buy(); toast(`Bought ${AURA[id].name}.`);
  } else if (kind === 'buybasket') {
    if (S.tokens < HARVEST.basket) { sfx.deny(); return; }
    S.tokens -= HARVEST.basket; S.charms.basket = (S.charms.basket || 0) + 1; sfx.buy(); toast('Bought a Harvest Basket.');
  } else if (kind === 'buygear') {
    const g = GR[id]; if (!g?.tokens || S.owned[id] || S.tokens < g.tokens) { sfx.deny(); return; }
    S.tokens -= g.tokens; S.owned[id] = true; S.gear[g.slot] = id; sfx.craft(); toast(`Bought ${g.name} and put it on.`);
  } else if (kind === 'dialmax') { S.dial = null; sfx.click(); }
  else if (kind === 'gift') {
    if (!eventOn() || S.gift === today()) return;
    S.gift = today(); S.mon += EVENT.gift.mon; S.tokens += HARVEST.giftTokens; S.charms[EVENT.gift.charm] = (S.charms[EVENT.gift.charm] || 0) + 1;
    sfx.craft(); toast(`Harvest gift: ${EVENT.gift.mon} mon, ${HARVEST.giftTokens} harvest tokens and a ${CH[EVENT.gift.charm].name}.`);
  } else if (kind === 'streak') {
    updateStreak(); if (S.streak.claimed === today()) return;
    S.streak.claimed = today(); const txt = grant(streakReward(S.streak.days, eff('basket'), bestN()));
    sfx.streak?.(); toast(`Day ${S.streak.days} login bonus: ${txt}`, 'gold'); $('#daymodal').hidden = true;
  } else if (kind === 'visit') {
    const v = S.visitor; if (!v || !visitorReady()) { sfx.deny(); return; }
    if (v.req.type === 'bring') { S.inv[v.req.aura] -= v.req.goal; if (S.equipped && !(S.inv[S.equipped] > 0)) S.equipped = bestOwned(); }
    if (v.req.type === 'mon') S.mon -= v.req.goal;
    const txt = grant(v.reward, qMult()); S.stats.visitors++; dq('visitor', 1);
    vis.leaving = v.kind; S.visitor = null; S.nextVisitor = now + (3 + Math.random() * 2) * 6e4;
    sfx.quest?.(); toast(`${v.name} thanks you: ${txt}`, 'gold');
  } else if (kind === 'daily') {
    const d = S.dailies?.list[+id]; if (!d || !d.done || d.claimed) return;
    d.claimed = true; S.stats.dailies++; const txt = grant(d.reward, qMult()); sfx.quest?.(); toast(`Daily quest: ${txt}`, 'gold');
  } else if (kind === 'dailybonus') {
    const D = S.dailies; if (!D || D.bonus || !D.list.every(d => d.claimed)) return;
    D.bonus = true; const txt = grant(DAILY_BONUS, qMult()); sfx.achieve?.(); toast(`All daily quests done: ${txt}`, 'gold');
  } else if (kind === 'story') {
    if (!storyReady()) return;
    const c = STORY[S.story]; const txt = grant(c.reward, qMult()); S.story++;
    sfx.achieve?.(); toast(`Chapter complete: ${c.title} · ${txt}`, 'gold');
  } else if (kind === 'tour') { S.tut = 0; setTab('index'); }
  else if (kind === 'export') {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
    navigator.clipboard?.writeText(code).then(() => toast('Save code copied.'), () => prompt('Copy your save code:', code));
  } else if (kind === 'import') {
    const code = prompt('Paste a save code. This replaces your current save.'); if (!code) return;
    try { S = load(decodeURIComponent(escape(atob(code.trim())))); save(); toast('Save loaded.'); setMuted(S.mute); setVolume(S.set.vol / 100); syncMusic(); } catch { toast('That code did not work.'); return; }
  } else if (kind === 'reset') {
    if (!confirm('Reset everything? Your auras, mon and upgrades will be gone.')) return;
    const keep = { pid: S.pid, name: S.name }; S = Object.assign(fresh(), keep); save(); toast('Fresh start.');
  }
  checkAch(); save(); refresh(); renderTut();
}
function useCharm(id, quiet) {
  const c = CH[id]; if (!(S.charms[id] > 0)) return false;
  if (c.once) { if (S.slip) { if (!quiet) { toast('A slip is already waiting for your next roll.'); sfx.deny(); } return false; } S.slip = id; }
  else { const now = Date.now(); S.active[id] = Math.min(Math.max(S.active[id] || 0, now) + charmSecs(c) * 1000, now + 30 * 60 * 1000); }
  S.charms[id]--; S.stats.used++; dq('use', 1); if (!quiet) sfx.craft();
  return true;
}
function setSetting(key, el) {
  const v = el.type === 'checkbox' ? el.checked : el.value;
  if (key === 'dial') { const n = parseFloat(v); S.dial = n >= 1 && n < baseMax() ? n : null; if (n >= baseMax()) toast(`Your max is ×${short2(baseMax())}; dial set to max.`); }
  else if (key === 'drawSize') { const n = Math.round(+v); S.drawSize = n >= 1 && n < maxDraw() ? n : null; }
  else if (key === 'vol') { S.set.vol = +v; setVolume(+v / 100); }
  else if (key === 'stopAt') S.set.stopAt = +v;
  else if (key === 'sfx') { S.mute = !v; setMuted(S.mute); }
  else if (key === 'musicVol') { S.set.musicVol = +v; syncMusic(); }
  else if (key === 'music') { S.set.music = v; syncMusic(); }
  else if (key === 'title') { S.title = S.titles.includes(v) ? v : ''; postScore(); }
  else S.set[key] = v;
  save(); refresh();
}

// buttons may be re-rendered between press and release, so act on press (and on keyboard click)
for (const host of [$('#panel'), $('#event'), $('#daymodal')]) {
  host.addEventListener('pointerdown', e => { const b = e.target.closest('button[data-act]'); if (b && !b.disabled && e.button === 0) { e.preventDefault(); act(b.dataset.act, b.dataset.id); } });
  host.addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (b && e.detail === 0 && !b.disabled) act(b.dataset.act, b.dataset.id); });
}
$('#panel').addEventListener('change', e => { const el = e.target.closest('[data-set]'); if (el) setSetting(el.dataset.set, el); });
$('#panel').addEventListener('input', e => {
  const el = e.target.closest('[data-set="vol"], [data-set="musicVol"]'); if (!el) return;
  if (el.dataset.set === 'vol') setVolume(+el.value / 100); else { S.set.musicVol = +el.value; syncMusic(); }
});
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { sfx.click(); setTab(b.dataset.tab); renderTut(); } });
$('#q').addEventListener('input', e => { ui.q = e.target.value; ui.page = 0; listT = 0; refresh(); });
$('#flt').addEventListener('change', e => { ui.f = e.target.value; ui.page = 0; listT = 0; refresh(); });
$('#roll').addEventListener('pointerdown', e => { if (e.button === 0) { e.preventDefault(); roll(); } });
$('#roll').addEventListener('click', e => { if (e.detail === 0) roll(); });
$('#auto').addEventListener('change', e => { S.auto = e.target.checked; save(); });
$('#mute').addEventListener('click', () => { S.mute = !S.mute; setMuted(S.mute); save(); refresh(); });
$('#musicbtn').addEventListener('click', () => { S.set.music = !S.set.music; syncMusic(); save(); refresh(); });
$('#popbtn').addEventListener('click', () => { S.set.popups = !S.set.popups; save(); refresh(); toast(S.set.popups ? 'Popups on.' : 'Popups off: draws land quietly.'); });
$('#cut').addEventListener('pointerdown', () => skipCut?.());
$('#film').addEventListener('pointerdown', () => skipFilm());
$('#stage').addEventListener('click', () => { if (S.visitor) setTab('quests'); });
$('#daymodal').addEventListener('pointerdown', e => { if (e.target.id === 'daymodal') $('#daymodal').hidden = true; });
addEventListener('keydown', e => {
  if (filmPlaying()) { if (e.code === 'Space' || e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); skipFilm(); } return; }
  if (e.key === '`' || (e.key === '/' && !e.target.closest('input, textarea, select'))) { e.preventDefault(); openConsole(); return; }
  if (e.key === 'Escape') { if (!$('#console').hidden) closeConsole(); else if (!$('#daymodal').hidden) $('#daymodal').hidden = true; else skipCut?.(); return; }
  if (e.target.closest('input, textarea, select')) return;
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (skipCut) skipCut(); else if (!e.repeat || S.up.speed > 0) roll(); }
  if (e.code === 'KeyA' && S.up.auto) { S.auto = !S.auto; save(); renderStats(); }
  const n = +e.key; if (n >= 1 && n <= 9) setTab(Object.keys(TABS)[n - 1]);
});
$('#lbform').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('#lbname').value.trim().replace(/\s+/g, ' ').slice(0, 16);
  if (!n) return;
  S.name = n; save();
  if (S.tainted) { toast('This save used admin commands, so it is not posted.'); return; }
  if (!S.best) { toast('Draw a fortune first, then post.'); return; }
  postScore().then(loadBoard); toast('Posted to the board.');
});

// ---------- guided tour for new players
const TUT = [
  { el: '#roll', text: 'Press Draw (or Space) to pull your first fortune.', done: () => S.rolls > 0 },
  { el: '#slip', text: 'Every draw gives an aura and mon. Rarer auras get bigger reveals, and the 50 legends (1 in a billion or rarer) each have their own film.' },
  { el: '[data-tab="shrine"]', text: 'Spend mon in Offerings. Start with Prayer: it raises your luck.', done: () => S.up.luck > 0 },
  { el: '[data-tab="quests"]', text: "Visitors, daily quests, the shrine's story and achievements all give buffs. A red dot means something is ready." },
  { el: '#world', text: 'Time of day, weather and your backdrop make some auras likelier. This corner shows what is boosted right now.' },
];
function renderTut() {
  const tip = $('#tip');
  if (S.tut >= TUT.length || filmPlaying()) { tip.hidden = true; return; }
  const s = TUT[S.tut];
  if (s.done?.()) { S.tut++; save(); return renderTut(); }
  const el = $(s.el); if (!el) { tip.hidden = true; return; }
  tip.hidden = false;
  tip.querySelector('p').textContent = s.text;
  tip.querySelector('[data-tut="next"]').hidden = !!s.done;
  tip.querySelector('.tstep').textContent = `${S.tut + 1}/${TUT.length}`;
  const r = el.getBoundingClientRect(), tw = Math.min(300, innerWidth - 32), th = tip.offsetHeight;
  const below = r.bottom + th + 16 < innerHeight;
  tip.style.width = tw + 'px';
  tip.style.left = Math.max(16, Math.min(innerWidth - tw - 16, r.left + r.width / 2 - tw / 2)) + scrollX + 'px';
  tip.style.top = (below ? r.bottom + 10 : r.top - th - 10) + scrollY + 'px';
  tip.classList.toggle('above', !below);
}
$('#tip').addEventListener('click', e => { const b = e.target.closest('[data-tut]'); if (!b) return; S.tut = b.dataset.tut === 'skip' ? TUT.length : S.tut + 1; save(); renderTut(); });
addEventListener('resize', renderTut);

// ---------- admin command bar
const ADM = 'lucklight.admin';
let adminKey = null; try { adminKey = localStorage.getItem(ADM); } catch {}
const out = (msg, cls = '') => { const d = document.createElement('div'); d.className = cls; d.textContent = msg; $('#conlog').append(d); $('#conlog').scrollTop = 1e9; };
function openConsole() { $('#console').hidden = false; $('#conin').focus(); if (!$('#conlog').childElementCount) out(adminKey ? 'Admin unlocked. Start typing for suggestions, or type help.' : 'Type: admin <key>'); suggest(); }
function closeConsole() { $('#console').hidden = true; $('#conin').blur(); }
async function adminApi(body) {
  const r = await fetch('/api/admin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: adminKey, ...body }) });
  return r.json().catch(() => ({ error: `HTTP ${r.status}` }));
}
const findAura = s => { s = s.trim().toLowerCase(); return AURA[s] || AURAS.find(a => a.name.toLowerCase() === s) || AURAS.find(a => a.id.startsWith(s.replace(/\s+/g, '-')) || a.name.toLowerCase().startsWith(s)); };
const num = s => { const m = String(s).trim().toLowerCase().match(/^([\d.]+)\s*([kmbt]?)$/); return m ? +m[1] * ({ k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[m[2]] || 1) : NaN; };
const CMDS = [
  ['help', '', 'list every command'], ['give', '<aura> [count]', 'add auras by name or id', 'aura'],
  ['mon', '<amount>', 'add mon (1.5m, 2b work)'], ['setmon', '<amount>', 'set mon exactly'],
  ['tokens', '<amount>', 'add harvest tokens'], ['lantern', '<minutes>', 'light the Harvest Lantern'],
  ['luck', '<multiplier> | off', 'extra admin luck', 'luck'], ['roll', '<count>', 'roll up to 1m auras instantly'],
  ['up', '<upgrade> <level>', 'set a shrine upgrade level', 'up'], ['offer', 'max', 'max all 17 upgrade lines and unlocks', 'offer'], ['maxall', '', 'max every upgrade and line'],
  ['charm', '<charm> [count]', 'add charms', 'charm'], ['gear', 'all', 'own every gear piece', 'gear'],
  ['pets', 'all', 'adopt every pet', 'all'], ['biomes', 'all', 'unlock every backdrop', 'all'], ['perm', '<luck %>', 'add permanent luck blessing'],
  ['unlock', 'all', 'find every aura once', 'unlock'], ['wear', '<aura>', 'wear an aura you hold', 'aura'],
  ['reveal', '<aura>', 'preview its reveal', 'aura'], ['film', '<legend>', 'play a legend film', 'legend'],
  ['visitor', '', 'bring a visitor now'], ['weather', '<clear|rain|snow|fog|storm|sakura|auto>', 'force the weather', 'weather'], ['phase', '<dusk|night|dawn|day|auto>', 'force the time of day', 'phase'],
  ['event', 'on | off | auto', 'force the festival', 'event'], ['gift', 'reset', "reclaim today's gift", 'gift'], ['streak', '<days>', 'set the login streak'],
  ['board', 'remove <name>', 'delete a board entry', 'board'], ['untaint', '', 'allow board posts again'], ['wipe', 'confirm', 'reset this save', 'wipe'], ['logout', '', 'forget the admin key'],
];
const HELP = CMDS.map(([c, a, d]) => `${(c + ' ' + a).padEnd(30)}${d}`);
const ARGS = {
  aura: () => AURAS.map(a => a.name), legend: () => LEGENDS.map(l => AURA[l.id].name), luck: () => ['off', '10', '100', '1000'], up: () => UPGRADES.map(u => u.id),
  charm: () => CHARMS.map(c => c.id), gear: () => ['all'], unlock: () => ['all'], all: () => ['all'], offer: () => ['max'], event: () => ['on', 'off', 'auto'],
  gift: () => ['reset'], board: () => ['remove'], wipe: () => ['confirm'], weather: () => [...WEATHERS.map(w => w.id), 'auto'], phase: () => [...PHASES.map(p => p.id), 'auto'],
};
let sugs = [], sugI = 0;
function suggest() {
  const v = $('#conin').value, box = $('#consug');
  if (!adminKey) sugs = [{ fill: 'admin ', label: 'admin <key>', d: 'unlock admin commands (key is in .admin-key)' }];
  else if (!v.includes(' ')) sugs = CMDS.filter(([c]) => c.startsWith(v.toLowerCase())).map(([c, a, d]) => ({ fill: c + (a ? ' ' : ''), label: `${c} ${a}`, d }));
  else {
    const [c, ...rest] = v.split(' '), arg = rest.join(' ').toLowerCase(), def = CMDS.find(x => x[0] === c.toLowerCase());
    sugs = def?.[3] ? ARGS[def[3]]().filter(x => x.toLowerCase().startsWith(arg) && x.toLowerCase() !== arg).slice(0, 8).map(x => ({ fill: `${c} ${x}${def[3] === 'aura' && c === 'give' ? ' ' : ''}`, label: `${c} ${x}`, d: def[2] }))
      : def ? [{ fill: v, label: `${def[0]} ${def[1]}`, d: def[2] }] : [];
  }
  sugs = sugs.slice(0, 8); sugI = Math.min(sugI, Math.max(0, sugs.length - 1));
  box.innerHTML = sugs.map((x, i) => `<div class="${i === sugI ? 'on' : ''}" data-i="${i}"><b>${esc(x.label)}</b><span>${esc(x.d)}</span></div>`).join('');
  box.hidden = !sugs.length;
}
const takeSug = i => { if (!sugs[i]) return; $('#conin').value = sugs[i].fill; sugI = 0; suggest(); $('#conin').focus(); };
const TAINT = new Set(['give', 'mon', 'setmon', 'tokens', 'luck', 'up', 'offer', 'maxall', 'charm', 'gear', 'pets', 'biomes', 'perm', 'unlock', 'streak']);
async function command(line) {
  const [cmd, ...args] = line.trim().split(/\s+/), rest = args.join(' ');
  if (!cmd) return;
  out('> ' + line, 'me');
  if (cmd === 'admin') {
    adminKey = rest; const r = await adminApi({ cmd: 'check' }).catch(() => ({}));
    if (r.ok) { try { localStorage.setItem(ADM, adminKey); } catch {} out('Admin unlocked. Type help.', 'ok'); }
    else { adminKey = null; out('Wrong key.', 'err'); }
    return;
  }
  if (!adminKey) return out('Locked. Type: admin <key>', 'err');
  if (TAINT.has(cmd) && !S.tainted) { S.tainted = true; out('This save is now marked admin and will not post to the board (untaint to undo).'); }
  switch (cmd) {
    case 'help': HELP.forEach(h => out(h)); break;
    case 'give': {
      const m = rest.match(/^(.*?)(?:\s+([\d.]+[kmbt]?))?$/i), a = findAura(m[1]), n = m[2] ? num(m[2]) : 1;
      if (!a) return out(`No aura "${m[1]}".`, 'err');
      S.inv[a.id] = (S.inv[a.id] || 0) + n; if (!S.found[a.id]) S.found[a.id] = S.rolls || 1;
      if (!S.best || a.n > AURA[S.best].n) S.best = a.id;
      out(`Gave ${fmt(n)} × ${a.name}.`, 'ok'); break;
    }
    case 'mon': case 'setmon': { const n = num(rest); if (isNaN(n)) return out('Usage: mon <n>', 'err'); S.mon = cmd === 'mon' ? S.mon + n : n; out(`Mon: ${fmt(S.mon)}`, 'ok'); break; }
    case 'luck': { if (rest === 'off') S.adminLuck = 1; else { const n = num(rest); if (!(n > 0)) return out('Usage: luck <n> | luck off', 'err'); S.adminLuck = n; } out(`Admin luck ×${short2(S.adminLuck)}`, 'ok'); break; }
    case 'roll': {
      const n = Math.min(1e6, Math.floor(num(rest))); if (!(n > 0)) return out('Usage: roll <n>', 'err');
      let best = null, earned = 0, nw = 0;
      for (let done = 0; done < n;) { const k = Math.min(1000, n - done), r = drawBatch(k); done += k; earned += r.earned; nw += r.fresh.length; if (!best || r.best.n > best.n) best = r.best; }
      out(`Rolled ${fmt(n)}: best ${best.name} (1 in ${fmt(best.n)}), ${nw} new, +${fmt(earned)} mon.`, 'ok');
      if (!S.tainted) postScore(); break;
    }
    case 'up': {
      const u = UPGRADES.find(x => x.id === args[0]), l = Math.floor(num(args[1]));
      if (!u || isNaN(l)) return out('Usage: up <luck|speed|fortune|multi|auto> <level>', 'err');
      S.up[u.id] = Math.max(0, Math.min(u.max, l)); out(`${u.name} Lv ${S.up[u.id]}`, 'ok'); break;
    }
    case 'offer': LINES.forEach(l => S.lines[l.id] = l.max); UNLOCKS.forEach(u => S.unl[u.id] = true); boostKey = ''; out('All 17 upgrade lines maxed, unlocks owned.', 'ok'); break;
    case 'maxall': UPGRADES.forEach(u => S.up[u.id] = u.max); LINES.forEach(l => S.lines[l.id] = l.max); UNLOCKS.forEach(u => S.unl[u.id] = true); boostKey = ''; out('Every upgrade and line maxed.', 'ok'); break;
    case 'charm': { const c = CH[args[0]], n = args[1] ? num(args[1]) : 1; if (!c) return out(`Charms: ${CHARMS.map(c => c.id).join(' ')}`, 'err'); S.charms[c.id] = (S.charms[c.id] || 0) + n; out(`+${n} ${c.name}`, 'ok'); break; }
    case 'gear': GEAR.forEach(g => S.owned[g.id] = true); out('All gear owned.', 'ok'); break;
    case 'pets': PETS.forEach(p => S.pets[p.id] = true); S.pet ||= 'fox'; out('Every pet adopted.', 'ok'); break;
    case 'biomes': BIOMES.forEach(b => S.biomes[b.id] = true); out('Every backdrop unlocked.', 'ok'); break;
    case 'perm': { const n = num(rest); if (isNaN(n)) return out('Usage: perm <luck %>', 'err'); S.perm.luck += n; out(`Blessings: +${S.perm.luck}% luck`, 'ok'); break; }
    case 'unlock': AURAS.forEach(a => { if (!S.found[a.id]) { S.found[a.id] = S.rolls || 1; S.inv[a.id] = (S.inv[a.id] || 0) + 1; } }); S.best = 'lucklight'; out(`Found all ${AURAS.length} auras.`, 'ok'); break;
    case 'wear': { const a = findAura(rest); if (!a || !(S.inv[a.id] > 0)) return out('You do not hold that aura (give it first).', 'err'); S.equipped = a.id; out(`Wearing ${a.name}.`, 'ok'); break; }
    case 'reveal': { const a = findAura(rest); if (!a) return out('No such aura.', 'err'); closeConsole(); if (a.legend) { await film(a); break; } const t = tierOf(a.n); sfx.result(t, AURAS.indexOf(a)); await cutscene(a, Math.max(2, t), false); break; }
    case 'film': { const a = findAura(rest); if (!a?.legend) return out('That is not a legend. Try: film lucklight', 'err'); closeConsole(); await film(a); break; }
    case 'visitor': S.visitor = null; S.nextVisitor = 0; S.rolls = Math.max(S.rolls, 20); tickVisitor(); out(`${S.visitor?.name} arrived.`, 'ok'); break;
    case 'weather': { S.wForce = WEATHERS.some(w => w.id === rest) ? rest : null; boostKey = ''; out(`Weather: ${world().we.name}${S.wForce ? ' (forced)' : ''}`, 'ok'); break; }
    case 'phase': { S.pForce = PHASES.some(p => p.id === rest) ? rest : null; boostKey = ''; out(`Time: ${world().ph.name}${S.pForce ? ' (forced)' : ''}`, 'ok'); break; }
    case 'event': { S.evForce = rest === 'on' ? 'on' : rest === 'off' ? 'off' : null; out(`Festival ${eventOn() ? 'on' : 'off'} (${S.evForce || 'auto'}).`, 'ok'); break; }
    case 'gift': S.gift = ''; S.streak.claimed = ''; out('Festival gift and login bonus can be claimed again.', 'ok'); break;
    case 'streak': { const n = Math.floor(num(rest)); if (!(n >= 1)) return out('Usage: streak <days>', 'err'); S.streak.days = n; S.streak.last = today(); out(`Streak: day ${n}`, 'ok'); break; }
    case 'board': {
      if (args[0] !== 'remove' || !args[1]) return out('Usage: board remove <name>', 'err');
      const r = await adminApi({ cmd: 'remove', name: args.slice(1).join(' ') });
      out(r.ok ? `Removed ${r.removed} entr${r.removed === 1 ? 'y' : 'ies'}.` : `Failed: ${r.error}`, r.ok ? 'ok' : 'err'); if (tab === 'board') loadBoard(); break;
    }
    case 'tokens': { const n = num(rest); if (isNaN(n)) return out('Usage: tokens <amount>', 'err'); S.tokens += n; out(`Harvest tokens: ${fmt(S.tokens)}`, 'ok'); break; }
    case 'lantern': { const m = num(rest || '5'); if (!(m > 0)) return out('Usage: lantern <minutes>', 'err'); S.lantern = Math.max(S.lantern, Date.now()) + m * 6e4; out(`Harvest Lantern lit for ${left(S.lantern - Date.now())}.`, 'ok'); break; }
    case 'untaint': S.tainted = false; out('Board posts allowed again.', 'ok'); break;
    case 'wipe': if (rest !== 'confirm') return out('Type: wipe confirm', 'err'); S = Object.assign(fresh(), { pid: S.pid, name: S.name }); out('Save wiped.', 'ok'); break;
    case 'logout': adminKey = null; try { localStorage.removeItem(ADM); } catch {} out('Admin key forgotten.', 'ok'); break;
    default: out(`Unknown command "${cmd}". Type help.`, 'err');
  }
  checkAch(); save(); refresh();
}
$('#conform').addEventListener('submit', e => { e.preventDefault(); const v = $('#conin').value; $('#conin').value = ''; sugI = 0; command(v).then(suggest); });
$('#conin').addEventListener('input', () => { sugI = 0; suggest(); });
$('#conin').addEventListener('keydown', e => {
  if (e.key === 'Tab') { e.preventDefault(); takeSug(sugI); }
  else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && sugs.length) { e.preventDefault(); sugI = (sugI + (e.key === 'ArrowDown' ? 1 : sugs.length - 1)) % sugs.length; suggest(); }
});
$('#consug').addEventListener('pointerdown', e => { const d = e.target.closest('[data-i]'); if (d) { e.preventDefault(); takeSug(+d.dataset.i); } });

// ---------- loop
const stage = $('#stage').getContext('2d'), cutCtx = $('#cutcv').getContext('2d');
let lastThumb = 0, lastSec = 0, lastT = 0, dispMon = S.mon;
function frame(now) {
  const t = now / 1000, dt = Math.min(0.1, t - lastT); lastT = t;
  const { ph, we } = world();
  // visitors walk in from the right and out again
  if (S.visitor) { if (vis.x > 118) vis.x = Math.max(118, vis.x - 22 * dt); }
  else if (vis.leaving) { vis.x += 26 * dt; if (vis.x > 190) vis.leaving = null; }
  const vk = S.visitor?.kind || vis.leaving;
  drawStage(stage, S.equipped ? AURA[S.equipped] : null, t, {
    ev: harvestOn(), biome: S.biome, phase: ph.id, weather: we.id, pet: S.pet,
    visitor: vk ? { kind: vk, x: vis.x, walking: !S.visitor || vis.x > 118, waiting: !!S.visitor } : null,
  });
  if (S.auto && S.up.auto && !revealing && !filmPlaying() && now >= readyAt) roll();
  const cd = Math.max(1, readyAt - rollStart), p = Math.min(1, (now - rollStart) / cd);
  $('#rollbar').style.transform = `scaleX(${revealing ? 0 : p})`;
  dispMon += (S.mon - dispMon) * Math.min(1, dt * 10); if (Math.abs(S.mon - dispMon) < 1) dispMon = S.mon;
  const ms = short(dispMon); if ($('#mon').textContent !== ms) $('#mon').textContent = ms;
  if (cutAura) drawThumb(cutCtx, cutAura, t);
  if ((tab === 'index' || tab === 'market' || tab === 'theater') && now - lastThumb > 66) {
    lastThumb = now;
    const lr = $('#tab-list').getBoundingClientRect(), top = Math.max(lr.top, 0), bot = Math.min(lr.bottom, innerHeight);
    for (const cv of document.querySelectorAll('canvas.thumb')) { const r = cv.getBoundingClientRect(); if (r.bottom > top && r.top < bot) drawThumb(cv.getContext('2d'), AURA[cv.dataset.a], t, cv.dataset.u === '1'); }
  }
  if (now - lastSec > 1000) {
    lastSec = now;
    const nowMs = Date.now();
    // Charm Helper: relight timed charms that just ran out
    for (const [id, until] of Object.entries(S.active)) if (until <= nowMs) { delete S.active[id]; if (S.unl.helper && S.charms[id] > 0 && !CH[id].once) { useCharm(id, true); toast(`Charm Helper relit your ${CH[id].name}.`); } }
    updateStreak(); ensureDailies(); tickVisitor(); checkAch();
    renderStats(); renderTut();
    if (['charms', 'market', 'quests'].includes(tab)) refresh();
    if (tab === 'board' && (lbTimer += 1) % 30 === 0) loadBoard();
  }
  requestAnimationFrame(frame);
}

// ---------- start
updateStreak(); ensureDailies();
if (S.equipped && AURA[S.equipped]) { showSlip(AURA[S.equipped], false, 0); $('#slip .earn').textContent = 'Welcome back'; }
refresh();
if (S.rolls > 0 && S.streak.claimed !== today()) {
  const r = streakReward(S.streak.days, eff('basket'), bestN());
  $('#dayn').textContent = S.streak.days; $('#dayr').textContent = rewardText(r); $('#daymodal').hidden = false;
}
arcadeBest();
setTimeout(renderTut, 300);
requestAnimationFrame(frame);
window.__lucklight = { get S() { return S; }, roll, luckParts, command, world };
