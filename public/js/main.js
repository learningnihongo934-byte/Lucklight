// Lucklight: draw fortunes at a night shrine, collect auras, get luckier.
import { AURAS, AURA, reward, tierOf, GRADES, UPGRADES, cooldownBase, CHARMS, GEAR, EVENT } from './data.js';
import { drawStage, drawThumb } from './fx.js';
import { sfx, setMuted, setVolume } from './sfx.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-US');
const short = n => n < 1e4 ? fmt(n) : n < 1e6 ? (n / 1e3).toFixed(1) + 'K' : n < 1e9 ? (n / 1e6).toFixed(2) + 'M' : (n / 1e9).toFixed(2) + 'B';
const CH = Object.fromEntries(CHARMS.map(c => [c.id, c])), GR = Object.fromEntries(GEAR.map(g => [g.id, g]));
const CORE = AURAS.filter(a => !a.ev), EVA = AURAS.filter(a => a.ev === EVENT.id);

// ---------- save
const KEY = 'lucklight.save';
const fresh = () => ({
  v: 2, mon: 0, rolls: 0, inv: {}, found: {}, equipped: null, best: null,
  up: { luck: 0, speed: 0, fortune: 0, multi: 0, auto: 0 }, charms: {}, active: {}, slip: null,
  owned: {}, gear: { hand: null, neck: null }, name: '', pid: '', mute: false, auto: false,
  dial: null, drawSize: null, log: [], gift: '', evForce: null, adminLuck: 1, tainted: false,
  set: { autoWear: true, cut: 'all', stopAt: 0, stopNew: false, vol: 50, music: true, musicVol: 35, popups: true, autoQuiet: false },
});
let S = fresh();
function load(raw) {
  const s = JSON.parse(raw), f = fresh();
  return Object.assign(f, s, { up: { ...f.up, ...s.up }, gear: { ...f.gear, ...s.gear }, set: { ...f.set, ...s.set } });
}
try { const raw = localStorage.getItem(KEY); if (raw) S = load(raw); } catch {}
if (!S.pid) S.pid = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
setInterval(save, 3000); addEventListener('pagehide', save);
setMuted(S.mute); setVolume(S.set.vol / 100);

// ---------- background music: "yoiyami core theme" by Yoiyami (CC0, OpenGameArt). Starts on the first click or key.
const music = new Audio('audio/yoiyami.mp3'); music.loop = true; music.preload = 'none';
const syncMusic = () => {
  music.volume = Math.max(0, Math.min(1, S.set.musicVol / 100));
  if (S.set.music && unlocked) music.play().catch(() => {}); else music.pause();
};
let unlocked = false;
const unlock = () => { if (unlocked) return; unlocked = true; syncMusic(); };
addEventListener('pointerdown', unlock, { capture: true }); addEventListener('keydown', unlock, { capture: true });
// popups = name spins, full-screen reveal slips and rare-draw toasts
const popupsOn = () => S.set.popups && !(S.auto && S.set.autoQuiet);

// ---------- event
const eventOn = () => S.evForce === 'on' ? true : S.evForce === 'off' ? false : Date.now() >= EVENT.start && Date.now() < EVENT.end;
const POOL_ON = AURAS.filter(a => !a.ev || a.ev === EVENT.id), POOL_OFF = CORE;
const pool = () => eventOn() ? POOL_ON : POOL_OFF;
const today = () => new Date().toLocaleDateString('en-CA');
const left = ms => { const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60; return d ? `${d}d ${h}h` : `${h}h ${m}m`; };

// ---------- rules
const gearOn = () => [S.gear.hand, S.gear.neck].filter(Boolean).map(id => GR[id]);
const baseMax = () => 1.15 ** S.up.luck * (1 + gearOn().reduce((s, g) => s + g.luck, 0));
function luckParts(k = 0) {
  const now = Date.now(), max = baseMax(), base = S.dial ? Math.min(S.dial, max) : max;
  let charm = 1; for (const [id, until] of Object.entries(S.active)) if (until > now) charm *= CH[id].mult;
  const ev = eventOn() ? EVENT.luck : 1;
  const bell = S.up.fortune > 0 && (S.rolls + k + 1) % 10 === 0 ? S.up.fortune + 1 : 1;
  const slip = S.slip && k === 0 ? CH[S.slip].mult : 1;
  const admin = S.adminLuck || 1;
  return { max, base, charm, ev, bell, slip, admin, total: base * charm * ev * bell * slip * admin };
}
const cooldown = () => cooldownBase(S.up.speed) * (1 - gearOn().reduce((s, g) => s + g.speed, 0));
const maxDraw = () => 1 + S.up.multi;
const drawN = () => Math.max(1, Math.min(maxDraw(), S.drawSize || maxDraw()));
const bestOwned = () => { for (let i = AURAS.length - 1; i >= 0; i--) if (S.inv[AURAS[i].id] > 0) return AURAS[i].id; return null; };
const canPay = (need, mon) => S.mon >= mon && Object.entries(need).every(([k, v]) => (S.inv[k] || 0) >= v);
function pay(need, mon) {
  S.mon -= mon; for (const [k, v] of Object.entries(need)) S.inv[k] -= v;
  if (S.equipped && !(S.inv[S.equipped] > 0)) S.equipped = bestOwned();
}
function rollOne(L) { const p = pool(); for (let i = p.length - 1; i > 0; i--) if (Math.random() < L / p[i].n) return p[i]; return p[0]; }

// ---------- arcade + leaderboard
const arcadeScore = (score, m) => { try { if (window.parent !== window) window.parent.postMessage({ rennkoArcade: 1, type: 'score', score, meta: m }, 'https://arcade.rennko.tech'); } catch {} };
const arcadeBest = () => { if (S.best && !S.tainted) arcadeScore(Math.round(Math.log10(AURA[S.best].n) * 100) / 100, { aura: AURA[S.best].name }); };
let lastPost = 0;
async function postScore() {
  if (!S.name || !S.best || S.tainted) return;
  lastPost = S.rolls;
  try { await fetch('/api/score', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: S.pid, name: S.name, best: S.best, rolls: S.rolls }) }); } catch {}
}

// ---------- drawing
// draw `n` auras and put them in the bag; returns a summary
function drawBatch(n) {
  const got = []; for (let k = 0; k < n; k++) got.push(rollOne(luckParts(k).total));
  S.slip = null;
  let earned = 0, best = null; const fresh = [];
  for (const a of got) {
    S.rolls++; S.inv[a.id] = (S.inv[a.id] || 0) + 1;
    const isNew = !S.found[a.id];
    if (isNew) { S.found[a.id] = S.rolls; fresh.push(a); }
    earned += reward(a.n); if (!best || a.n > best.n) best = a;
    if (tierOf(a.n) >= 2 || isNew) S.log.unshift({ id: a.id, r: S.rolls, nw: isNew ? 1 : 0 });
  }
  if (S.log.length > 40) S.log.length = 40;
  S.mon += earned;
  const newBest = !S.best || best.n > AURA[S.best].n; if (newBest) S.best = best.id;
  if (!S.equipped || (S.set.autoWear && best.n > AURA[S.equipped].n)) S.equipped = best.id;
  return { got, best, earned, fresh, newBest };
}

let revealing = false, readyAt = 0, rollStart = 0;
function roll() {
  const now = performance.now();
  if (revealing || now < readyAt) return;
  const N = drawN(), r = drawBatch(N);
  rollStart = now; readyAt = now + cooldown();
  if (S.auto && ((S.set.stopAt && r.best.n >= S.set.stopAt) || (S.set.stopNew && r.fresh.length))) { S.auto = false; toast(`Auto-draw stopped on ${r.best.name}.`); }
  sfx.shake();
  reveal(r.best, r.fresh.includes(r.best), r.earned, N, r.fresh.length).then(() => {
    if (r.newBest) { arcadeBest(); postScore(); } else if (S.rolls - lastPost >= 250) postScore();
  });
  refresh();
}

const wait = ms => new Promise(r => setTimeout(r, ms));
let skipCut = null;
const waitSkip = ms => new Promise(r => { const t = setTimeout(done, ms); function done() { clearTimeout(t); skipCut = null; r(); } skipCut = done; });
let cutAura = null;
async function reveal(a, isNew, earned, N, nNew) {
  const tier = tierOf(a.n), rank = AURAS.indexOf(a), mode = S.set.cut;
  const big = popupsOn() && (mode === 'all' || (mode === 'new' && isNew));
  revealing = true;
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
  if (tier >= 2 && big) await cutscene(a, tier, isNew);
  showSlip(a, isNew, earned, tier, N, nNew);
  revealing = false;
  refresh();
}

async function cutscene(a, tier, isNew) {
  const cut = $('#cut'), g = GRADES[tier];
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

function showSlip(a, isNew, earned, tier, N = 1, nNew = 0) {
  const g = GRADES[tier], slip = $('#slip');
  slip.className = `slip t${tier}`;
  slip.innerHTML = `<div class="grade" title="${g.word}">${g.kanji}</div>
    <div class="nm" style="--ac:${a.c[Math.min(1, a.c.length - 1)]}">${esc(a.name)}${isNew ? '<span class="stamp">NEW</span>' : ''}${a.ev ? '<span class="evtag">Festival</span>' : ''}</div>
    <div class="odds">1 in ${fmt(a.n)}${N > 1 ? ` · best of ${N} draws` : ''}</div>
    <div class="earn">${earned ? `+${fmt(earned)} mon` : ''}${nNew > (isNew ? 1 : 0) ? ` · ${nNew} new auras` : ''}</div>`;
  if (tier >= 1 && popupsOn()) toast(`${g.word}: ${a.name}, 1 in ${fmt(a.n)}`);
}

// ---------- UI
let tab = 'index';
const TABS = { index: 'Collection', shrine: 'Offerings', charms: 'Charms', craft: 'Craft', board: 'Board', settings: 'Settings' };
$('#tabs').innerHTML = Object.entries(TABS).map(([k, v], i) => `<button data-tab="${k}" title="Key ${i + 1}">${v}</button>`).join('');
const ui = { q: '', f: 'all' };

function need(n, mon) {
  return Object.entries(n).map(([k, v]) => { const have = S.inv[k] || 0; return `<span class="chip ${have >= v ? 'ok' : ''}">${esc(AURA[k].name)} ${fmt(Math.min(have, v))}/${v}</span>`; }).join('') +
    `<span class="chip ${S.mon >= mon ? 'ok' : ''}">${short(mon)} mon</span>`;
}
const sel = (key, val, opts) => `<select data-set="${key}">${opts.map(([v, l]) => `<option value="${v}" ${String(val) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
const chk = (key, on) => `<input type="checkbox" data-set="${key}" ${on ? 'checked' : ''}>`;

const VIEWS = {
  index() {
    const q = ui.q.trim().toLowerCase(), f = ui.f, ev = eventOn();
    const list = AURAS.filter(a => {
      if (f === 'event' && !a.ev) return false;
      if (f === 'found' && !S.found[a.id]) return false;
      if (f === 'missing' && (S.found[a.id] || (a.ev && !ev))) return false;
      if (f === 'all' && a.ev && !ev && !S.found[a.id]) return false;
      return !q || (S.found[a.id] && a.name.toLowerCase().includes(q)) || fmt(a.n).replace(/,/g, '').startsWith(q.replace(/,/g, ''));
    });
    const found = CORE.filter(a => S.found[a.id]).length, efound = EVA.filter(a => S.found[a.id]).length;
    return [`<p class="lede" data-k="head">${found} of ${CORE.length} auras found${ev || efound ? ` · festival ${efound}/${EVA.length}` : ''}. Showing ${list.length}.</p>`,
      ...list.map(a => {
        const f = !!S.found[a.id], cnt = S.inv[a.id] || 0, on = S.equipped === a.id;
        return `<div class="card ${f ? '' : 'unk'} ${on ? 'on' : ''}" data-k="a-${a.id}">
          <canvas class="thumb" width="48" height="48" data-a="${a.id}" data-u="${f ? 0 : 1}"></canvas>
          <div class="info"><b>${f ? esc(a.name) : '? ? ?'}${a.ev ? ' <span class="evtag">Festival</span>' : ''}</b><span>1 in ${fmt(a.n)}</span><span class="cnt">${f ? `held ×${fmt(cnt)}` : 'not found'}</span></div>
          ${f ? `<button data-act="wear" data-id="${a.id}" ${on || !cnt ? 'disabled' : ''}>${on ? 'Worn' : 'Wear'}</button>` : ''}
        </div>`;
      })];
  },
  shrine() {
    const p = luckParts(), mx = p.max;
    return [`<p class="lede" data-k="head">Leave mon at the offering box. Luck now ×${short2(p.total)}: base ×${short2(p.base)}${S.dial ? ` (dial, max ×${short2(mx)})` : ''} · charms ×${p.charm}${p.ev > 1 ? ` · festival ×${p.ev}` : ''}.</p>`,
      `<div class="row" data-k="dial"><div class="info"><b>Luck dial</b><span>Turn your base luck down to grind smaller auras: any value from ×1 to your max ×${short2(mx)} (prayer × gear). Charms, the tenth bell and the festival still multiply on top.</span></div>
        <div class="btns"><input type="number" min="1" step="any" data-set="dial" value="${S.dial ?? ''}" placeholder="max"><button data-act="dialmax" ${S.dial ? '' : 'disabled'}>Max</button></div></div>`,
      ...(S.up.multi ? [`<div class="row" data-k="size"><div class="info"><b>Draw size</b><span>How many auras each draw rolls, up to ${maxDraw()}. The reveal shows the rarest.</span></div>
        <div class="btns"><input type="number" min="1" max="${maxDraw()}" step="1" data-set="drawSize" value="${drawN()}"></div></div>`] : []),
      ...UPGRADES.map(u => {
        const l = S.up[u.id], max = l >= u.max, cost = u.cost(l);
        return `<div class="row" data-k="u-${u.id}"><div class="info"><b>${u.name}</b> <span class="lvl">${u.max > 1 ? `Lv ${l}/${u.max}` : max ? 'Owned' : ''}</span>
          <span>${max ? (u.id === 'auto' ? 'Auto-draw unlocked' : 'Maxed out') : u.desc(l)}</span></div>
          ${max ? '' : `<button data-act="buy" data-id="${u.id}" ${S.mon >= cost ? '' : 'disabled'}>${short(cost)} mon</button>`}</div>`;
      })];
  },
  charms() {
    const now = Date.now(), ev = eventOn();
    const act = Object.entries(S.active).filter(([, u]) => u > now).map(([id, u]) => `${CH[id].name} ×${CH[id].mult} · ${left(u - now)}`);
    if (S.slip) act.push(`${CH[S.slip].name} ×${fmt(CH[S.slip].mult)} on your next roll`);
    return [`<p class="lede" data-k="head">${act.length ? 'Active: ' + act.join(' &nbsp;|&nbsp; ') : 'Fold auras and mon into charms. Timed charms of different kinds multiply.'}</p>`,
      ...CHARMS.filter(c => !c.ev || ev || S.charms[c.id]).map(c => {
        const have = S.charms[c.id] || 0, craftable = !c.ev || ev;
        return `<div class="row" data-k="c-${c.id}"><div class="info"><b>${c.name}</b>${c.ev ? ' <span class="evtag">Festival</span>' : ''} <span class="lvl">held ${have}</span>
          <span>${c.once ? `Next roll: luck ×${fmt(c.mult)}` : `Luck ×${c.mult} for ${c.secs >= 120 ? c.secs / 60 + ' min' : c.secs + 's'}`}</span>${craftable ? `<span class="chips">${need(c.need, c.mon)}</span>` : ''}</div>
          <div class="btns">${craftable ? `<button data-act="charm" data-id="${c.id}" ${canPay(c.need, c.mon) ? '' : 'disabled'}>Craft</button>` : ''}
          <button data-act="use" data-id="${c.id}" ${have ? '' : 'disabled'}>Use</button></div></div>`;
      })];
  },
  craft() {
    return [`<p class="lede" data-k="head">Gear is crafted once and kept. Wear one hand piece and one neck piece.</p>`,
      ...GEAR.map(g => {
        const own = S.owned[g.id], worn = S.gear[g.slot] === g.id;
        return `<div class="row ${worn ? 'on' : ''}" data-k="g-${g.id}"><div class="info"><b>${g.name}</b> <span class="lvl">${g.slot}</span>
          <span>Luck +${g.luck}${g.speed ? `, draws ${Math.round(g.speed * 100)}% faster` : ''}</span>${own ? '' : `<span class="chips">${need(g.need, g.mon)}</span>`}</div>
          ${own ? `<button data-act="gear" data-id="${g.id}">${worn ? 'Take off' : 'Wear'}</button>` : `<button data-act="forge" data-id="${g.id}" ${canPay(g.need, g.mon) ? '' : 'disabled'}>Craft</button>`}</div>`;
      })];
  },
  settings() {
    const st = S.set;
    return [`<p class="lede" data-k="head">Keys: Space draw · A auto · 1–6 tabs · Esc closes · \` opens the command bar.</p>`,
      `<div class="row" data-k="s-pop"><div class="info"><b>Popups</b><span>Name spins, full-screen reveal slips and rare-draw toasts. Off keeps drawing quiet; rare draws still land in your bag and the recent list.</span></div>${chk('popups', st.popups)}</div>`,
      `<div class="row" data-k="s-quiet"><div class="info"><b>Quiet auto-draw</b><span>No popups while auto-draw is on, popups again when you draw by hand.</span></div>${chk('autoQuiet', st.autoQuiet)}</div>`,
      `<div class="row" data-k="s-music"><div class="info"><b>Music</b><span>"yoiyami core theme" by Yoiyami (CC0). ${st.musicVol}%</span></div><div class="btns">${chk('music', st.music)}<input type="range" min="0" max="100" data-set="musicVol" value="${st.musicVol}"></div></div>`,
      `<div class="row" data-k="s-wear"><div class="info"><b>Auto-wear</b><span>Put on any aura rarer than the one you wear.</span></div>${chk('autoWear', st.autoWear)}</div>`,
      `<div class="row" data-k="s-cut"><div class="info"><b>Reveals</b><span>Name spins and full-screen slips. Click a slip to skip it.</span></div>${sel('cut', st.cut, [['all', 'Always'], ['new', 'New auras only'], ['off', 'Off']])}</div>`,
      `<div class="row" data-k="s-stop"><div class="info"><b>Stop auto-draw</b><span>Turn auto off when you draw something at least this rare.</span></div>${sel('stopAt', st.stopAt, [[0, 'Never'], [1e3, '1 in 1K'], [1e4, '1 in 10K'], [1e5, '1 in 100K'], [1e6, '1 in 1M'], [1e7, '1 in 10M'], [1e8, '1 in 100M'], [1e9, '1 in 1B']])}</div>`,
      `<div class="row" data-k="s-new"><div class="info"><b>Stop on new auras</b><span>Turn auto off on any first-time aura.</span></div>${chk('stopNew', st.stopNew)}</div>`,
      `<div class="row" data-k="s-vol"><div class="info"><b>Volume</b><span>${st.vol}%</span></div><input type="range" min="0" max="100" data-set="vol" value="${st.vol}"></div>`,
      `<div class="row" data-k="s-save"><div class="info"><b>Save</b><span>Copy a save code to move to another browser, or paste one in.</span></div>
        <div class="btns"><button data-act="export">Export</button><button data-act="import">Import</button><button data-act="reset">Reset</button></div></div>`,
      `<div class="row" data-k="s-stats"><div class="info"><b>Stats</b><span>${fmt(S.rolls)} rolls · ${fmt(S.mon)} mon · rarest ${S.best ? `${esc(AURA[S.best].name)} (1 in ${fmt(AURA[S.best].n)})` : 'none yet'}${S.tainted ? ' · admin save (not posted to the board)' : ''}</span></div></div>`,
    ];
  },
};
const short2 = n => n < 1000 ? (+n.toFixed(2)).toString() : short(n);

function patch(el, rows) {
  const tmp = document.createElement('div'); tmp.innerHTML = rows.join('');
  const nk = [...tmp.children];
  if (el.children.length !== nk.length || [...el.children].some((c, i) => c.dataset.k !== nk[i].dataset.k)) { el.replaceChildren(...nk); return; }
  nk.forEach((n, i) => { const o = el.children[i]; if (o.outerHTML !== n.outerHTML && !o.contains(document.activeElement)) o.replaceWith(n); });
}

function renderStats() {
  const p = luckParts();
  $('#mon').textContent = short(S.mon);
  $('#luck').textContent = '×' + short2(p.total);
  $('#rolls').textContent = fmt(S.rolls);
  $('#autowrap').hidden = !S.up.auto; $('#auto').checked = !!S.auto;
  $('#mute').textContent = S.mute ? 'Sound off' : 'Sound on';
  $('#musicbtn').textContent = S.set.music ? 'Music on' : 'Music off';
  $('#popbtn').textContent = S.set.popups ? 'Popups on' : 'Popups off';
  for (const b of ['#mute', '#musicbtn', '#popbtn']) $(b).classList.toggle('off', /off/.test($(b).textContent));
  const now = Date.now(), chips = [];
  if (S.dial && S.dial < p.max) chips.push(`<span>Dial ×${short2(p.base)}</span>`);
  if (drawN() > 1) chips.push(`<span>×${drawN()} per draw</span>`);
  for (const [id, u] of Object.entries(S.active)) if (u > now) chips.push(`<span>${CH[id].name} ${left(u - now)}</span>`);
  if (S.slip) chips.push(`<span>${CH[S.slip].name} ready</span>`);
  if (S.adminLuck > 1) chips.push(`<span class="hot">Admin luck ×${short2(S.adminLuck)}</span>`);
  if (S.up.fortune) { const l = 10 - (S.rolls % 10); chips.push(`<span class="${l === 1 ? 'hot' : ''}">${l === 1 ? `Tenth bell ×${S.up.fortune + 1} next!` : `Tenth bell in ${l}`}</span>`); }
  const eq = S.equipped ? AURA[S.equipped] : null;
  const html = (eq ? `<span class="eq">Wearing ${esc(eq.name)} · 1 in ${fmt(eq.n)}</span>` : '') + chips.join('');
  if ($('#buffs').innerHTML !== html) $('#buffs').innerHTML = html;
  renderEvent(); renderRecent();
}

function renderEvent() {
  const el = $('#event'), on = eventOn();
  el.hidden = !on; if (!on) return;
  const now = Date.now(), found = EVA.filter(a => S.found[a.id]).length, claimed = S.gift === today();
  const day = now >= EVENT.day && now < EVENT.day + 864e5 ? 'Happy Thanksgiving! ' : '';
  const html = `<div class="evinfo"><b>${day}${EVENT.name}</b><span>${now < EVENT.end ? `ends in ${left(EVENT.end - now)}` : 'forced on'} · festival luck ×${EVENT.luck} · ${found}/${EVA.length} harvest auras</span></div>
    <button data-act="gift" ${claimed ? 'disabled' : ''}>${claimed ? 'Gift claimed' : "Today's gift"}</button>`;
  if (el.innerHTML !== html) el.innerHTML = html;
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
  // rebuilding 400 cards is costly, so the list updates at most ~3 times a second
  const now = performance.now();
  if (now - listT > 300) { listT = now; patch($('#tab-list'), VIEWS[tab]()); }
  else if (!listQueued) { listQueued = true; setTimeout(() => { listQueued = false; refresh(); }, 320 - (now - listT)); }
}
function setTab(t) {
  tab = t; listT = 0; $('#tab-list').replaceChildren(); refresh();
  if (t === 'board') loadBoard();
}

async function loadBoard() {
  $('#lbname').value = S.name || '';
  $('#lbme').textContent = S.tainted ? 'This save used admin commands, so it is not posted.' : S.best ? `Your rarest: ${AURA[S.best].name} (1 in ${fmt(AURA[S.best].n)}) · ${fmt(S.rolls)} rolls` : 'Draw a fortune first.';
  try {
    const d = await (await fetch('/api/top')).json();
    const list = (rows, by) => rows.length ? rows.map((p, i) => `<li class="${p.name === S.name && S.name ? 'me' : ''}"><span class="rk">${i + 1}</span><span class="who">${esc(p.name)}</span><span class="val">${by === 'best' ? `${esc(AURA[p.best]?.name || p.best)} · 1 in ${short(p.n)}` : `${fmt(p.rolls)} rolls`}</span></li>`).join('') : '<li class="empty">No one yet.</li>';
    $('#lbbest').innerHTML = list(d.best || [], 'best');
    $('#lbrolls').innerHTML = list(d.rolls || [], 'rolls');
  } catch { $('#lbbest').innerHTML = '<li class="empty">Board is offline.</li>'; $('#lbrolls').innerHTML = ''; }
}

let toastT = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }

// ---------- actions
function act(kind, id) {
  if (kind === 'wear') { if (S.inv[id] > 0) { S.equipped = id; sfx.click(); } }
  else if (kind === 'buy') {
    const u = UPGRADES.find(x => x.id === id), l = S.up[id], cost = u.cost(l);
    if (l >= u.max || S.mon < cost) { sfx.deny(); return; }
    S.mon -= cost; S.up[id]++; sfx.buy();
    if (id === 'auto') { S.auto = true; toast('The shrine helper will draw for you. Toggle it under the button (or press A).'); }
    if (id === 'multi' && (!S.drawSize || S.drawSize === l + 1)) S.drawSize = null; // follow the max unless set lower
  } else if (kind === 'charm') {
    const c = CH[id]; if (!canPay(c.need, c.mon) || (c.ev && !eventOn())) { sfx.deny(); return; }
    pay(c.need, c.mon); S.charms[id] = (S.charms[id] || 0) + 1; sfx.craft(); toast(`Folded a ${c.name}.`);
  } else if (kind === 'use') {
    const c = CH[id]; if (!(S.charms[id] > 0)) return;
    if (c.once) { if (S.slip) { toast('A slip is already waiting for your next roll.'); sfx.deny(); return; } S.slip = id; }
    else { const now = Date.now(); S.active[id] = Math.min(Math.max(S.active[id] || 0, now) + c.secs * 1000, now + 30 * 60 * 1000); }
    S.charms[id]--; sfx.craft();
  } else if (kind === 'forge') {
    const g = GR[id]; if (S.owned[id] || !canPay(g.need, g.mon)) { sfx.deny(); return; }
    pay(g.need, g.mon); S.owned[id] = true; S.gear[g.slot] = id; sfx.craft(); toast(`Crafted ${g.name} and put it on.`);
  } else if (kind === 'gear') {
    const g = GR[id]; S.gear[g.slot] = S.gear[g.slot] === id ? null : id; sfx.click();
  } else if (kind === 'dialmax') { S.dial = null; sfx.click(); }
  else if (kind === 'gift') {
    if (!eventOn() || S.gift === today()) return;
    S.gift = today(); S.mon += EVENT.gift.mon; S.charms[EVENT.gift.charm] = (S.charms[EVENT.gift.charm] || 0) + 1;
    sfx.craft(); toast(`Harvest gift: ${EVENT.gift.mon} mon and a ${CH[EVENT.gift.charm].name}.`);
  } else if (kind === 'export') {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
    navigator.clipboard?.writeText(code).then(() => toast('Save code copied.'), () => prompt('Copy your save code:', code));
  } else if (kind === 'import') {
    const code = prompt('Paste a save code. This replaces your current save.'); if (!code) return;
    try { S = load(decodeURIComponent(escape(atob(code.trim())))); save(); toast('Save loaded.'); setMuted(S.mute); setVolume(S.set.vol / 100); syncMusic(); } catch { toast('That code did not work.'); return; }
  } else if (kind === 'reset') {
    if (!confirm('Reset everything? Your auras, mon and upgrades will be gone.')) return;
    const keep = { pid: S.pid, name: S.name }; S = Object.assign(fresh(), keep); save(); toast('Fresh start.');
  }
  save(); refresh();
}
function setSetting(key, el) {
  const v = el.type === 'checkbox' ? el.checked : el.value;
  if (key === 'dial') { const n = parseFloat(v); S.dial = n >= 1 && n < baseMax() ? n : null; if (n >= baseMax()) toast(`Your max is ×${short2(baseMax())}; dial set to max.`); }
  else if (key === 'drawSize') { const n = Math.round(+v); S.drawSize = n >= 1 && n < maxDraw() ? n : null; }
  else if (key === 'vol') { S.set.vol = +v; setVolume(+v / 100); }
  else if (key === 'stopAt') S.set.stopAt = +v;
  else if (key === 'musicVol') { S.set.musicVol = +v; syncMusic(); }
  else if (key === 'music') { S.set.music = v; syncMusic(); }
  else S.set[key] = v;
  save(); refresh();
}

// buttons may be re-rendered between press and release, so act on press (and on keyboard click)
for (const host of [$('#panel'), $('#event')]) {
  host.addEventListener('pointerdown', e => { const b = e.target.closest('button[data-act]'); if (b && !b.disabled && e.button === 0) { e.preventDefault(); act(b.dataset.act, b.dataset.id); } });
  host.addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (b && e.detail === 0 && !b.disabled) act(b.dataset.act, b.dataset.id); });
}
$('#panel').addEventListener('change', e => { const el = e.target.closest('[data-set]'); if (el) setSetting(el.dataset.set, el); });
$('#panel').addEventListener('input', e => {
  const el = e.target.closest('[data-set="vol"], [data-set="musicVol"]'); if (!el) return;
  if (el.dataset.set === 'vol') setVolume(+el.value / 100); else { S.set.musicVol = +el.value; syncMusic(); }
});
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { sfx.click(); setTab(b.dataset.tab); } });
$('#q').addEventListener('input', e => { ui.q = e.target.value; listT = 0; refresh(); });
$('#flt').addEventListener('change', e => { ui.f = e.target.value; listT = 0; refresh(); });
$('#roll').addEventListener('pointerdown', e => { if (e.button === 0) { e.preventDefault(); roll(); } });
$('#roll').addEventListener('click', e => { if (e.detail === 0) roll(); });
$('#auto').addEventListener('change', e => { S.auto = e.target.checked; save(); });
$('#mute').addEventListener('click', () => { S.mute = !S.mute; setMuted(S.mute); save(); renderStats(); });
$('#musicbtn').addEventListener('click', () => { S.set.music = !S.set.music; syncMusic(); save(); refresh(); });
$('#popbtn').addEventListener('click', () => { S.set.popups = !S.set.popups; save(); refresh(); toast(S.set.popups ? 'Popups on.' : 'Popups off: draws land quietly.'); });
$('#cut').addEventListener('pointerdown', () => skipCut?.());
addEventListener('keydown', e => {
  if (e.key === '`' || (e.key === '/' && !e.target.closest('input, textarea, select'))) { e.preventDefault(); openConsole(); return; }
  if (e.key === 'Escape') { if (!$('#console').hidden) closeConsole(); else skipCut?.(); return; }
  if (e.target.closest('input, textarea, select')) return;
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (skipCut) skipCut(); else if (!e.repeat || S.up.speed > 0) roll(); }
  if (e.code === 'KeyA' && S.up.auto) { S.auto = !S.auto; save(); renderStats(); }
  const n = +e.key; if (n >= 1 && n <= 6) setTab(Object.keys(TABS)[n - 1]);
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

// ---------- admin command bar
const ADM = 'lucklight.admin';
let adminKey = null; try { adminKey = localStorage.getItem(ADM); } catch {}
const out = (msg, cls = '') => { const d = document.createElement('div'); d.className = cls; d.textContent = msg; $('#conlog').append(d); $('#conlog').scrollTop = 1e9; };
function openConsole() { $('#console').hidden = false; $('#conin').focus(); if (!$('#conlog').childElementCount) out(adminKey ? 'Admin unlocked. Type help.' : 'Type: admin <key>'); }
function closeConsole() { $('#console').hidden = true; $('#conin').blur(); }
async function adminApi(body) {
  const r = await fetch('/api/admin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: adminKey, ...body }) });
  return r.json().catch(() => ({ error: `HTTP ${r.status}` }));
}
const findAura = s => { s = s.trim().toLowerCase(); return AURA[s] || AURAS.find(a => a.name.toLowerCase() === s) || AURAS.find(a => a.id.startsWith(s.replace(/\s+/g, '-')) || a.name.toLowerCase().startsWith(s)); };
const num = s => { const m = String(s).trim().toLowerCase().match(/^([\d.]+)\s*([kmb]?)$/); return m ? +m[1] * ({ k: 1e3, m: 1e6, b: 1e9 }[m[2]] || 1) : NaN; };
const HELP = [
  'give <aura> [count]      add auras (name or id)', 'mon <n> / setmon <n>     add or set mon (1.5m, 2b ok)',
  'luck <n> | luck off      extra admin luck multiplier', 'roll <n>                 roll n auras instantly (max 1m)',
  'up <id> <level>          set an upgrade (luck speed fortune multi auto)', 'maxall                   max every upgrade',
  'charm <id> [n]           add charms (paper red gold heaven star basket)', 'gear all                 own all gear',
  'unlock all               find every aura once', 'wear <aura>              wear any aura you hold',
  'reveal <aura>            preview a reveal', 'event on|off|auto        force the festival',
  'gift reset               reclaim today\'s festival gift', 'board remove <name>      delete a board entry',
  'untaint                  allow board posts again', 'wipe confirm             reset this save', 'logout                   forget the admin key',
];
const TAINT = new Set(['give', 'mon', 'setmon', 'luck', 'up', 'maxall', 'charm', 'gear', 'unlock']);
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
      const m = rest.match(/^(.*?)(?:\s+([\d.]+[kmb]?))?$/i), a = findAura(m[1]), n = m[2] ? num(m[2]) : 1;
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
    case 'maxall': UPGRADES.forEach(u => S.up[u.id] = u.max); out('All upgrades maxed.', 'ok'); break;
    case 'charm': { const c = CH[args[0]], n = args[1] ? num(args[1]) : 1; if (!c) return out(`Charms: ${CHARMS.map(c => c.id).join(' ')}`, 'err'); S.charms[c.id] = (S.charms[c.id] || 0) + n; out(`+${n} ${c.name}`, 'ok'); break; }
    case 'gear': GEAR.forEach(g => S.owned[g.id] = true); out('All gear owned.', 'ok'); break;
    case 'unlock': AURAS.forEach(a => { if (!S.found[a.id]) { S.found[a.id] = S.rolls || 1; S.inv[a.id] = (S.inv[a.id] || 0) + 1; } }); S.best = AURAS.at(-1).id; out(`Found all ${AURAS.length} auras.`, 'ok'); break;
    case 'wear': { const a = findAura(rest); if (!a || !(S.inv[a.id] > 0)) return out('You do not hold that aura (give it first).', 'err'); S.equipped = a.id; out(`Wearing ${a.name}.`, 'ok'); break; }
    case 'reveal': { const a = findAura(rest); if (!a) return out('No such aura.', 'err'); closeConsole(); const t = tierOf(a.n); sfx.result(t, AURAS.indexOf(a)); await cutscene(a, Math.max(2, t), false); break; }
    case 'event': { S.evForce = rest === 'on' ? 'on' : rest === 'off' ? 'off' : null; out(`Festival ${eventOn() ? 'on' : 'off'} (${S.evForce || 'auto'}).`, 'ok'); break; }
    case 'gift': S.gift = ''; out('Gift can be claimed again.', 'ok'); break;
    case 'board': {
      if (args[0] !== 'remove' || !args[1]) return out('Usage: board remove <name>', 'err');
      const r = await adminApi({ cmd: 'remove', name: args.slice(1).join(' ') });
      out(r.ok ? `Removed ${r.removed} entr${r.removed === 1 ? 'y' : 'ies'}.` : `Failed: ${r.error}`, r.ok ? 'ok' : 'err'); if (tab === 'board') loadBoard(); break;
    }
    case 'untaint': S.tainted = false; out('Board posts allowed again.', 'ok'); break;
    case 'wipe': if (rest !== 'confirm') return out('Type: wipe confirm', 'err'); S = Object.assign(fresh(), { pid: S.pid, name: S.name }); out('Save wiped.', 'ok'); break;
    case 'logout': adminKey = null; try { localStorage.removeItem(ADM); } catch {} out('Admin key forgotten.', 'ok'); break;
    default: out(`Unknown command "${cmd}". Type help.`, 'err');
  }
  save(); refresh();
}
$('#conform').addEventListener('submit', e => { e.preventDefault(); const v = $('#conin').value; $('#conin').value = ''; command(v); });

// ---------- loop
const stage = $('#stage').getContext('2d'), cutCtx = $('#cutcv').getContext('2d');
let lastThumb = 0, lastSec = 0;
function frame(now) {
  const t = now / 1000;
  drawStage(stage, S.equipped ? AURA[S.equipped] : null, t, eventOn());
  if (S.auto && S.up.auto && !revealing && now >= readyAt) roll();
  const cd = Math.max(1, readyAt - rollStart), p = Math.min(1, (now - rollStart) / cd);
  $('#rollbar').style.transform = `scaleX(${revealing ? 0 : p})`;
  if (cutAura) drawThumb(cutCtx, cutAura, t);
  if (tab === 'index' && now - lastThumb > 66) {
    lastThumb = now;
    const lr = $('#tab-list').getBoundingClientRect(), top = Math.max(lr.top, 0), bot = Math.min(lr.bottom, innerHeight);
    for (const cv of document.querySelectorAll('canvas.thumb')) { const r = cv.getBoundingClientRect(); if (r.bottom > top && r.top < bot) drawThumb(cv.getContext('2d'), AURA[cv.dataset.a], t, cv.dataset.u === '1'); }
  }
  if (now - lastSec > 1000) { lastSec = now; renderStats(); if (tab === 'charms') refresh(); if (tab === 'board' && (lbTimer += 1) % 30 === 0) loadBoard(); }
  requestAnimationFrame(frame);
}

if (S.equipped && AURA[S.equipped]) { showSlip(AURA[S.equipped], false, 0, 0); $('#slip .earn').textContent = 'Welcome back'; }
refresh();
arcadeBest();
requestAnimationFrame(frame);
window.__lucklight = { get S() { return S; }, roll, luckParts, command };
