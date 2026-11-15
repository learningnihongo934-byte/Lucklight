// Lucklight quests: shrine visitors, daily quests, the shrine's story, achievements and the login streak.
// Everything here reads a small context object (cx) built in main.js, so it stays independent of the UI.

const nice = x => { const p = 10 ** Math.max(0, Math.floor(Math.log10(x)) - 1); return Math.round(x / p) * p; };
const pick = (list, r) => list[Math.floor(r * list.length) % list.length];
export const monScale = bestN => Math.max(100, Math.round(Math.sqrt(bestN || 1) * 2));
const charmFor = bestN => bestN >= 1e5 ? 'gold' : bestN >= 1e3 ? 'red' : 'paper';

// ---------- shrine visitors
export const VISITORS = [
  { kind: 'monk', name: 'Brother Jun', hi: 'The prayer wheel squeaks. Perhaps you could help an old monk?' },
  { kind: 'farmer', name: 'Old Hana', hi: 'My rice will not grow. They say the shrine knows why.' },
  { kind: 'child', name: 'Little Sora', hi: 'I lost my lucky charm on the steps. Can you make me a new one?' },
  { kind: 'merchant', name: 'Kenji the Trader', hi: 'I buy and sell luck. Mostly buy.' },
  { kind: 'ronin', name: 'Ronin Tetsu', hi: 'A wandering sword needs a reason to keep wandering.' },
  { kind: 'fox', name: 'Kohaku', hi: 'A fox spirit tilts its head. It wants something shiny.' },
];
export function makeVisitor(cx, r = Math.random) {
  const v = pick(VISITORS, r()), best = cx.bestN(), ms = monScale(best), dn = cx.drawN();
  const types = ['bring', 'draw', 'find', 'mon'], type = pick(types, r());
  let req;
  if (type === 'bring') {
    const cands = cx.foundCore().filter(a => a.n <= Math.max(50, best / 50)).sort((a, b) => b.n - a.n).slice(0, 12);
    const a = cands.length ? pick(cands, r()) : null;
    if (a) { const k = a.n < 50 ? 8 : a.n < 500 ? 4 : a.n < 5000 ? 2 : 1; req = { type, aura: a.id, goal: k, text: `Bring ${k} × ${a.name}` }; }
  }
  if (!req && type === 'mon') { const m = nice(Math.max(100, cx.S.mon * 0.15)); req = { type, goal: m, text: `Offer ${m.toLocaleString('en-US')} mon` }; }
  if (!req && (type === 'find' || type === 'bring')) { const x = nice(Math.max(100, best / 30)); req = { type: 'find', goal: x, text: `Draw an aura of 1 in ${x.toLocaleString('en-US')} or rarer` }; }
  if (!req) { const n = nice(200 * Math.max(1, dn)); req = { type: 'draw', goal: n, text: `Roll ${n.toLocaleString('en-US')} auras` }; }
  const reward = req.type === 'mon'
    ? { tokens: 10, charm: charmFor(best), perm: { luck: 1 } }
    : { mon: ms * (2 + Math.floor(r() * 3)), charm: charmFor(best), ...(r() < 0.25 ? { perm: { luck: 1 } } : {}) };
  return { ...v, req, reward, progress: 0, until: Date.now() + 15 * 6e4 };
}

// ---------- daily quests (same three for everyone on a given day)
const DAILY = [
  { id: 'roll', make: cx => { const n = nice(500 * Math.max(1, cx.drawN() / 2)); return { goal: n, text: `Roll ${n.toLocaleString('en-US')} auras` }; } },
  { id: 'rare', make: cx => { const x = nice(Math.max(1000, cx.bestN() / 100)); return { goal: x, text: `Draw an aura of 1 in ${x.toLocaleString('en-US')} or rarer` }; } },
  { id: 'craft', make: () => ({ goal: 2, text: 'Craft 2 charms' }) },
  { id: 'use', make: () => ({ goal: 2, text: 'Use 2 charms' }) },
  { id: 'buy', make: () => ({ goal: 3, text: 'Buy 3 offerings' }) },
  { id: 'visitor', make: () => ({ goal: 1, text: 'Help a shrine visitor' }) },
  { id: 'new', make: () => ({ goal: 2, text: 'Find 2 new auras' }) },
  { id: 'night', make: cx => { const n = nice(200 * Math.max(1, cx.drawN() / 2)); return { goal: n, text: `Roll ${n.toLocaleString('en-US')} auras at night` }; } },
  { id: 'weather', make: cx => { const n = nice(150 * Math.max(1, cx.drawN() / 2)); return { goal: n, text: `Roll ${n.toLocaleString('en-US')} auras in rain, snow, fog or storm` }; } },
];
const seeded = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); };
export function makeDailies(day, cx) {
  const r = seeded(day), pool = [...DAILY], out = [], ms = monScale(cx.bestN());
  while (out.length < 3) { const d = pool.splice(Math.floor(r() * pool.length), 1)[0]; out.push({ id: d.id, ...d.make(cx), progress: 0, done: false, claimed: false, reward: { mon: ms * 3, charm: charmFor(cx.bestN()) } }); }
  return { day, list: out, bonus: false };
}
export const DAILY_BONUS = { tokens: 20, perm: { luck: 0.5 } };

// ---------- the shrine's story
export const STORY = [
  { title: 'The Quiet Shrine', text: 'The shrine at the end of the mountain road has been empty for years. Its lanterns still burn. Someone must have kept them lit.', goal: ['rolls', 50], goalText: 'Roll 50 auras', reward: { mon: 300 } },
  { title: 'The First Offering', text: 'An old offering box sits by the gate. The coins inside are older than the village. A note says: luck answers those who give.', goal: ['prayer', 3], goalText: 'Reach Prayer Lv 3', reward: { mon: 600, charm: 'paper', n: 3 } },
  { title: 'Visitors at Dusk', text: 'At dusk, footsteps on the stone steps. Travelers have heard the lanterns are lit again.', goal: ['visitors', 1], goalText: 'Help a shrine visitor', reward: { charm: 'red', n: 2, perm: { luck: 1 } } },
  { title: 'The Fortune Box', text: 'Under the floor of the offering hall you find a box of unopened fortune slips, each one a different color.', goal: ['found', 50], goalText: 'Find 50 different auras', reward: { mon: 3000 } },
  { title: 'Charms of Paper', text: 'A book of folding patterns, half eaten by moths. The keepers used to fold luck into paper.', goal: ['crafted', 5], goalText: 'Craft 5 charms', reward: { charm: 'gold', n: 1, perm: { mon: 5 } } },
  { title: 'The Lantern Keeper', text: 'A ghostly keeper appears by the stone lanterns. "Someone has to carry the light," she says, and hands you hers.', goal: ['best', 1e4], goalText: 'Draw an aura of 1 in 10,000 or rarer', reward: { title: 'Lantern Bearer', perm: { luck: 2 } } },
  { title: 'A Friend Follows', text: 'Small footprints in the snow around the shrine. Something has decided you are worth following.', goal: ['pets', 1], goalText: 'Adopt a pet', reward: { mon: 20000 } },
  { title: 'A New Horizon', text: 'The keeper shows you that the shrine gate can open onto other places, if you know how to ask.', goal: ['biomes', 1], goalText: 'Unlock a backdrop', reward: { perm: { luck: 2 } } },
  { title: 'The Thousand Gates', text: 'The path of a thousand torii climbs into fog. Each gate you pass hums with an old wish.', goal: ['found', 250], goalText: 'Find 250 different auras', reward: { charm: 'heaven', n: 1 } },
  { title: 'Echoes of Legend', text: 'The bells ring by themselves at midnight. The keeper whispers that the old legends are waking up.', goal: ['best', 1e6], goalText: 'Draw an aura of 1 in 1,000,000 or rarer', reward: { title: 'Legend Seeker', perm: { luck: 3 } } },
  { title: 'The Last Lantern', text: 'One lantern above the gate has never been lit. The keeper says it is waiting for enough luck to fill it.', goal: ['found', 500], goalText: 'Find 500 different auras', reward: { charm: 'star', n: 1 } },
  { title: 'Lucklight', text: 'The last lantern flickers. Somewhere far above, a legend turns to look at the shrine, and at you.', goal: ['legends', 1], goalText: 'Draw a legend (1 in a billion or rarer)', reward: { title: 'Keeper of Lucklight', perm: { luck: 5 } } },
];
export function storyValue(cx, key) {
  return { rolls: cx.S.rolls, prayer: cx.S.up.luck, visitors: cx.S.stats.visitors, found: cx.foundCore().length, crafted: cx.S.stats.crafted, best: cx.bestN(), pets: cx.petsOwned(), biomes: cx.biomesOwned(), legends: cx.legendsFound() }[key] || 0;
}

// ---------- achievements: small permanent buffs and titles
const A = [];
const add = (id, name, key, goal, title) => A.push({ id, name, key, goal, title, reward: A.length % 2 ? { perm: { mon: 3 } } : { perm: { luck: 1 } } });
[[100, 'Pilgrim'], [1e3], [1e4, 'Devotee'], [1e5], [1e6, 'Ascetic'], [1e7, 'Eternal Pilgrim']].forEach(([g, t]) => add(`rolls${g}`, `Roll ${g.toLocaleString('en-US')} auras`, 'rolls', g, t));
[[10], [50], [100, 'Collector'], [250], [500, 'Curator'], [750], [1000, 'Archivist']].forEach(([g, t]) => add(`found${g}`, `Find ${g} different auras`, 'found', g, t));
[[1e3, 'Lucky'], [1e4], [1e5, 'Fortunate'], [1e6, 'Blessed'], [1e7], [1e8, 'Favored'], [1e9, 'Chosen'], [1e10], [1e11, 'Mythic'], [1e12, 'Lucklight']].forEach(([g, t]) => add(`best${g}`, `Draw a 1 in ${g.toLocaleString('en-US')} aura`, 'best', g, t));
[[1e3], [1e5], [1e7, 'Wealthy'], [1e9, 'Tycoon']].forEach(([g, t]) => add(`mon${g}`, `Earn ${g.toLocaleString('en-US')} mon`, 'monEarned', g, t));
[[1], [25], [250, 'Charmer']].forEach(([g, t]) => add(`used${g}`, `Use ${g} charm${g > 1 ? 's' : ''}`, 'used', g, t));
[[10], [100]].forEach(([g]) => add(`crafted${g}`, `Craft ${g} charms`, 'crafted', g));
[[1], [10, 'Good Neighbor'], [50, 'Friend of Visitors']].forEach(([g, t]) => add(`visitors${g}`, `Help ${g} visitor${g > 1 ? 's' : ''}`, 'visitors', g, t));
[[3], [30, 'Diligent'], [100]].forEach(([g, t]) => add(`dailies${g}`, `Finish ${g} daily quests`, 'dailies', g, t));
[[3], [7, 'Faithful'], [30, 'Devoted']].forEach(([g, t]) => add(`streak${g}`, `Log in ${g} days in a row`, 'streak', g, t));
[[1, 'Legend'], [10], [25, 'Myth Keeper'], [50, 'Lore Master']].forEach(([g, t]) => add(`legends${g}`, `Draw ${g} legend${g > 1 ? 's' : ''}`, 'legends', g, t));
[[1], [5], [10, 'Artisan']].forEach(([g, t]) => add(`gear${g}`, `Own ${g} gear piece${g > 1 ? 's' : ''}`, 'gear', g, t));
[[1], [5, 'Beast Friend']].forEach(([g, t]) => add(`pets${g}`, `Adopt ${g} pet${g > 1 ? 's' : ''}`, 'pets', g, t));
[[1], [6, 'Wanderer']].forEach(([g, t]) => add(`biomes${g}`, `Unlock ${g} backdrop${g > 1 ? 's' : ''}`, 'biomes', g, t));
[[5], [10, 'Harvest Hero']].forEach(([g, t]) => add(`fest${g}`, `Find ${g} festival auras`, 'fest', g, t));
export const ACHIEVEMENTS = A;
export function achValue(cx, key) {
  const st = cx.S.stats;
  return { rolls: cx.S.rolls, found: cx.foundCore().length, best: cx.bestN(), monEarned: st.monEarned, used: st.used, crafted: st.crafted, visitors: st.visitors, dailies: st.dailies, streak: cx.S.streak.days, legends: cx.legendsFound(), gear: cx.gearCount(), pets: cx.petsOwned(), biomes: cx.biomesOwned(), fest: cx.festFound() }[key] || 0;
}

// ---------- login streak
export function streakReward(day, bonus, bestN) {
  const ms = monScale(bestN);
  return { mon: Math.round((ms + 150 * Math.min(day, 30)) * (1 + bonus)), charm: day % 7 === 0 ? 'gold' : day % 3 === 0 ? 'red' : 'paper', ...(day % 7 === 0 ? { tokens: 20, perm: { luck: 0.5 } } : {}) };
}
