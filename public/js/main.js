// Lucklight: draw fortunes at a night shrine, collect auras, get luckier.
import { AURAS, AURA, reward, tierOf, GRADES, UPGRADES, cooldownBase, CHARMS, GEAR } from './data.js';
import { drawStage, drawThumb } from './fx.js';
import { sfx, setMuted } from './sfx.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-US');
const short = n => n < 1e4 ? fmt(n) : n < 1e6 ? (n / 1e3).toFixed(1) + 'K' : n < 1e9 ? (n / 1e6).toFixed(2) + 'M' : (n / 1e9).toFixed(2) + 'B';
const CH = Object.fromEntries(CHARMS.map(c => [c.id, c])), GR = Object.fromEntries(GEAR.map(g => [g.id, g]));

// ---------- save
const KEY = 'lucklight.save';
const fresh = () => ({
  v: 1, mon: 0, rolls: 0, inv: {}, found: {}, equipped: null, best: null,
  up: { luck: 0, speed: 0, fortune: 0, auto: 0 }, charms: {}, active: {}, slip: null,
  owned: {}, gear: { hand: null, neck: null }, name: '', pid: '', mute: false, auto: false,
});
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { S = Object.assign(fresh(), s); S.up = Object.assign(fresh().up, s.up); S.gear = Object.assign(fresh().gear, s.gear); } } catch {}
if (!S.pid) S.pid = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
setInterval(save, 3000); addEventListener('pagehide', save);
setMuted(S.mute);

// ---------- rules
const gearOn = () => [S.gear.hand, S.gear.neck].filter(Boolean).map(id => GR[id]);
function luckParts() {
  const now = Date.now();
  const up = 1.15 ** S.up.luck;
  const gear = 1 + gearOn().reduce((s, g) => s + g.luck, 0);
  let charm = 1; for (const [id, until] of Object.entries(S.active)) if (until > now) charm *= CH[id].mult;
  const bell = S.up.fortune > 0 && (S.rolls + 1) % 10 === 0 ? S.up.fortune + 1 : 1;
  const slip = S.slip ? CH[S.slip].mult : 1;
  return { up, gear, charm, bell, slip, total: up * gear * charm * bell * slip };
}
const cooldown = () => cooldownBase(S.up.speed) * (1 - gearOn().reduce((s, g) => s + g.speed, 0));
const bestOwned = () => { for (let i = AURAS.length - 1; i >= 0; i--) if (S.inv[AURAS[i].id] > 0) return AURAS[i].id; return null; };
const canPay = (need, mon) => S.mon >= mon && Object.entries(need).every(([k, v]) => (S.inv[k] || 0) >= v);
function pay(need, mon) {
  S.mon -= mon; for (const [k, v] of Object.entries(need)) S.inv[k] -= v;
  if (S.equipped && !(S.inv[S.equipped] > 0)) S.equipped = bestOwned();
}

// ---------- arcade + leaderboard
const arcadeScore = (score, m) => { try { if (window.parent !== window) window.parent.postMessage({ rennkoArcade: 1, type: 'score', score, meta: m }, 'https://arcade.rennko.tech'); } catch {} };
const arcadeBest = () => { if (S.best) arcadeScore(Math.round(Math.log10(AURA[S.best].n) * 100) / 100, { aura: AURA[S.best].name }); };
let lastPost = 0;
async function postScore() {
  if (!S.name || !S.best) return;
  lastPost = S.rolls;
  try { await fetch('/api/score', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: S.pid, name: S.name, best: S.best, rolls: S.rolls }) }); } catch {}
}

// ---------- drawing a fortune
let revealing = false, readyAt = 0, rollStart = 0;
function roll() {
  const now = performance.now();
  if (revealing || now < readyAt) return;
  const L = luckParts().total;
  let got = AURAS[0];
  for (let i = AURAS.length - 1; i > 0; i--) if (Math.random() < L / AURAS[i].n) { got = AURAS[i]; break; }
  S.rolls++; S.slip = null;
  S.inv[got.id] = (S.inv[got.id] || 0) + 1;
  const isNew = !S.found[got.id]; if (isNew) S.found[got.id] = S.rolls;
  const earned = reward(got.n); S.mon += earned;
  const newBest = !S.best || got.n > AURA[S.best].n; if (newBest) S.best = got.id;
  if (!S.equipped || got.n > AURA[S.equipped].n) S.equipped = got.id;
  rollStart = now; readyAt = now + cooldown();
  sfx.shake();
  reveal(got, isNew, earned).then(() => {
    if (newBest) { arcadeBest(); postScore(); }
    else if (S.rolls - lastPost >= 250) postScore();
  });
  refresh();
}

const wait = ms => new Promise(r => setTimeout(r, ms));
let cutAura = null;
async function reveal(a, isNew, earned) {
  const tier = tierOf(a.n), rank = AURAS.indexOf(a);
  revealing = true;
  if (tier >= 1) {
    const slip = $('#slip'); slip.className = 'slip spinning';
    const steps = tier === 1 ? 7 : 12;
    for (let i = 0; i < steps; i++) {
      const fake = AURAS[Math.floor(Math.random() * Math.min(AURAS.length, rank + 4))];
      slip.innerHTML = `<div class="grade">？</div><div class="nm" style="--ac:${fake.c[1]}">${fake.name}</div><div class="odds">1 in ${fmt(fake.n)}</div>`;
      sfx.spin(); await wait(40 + i * (tier === 1 ? 8 : 12));
    }
  }
  sfx.result(tier, rank);
  if (tier >= 2) await cutscene(a, tier, isNew);
  showSlip(a, isNew, earned, tier);
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
  await wait([0, 0, 1900, 3300, 5600][tier]);
  cut.className = ''; cutAura = null;
  document.body.classList.remove('shake');
}

function showSlip(a, isNew, earned, tier) {
  const g = GRADES[tier], slip = $('#slip');
  slip.className = `slip t${tier}`;
  slip.innerHTML = `<div class="grade" title="${g.word}">${g.kanji}</div>
    <div class="nm" style="--ac:${a.c[Math.min(1, a.c.length - 1)]}">${a.name}${isNew ? '<span class="stamp">NEW</span>' : ''}</div>
    <div class="odds">1 in ${fmt(a.n)}</div><div class="earn">+${fmt(earned)} mon</div>`;
  if (tier >= 1) toast(`${g.word}: ${a.name}, 1 in ${fmt(a.n)}`);
}

// ---------- UI
let tab = 'index';
const TABS = { index: 'Collection', shrine: 'Offerings', charms: 'Charms', craft: 'Craft', board: 'Board' };
$('#tabs').innerHTML = Object.entries(TABS).map(([k, v]) => `<button data-tab="${k}">${v}</button>`).join('');

function need(n, mon) {
  return Object.entries(n).map(([k, v]) => { const have = S.inv[k] || 0; return `<span class="chip ${have >= v ? 'ok' : ''}">${AURA[k].name} ${Math.min(have, v)}/${v}</span>`; }).join('') +
    `<span class="chip ${S.mon >= mon ? 'ok' : ''}">${short(mon)} mon</span>`;
}

const VIEWS = {
  index() {
    const found = AURAS.filter(a => S.found[a.id]).length;
    return [`<p class="lede" data-k="head">${found} of ${AURAS.length} auras found. Wear any aura you hold.</p>`,
      ...AURAS.map(a => {
        const f = !!S.found[a.id], cnt = S.inv[a.id] || 0, on = S.equipped === a.id;
        return `<div class="card ${f ? '' : 'unk'} ${on ? 'on' : ''}" data-k="a-${a.id}">
          <canvas class="thumb" width="48" height="48" data-a="${a.id}" data-u="${f ? 0 : 1}"></canvas>
          <div class="info"><b>${f ? a.name : '? ? ?'}</b><span>1 in ${fmt(a.n)}</span><span class="cnt">${f ? `held ×${fmt(cnt)}` : 'not found'}</span></div>
          ${f ? `<button data-act="wear" data-id="${a.id}" ${on || !cnt ? 'disabled' : ''}>${on ? 'Worn' : 'Wear'}</button>` : ''}
        </div>`;
      })];
  },
  shrine() {
    const p = luckParts();
    return [`<p class="lede" data-k="head">Leave mon at the offering box. Luck now: prayer ×${p.up.toFixed(2)} · gear ×${p.gear.toFixed(2)} · charms ×${p.charm}.</p>`,
      ...UPGRADES.map(u => {
        const l = S.up[u.id], max = l >= u.max, cost = u.cost(l);
        return `<div class="row" data-k="u-${u.id}"><div class="info"><b>${u.name}</b> <span class="lvl">${u.max > 1 ? `Lv ${l}/${u.max}` : max ? 'Owned' : ''}</span>
          <span>${max ? (u.id === 'auto' ? 'Auto-draw unlocked' : 'Maxed out') : u.desc(l)}</span></div>
          ${max ? '' : `<button data-act="buy" data-id="${u.id}" ${S.mon >= cost ? '' : 'disabled'}>${short(cost)} mon</button>`}</div>`;
      })];
  },
  charms() {
    const now = Date.now();
    const act = Object.entries(S.active).filter(([, u]) => u > now).map(([id, u]) => `${CH[id].name} ×${CH[id].mult} · ${Math.ceil((u - now) / 1000)}s`);
    if (S.slip) act.push(`${CH[S.slip].name} ×${fmt(CH[S.slip].mult)} on your next draw`);
    return [`<p class="lede" data-k="head">${act.length ? 'Active: ' + act.join(' &nbsp;|&nbsp; ') : 'Fold auras and mon into charms. Timed charms of different kinds multiply.'}</p>`,
      ...CHARMS.map(c => {
        const have = S.charms[c.id] || 0;
        return `<div class="row" data-k="c-${c.id}"><div class="info"><b>${c.name}</b> <span class="lvl">held ${have}</span>
          <span>${c.once ? `Next draw: luck ×${fmt(c.mult)}` : `Luck ×${c.mult} for ${c.secs}s`}</span><span class="chips">${need(c.need, c.mon)}</span></div>
          <div class="btns"><button data-act="charm" data-id="${c.id}" ${canPay(c.need, c.mon) ? '' : 'disabled'}>Craft</button>
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
};

function patch(el, rows) {
  const tmp = document.createElement('div'); tmp.innerHTML = rows.join('');
  const nk = [...tmp.children];
  if (el.children.length !== nk.length || [...el.children].some((c, i) => c.dataset.k !== nk[i].dataset.k)) { el.replaceChildren(...nk); return; }
  nk.forEach((n, i) => { const o = el.children[i]; if (o.outerHTML !== n.outerHTML) o.replaceWith(n); });
}

function renderStats() {
  const p = luckParts();
  $('#mon').textContent = short(S.mon);
  $('#luck').textContent = '×' + (p.total < 1000 ? p.total.toFixed(2) : short(p.total));
  $('#rolls').textContent = fmt(S.rolls);
  $('#autowrap').hidden = !S.up.auto; $('#auto').checked = !!S.auto;
  $('#mute').textContent = S.mute ? 'Sound off' : 'Sound on';
  const now = Date.now(), chips = [];
  for (const [id, u] of Object.entries(S.active)) if (u > now) chips.push(`<span>${CH[id].name} ${Math.ceil((u - now) / 1000)}s</span>`);
  if (S.slip) chips.push(`<span>${CH[S.slip].name} ready</span>`);
  if (S.up.fortune) { const left = 10 - (S.rolls % 10); chips.push(`<span class="${left === 1 ? 'hot' : ''}">${left === 1 ? `Tenth bell ×${S.up.fortune + 1} next!` : `Tenth bell in ${left}`}</span>`); }
  const eq = S.equipped ? AURA[S.equipped] : null;
  const html = (eq ? `<span class="eq">Wearing ${eq.name} · 1 in ${fmt(eq.n)}</span>` : '') + chips.join('');
  if ($('#buffs').innerHTML !== html) $('#buffs').innerHTML = html;
}

let lbTimer = 0;
function refresh() {
  renderStats();
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('on', b.dataset.tab === tab);
  $('#tab-list').hidden = tab === 'board'; $('#tab-board').hidden = tab !== 'board';
  if (tab !== 'board') patch($('#tab-list'), VIEWS[tab]());
}

function setTab(t) {
  tab = t; $('#tab-list').replaceChildren(); refresh();
  if (t === 'board') loadBoard();
}

async function loadBoard() {
  $('#lbname').value = S.name || '';
  $('#lbme').textContent = S.best ? `Your rarest: ${AURA[S.best].name} (1 in ${fmt(AURA[S.best].n)}) · ${fmt(S.rolls)} draws` : 'Draw a fortune first.';
  try {
    const r = await fetch('/api/top'); const d = await r.json();
    const list = (rows, by) => rows.length ? rows.map((p, i) => `<li class="${p.me ? 'me' : ''}"><span class="rk">${i + 1}</span><span class="who">${esc(p.name)}</span><span class="val">${by === 'best' ? `${esc(AURA[p.best]?.name || p.best)} · 1 in ${short(p.n)}` : `${fmt(p.rolls)} draws`}</span></li>`).join('') : '<li class="empty">No one yet.</li>';
    const mark = rows => rows.map(p => ({ ...p, me: p.name === S.name && S.name }));
    $('#lbbest').innerHTML = list(mark(d.best || []), 'best');
    $('#lbrolls').innerHTML = list(mark(d.rolls || []), 'rolls');
  } catch { $('#lbbest').innerHTML = '<li class="empty">Board is offline.</li>'; $('#lbrolls').innerHTML = ''; }
}

let toastT = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

// ---------- actions
function act(kind, id) {
  if (kind === 'wear') { if (S.inv[id] > 0) { S.equipped = id; sfx.click(); } }
  else if (kind === 'buy') {
    const u = UPGRADES.find(x => x.id === id), l = S.up[id], cost = u.cost(l);
    if (l >= u.max || S.mon < cost) { sfx.deny(); return; }
    S.mon -= cost; S.up[id]++; sfx.buy();
    if (id === 'auto') { S.auto = true; toast('The shrine helper will draw for you. Toggle it under the button.'); }
  } else if (kind === 'charm') {
    const c = CH[id]; if (!canPay(c.need, c.mon)) { sfx.deny(); return; }
    pay(c.need, c.mon); S.charms[id] = (S.charms[id] || 0) + 1; sfx.craft(); toast(`Folded a ${c.name}.`);
  } else if (kind === 'use') {
    const c = CH[id]; if (!(S.charms[id] > 0)) return;
    if (c.once) { if (S.slip) { toast('A slip is already waiting for your next draw.'); sfx.deny(); return; } S.slip = id; }
    else { const now = Date.now(); S.active[id] = Math.min(Math.max(S.active[id] || 0, now) + c.secs * 1000, now + 30 * 60 * 1000); }
    S.charms[id]--; sfx.craft();
  } else if (kind === 'forge') {
    const g = GR[id]; if (S.owned[id] || !canPay(g.need, g.mon)) { sfx.deny(); return; }
    pay(g.need, g.mon); S.owned[id] = true; S.gear[g.slot] = id; sfx.craft(); toast(`Crafted ${g.name} and put it on.`);
  } else if (kind === 'gear') {
    const g = GR[id]; S.gear[g.slot] = S.gear[g.slot] === id ? null : id; sfx.click();
  }
  save(); refresh();
}

// buttons may be re-rendered between press and release, so act on press (and on keyboard click)
const panel = $('#panel');
panel.addEventListener('pointerdown', e => { const b = e.target.closest('button[data-act]'); if (b && !b.disabled && e.button === 0) { e.preventDefault(); act(b.dataset.act, b.dataset.id); } });
panel.addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (b && e.detail === 0 && !b.disabled) act(b.dataset.act, b.dataset.id); });
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { sfx.click(); setTab(b.dataset.tab); } });
$('#roll').addEventListener('pointerdown', e => { if (e.button === 0) { e.preventDefault(); roll(); } });
$('#roll').addEventListener('click', e => { if (e.detail === 0) roll(); });
$('#auto').addEventListener('change', e => { S.auto = e.target.checked; save(); });
$('#mute').addEventListener('click', () => { S.mute = !S.mute; setMuted(S.mute); save(); renderStats(); });
addEventListener('keydown', e => {
  if (e.target.closest('input, textarea')) return;
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat || S.up.speed > 0) roll(); }
  if (e.code === 'KeyA' && S.up.auto) { S.auto = !S.auto; save(); renderStats(); }
});
$('#lbform').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('#lbname').value.trim().replace(/\s+/g, ' ').slice(0, 16);
  if (!n) return;
  S.name = n; save();
  if (!S.best) { toast('Draw a fortune first, then post.'); return; }
  postScore().then(loadBoard); toast('Posted to the board.');
});

// ---------- loop
const stage = $('#stage').getContext('2d'), cutCtx = $('#cutcv').getContext('2d');
let lastThumb = 0, lastSec = 0;
function frame(now) {
  const t = now / 1000;
  drawStage(stage, S.equipped ? AURA[S.equipped] : null, t);
  if (S.auto && S.up.auto && !revealing && now >= readyAt) roll();
  const cd = Math.max(1, readyAt - rollStart), p = Math.min(1, (now - rollStart) / cd);
  $('#rollbar').style.transform = `scaleX(${revealing ? 0 : p})`;
  if (cutAura) drawThumb(cutCtx, cutAura, t);
  if (tab === 'index' && now - lastThumb > 66) {
    lastThumb = now;
    for (const cv of document.querySelectorAll('canvas.thumb')) drawThumb(cv.getContext('2d'), AURA[cv.dataset.a], t, cv.dataset.u === '1');
  }
  if (now - lastSec > 1000) { lastSec = now; renderStats(); if (tab === 'charms') refresh(); if (tab === 'board' && (lbTimer += 1) % 30 === 0) loadBoard(); }
  requestAnimationFrame(frame);
}

if (S.equipped) { const a = AURA[S.equipped]; showSlip(a, false, 0, 0); $('#slip .earn').textContent = 'Welcome back'; }
refresh();
arcadeBest();
requestAnimationFrame(frame);
window.__lucklight = { S, roll, luckParts };
