// Lucklight game data: auras, upgrades, charms and gear. Pure data, also imported by the Worker.

// n = base odds "1 in n". c = pixel palette (dark -> light). fx = effect in fx.js.
export const AURAS = [
  { id: 'dust',      name: 'Dust',      n: 2,             fx: 'motes',     c: ['#6f6658', '#a89c86', '#d6cbb3'] },
  { id: 'moss',      name: 'Moss',      n: 5,             fx: 'leaves',    c: ['#3f5a2a', '#6f8f3a', '#a9c45a'] },
  { id: 'rain',      name: 'Rain',      n: 12,            fx: 'rain',      c: ['#3b5a8a', '#6f9ccf', '#b7d6f2'] },
  { id: 'firefly',   name: 'Firefly',   n: 30,            fx: 'fireflies', c: ['#5a6a1a', '#c9d84a', '#f4f7a0'] },
  { id: 'ember',     name: 'Ember',     n: 75,            fx: 'flame',     c: ['#7a1f12', '#d2562a', '#f2a24a', '#ffe08a'] },
  { id: 'sakura',    name: 'Sakura',    n: 200,           fx: 'petals',    c: ['#a8406a', '#e58fb0', '#f8d2de'] },
  { id: 'frost',     name: 'Frost',     n: 500,           fx: 'frost',     c: ['#4a7a9a', '#9fd0e6', '#f0fbff'] },
  { id: 'tide',      name: 'Tide',      n: 1200,          fx: 'waves',     c: ['#1d4f6e', '#2f86a8', '#8fe0e8', '#e8fbff'] },
  { id: 'thunder',   name: 'Thunder',   n: 3000,          fx: 'bolts',     c: ['#3a2f7a', '#8a7ae0', '#f2e05a', '#ffffff'] },
  { id: 'lantern',   name: 'Lantern',   n: 8000,          fx: 'lanterns',  c: ['#7a2416', '#d9532c', '#f6c25a', '#fff0b0'] },
  { id: 'kitsune',   name: 'Kitsune',   n: 20000,         fx: 'foxfire',   c: ['#2a4a8a', '#5a9af0', '#c8e8ff', '#ffffff'] },
  { id: 'eclipse',   name: 'Eclipse',   n: 60000,         fx: 'eclipse',   c: ['#08060c', '#3a2a40', '#c8862a', '#f6d36a'] },
  { id: 'comet',     name: 'Comet',     n: 150000,        fx: 'comets',    c: ['#1c2f5a', '#4a78c8', '#9fc4ff', '#ffffff'] },
  { id: 'oni',       name: 'Oni',       n: 400000,        fx: 'oni',       c: ['#3a0a0a', '#8a1a14', '#d83a22', '#ff8a4a'] },
  { id: 'aurora',    name: 'Aurora',    n: 1000000,       fx: 'aurora',    c: ['#1e8a6a', '#5ad6a0', '#9a6ae0', '#e0f0ff'] },
  { id: 'glitch',    name: 'Glitch',    n: 3000000,       fx: 'glitch',    c: ['#101010', '#ff2a6a', '#2affd0', '#ffffff'] },
  { id: 'dragon',    name: 'Dragon',    n: 10000000,      fx: 'dragon',    c: ['#0f4a3a', '#2fa070', '#8ad86a', '#f2d24a'] },
  { id: 'halo',      name: 'Halo',      n: 50000000,      fx: 'halo',      c: ['#a07a2a', '#e6c060', '#fff0b8', '#ffffff'] },
  { id: 'void',      name: 'Void',      n: 250000000,     fx: 'void',      c: ['#000000', '#2a0a3a', '#7a3aff', '#e0d0ff'] },
  { id: 'lucklight', name: 'Lucklight', n: 1500000000,    fx: 'lucklight', c: ['#ff6a5a', '#ffc04a', '#8ae06a', '#5ac8ff', '#b88aff', '#fff6d0'] },
];
export const AURA = Object.fromEntries(AURAS.map(a => [a.id, a]));

// mon (shrine coins) earned for drawing an aura
export const reward = n => Math.max(1, Math.round(Math.sqrt(n) / 1.5));

// omikuji grade by rarity tier (tier also sets how big the reveal is)
export const tierOf = n => n >= 1e8 ? 4 : n >= 1e6 ? 3 : n >= 1e4 ? 2 : n >= 100 ? 1 : 0;
export const GRADES = [
  { kanji: '末吉', word: 'Future luck' },
  { kanji: '小吉', word: 'Small luck' },
  { kanji: '中吉', word: 'Middle luck' },
  { kanji: '大吉', word: 'Great luck' },
  { kanji: '大大吉', word: 'Greatest luck' },
];

// permanent upgrades bought with mon
export const UPGRADES = [
  { id: 'luck',    name: 'Prayer',        max: 25, cost: l => Math.round(20 * 1.65 ** l),  desc: l => `Luck x${(1.15 ** l).toFixed(2)} → x${(1.15 ** (l + 1)).toFixed(2)}` },
  { id: 'speed',   name: 'Quick Hands',   max: 12, cost: l => Math.round(30 * 1.8 ** l),   desc: l => `Draw every ${(cooldownBase(l) / 1000).toFixed(2)}s → ${(cooldownBase(l + 1) / 1000).toFixed(2)}s` },
  { id: 'fortune', name: 'Tenth Bell',    max: 9,  cost: l => Math.round(200 * 2.2 ** l), desc: l => `Every 10th draw: luck x${l + 1} → x${l + 2}` },
  { id: 'auto',    name: 'Shrine Helper', max: 1,  cost: () => 250,                         desc: () => 'Unlocks auto-draw' },
];
export const cooldownBase = l => 1100 * 0.9 ** l;

// charms: crafted from auras + mon, used from the charm box
//   mult + secs: timed luck boost (same charm extends time, different charms multiply)
//   once: next draw only
export const CHARMS = [
  { id: 'paper',  name: 'Paper Charm', mult: 2,    secs: 90,  need: { dust: 10, moss: 4 },                 mon: 15 },
  { id: 'red',    name: 'Red Charm',   mult: 3,    secs: 120, need: { rain: 6, firefly: 3, ember: 1 },     mon: 120 },
  { id: 'gold',   name: 'Gold Charm',  mult: 4,    secs: 180, need: { sakura: 3, frost: 2, tide: 1 },      mon: 900 },
  { id: 'heaven', name: 'Heaven Slip', mult: 250,  once: true, need: { frost: 4, thunder: 1, lantern: 1 }, mon: 6000 },
  { id: 'star',   name: 'Star Slip',   mult: 4000, once: true, need: { kitsune: 1, eclipse: 1, comet: 1 }, mon: 80000 },
];

// gear: crafted once, worn in two slots. luck = added to the gear multiplier, speed = faster draws
export const GEAR = [
  { id: 'mossband',  slot: 'hand', name: 'Moss Band',        luck: 0.3, speed: 0,    need: { moss: 12, dust: 20 },                 mon: 40 },
  { id: 'rainbell',  slot: 'neck', name: 'Rain Bell',        luck: 0.5, speed: 0.05, need: { rain: 10, firefly: 3 },               mon: 120 },
  { id: 'emberglove',slot: 'hand', name: 'Ember Glove',      luck: 1,   speed: 0,    need: { ember: 4, sakura: 2, rain: 8 },       mon: 400 },
  { id: 'frostmirror',slot:'neck', name: 'Frost Mirror',     luck: 1.5, speed: 0,    need: { frost: 3, tide: 1, sakura: 4 },       mon: 1500 },
  { id: 'gauntlet',  slot: 'hand', name: 'Thunder Gauntlet', luck: 2.5, speed: 0.1,  need: { thunder: 2, tide: 2, frost: 3 },      mon: 4000 },
  { id: 'foxmask',   slot: 'neck', name: 'Fox Mask',         luck: 3,   speed: 0.05, need: { kitsune: 1, lantern: 2, thunder: 2 }, mon: 15000 },
  { id: 'eclipseglove',slot:'hand',name: 'Eclipse Glove',    luck: 4,   speed: 0.1,  need: { eclipse: 1, kitsune: 1, lantern: 2 }, mon: 40000 },
  { id: 'cometstone',slot: 'neck', name: 'Comet Stone',      luck: 6,   speed: 0.1,  need: { comet: 1, eclipse: 1, lantern: 3 },   mon: 120000 },
];
