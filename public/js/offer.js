// Lucklight offerings, wave 3: 17 upgrade lines and 13 one-time unlocks (helpers, ring slot, backdrops, pets).
import { BIOMES } from './world.js';

// upgrade lines. eff(l) = the bonus at level l; desc shows now → next.
const pct = v => `${Math.round(v * 100)}%`;
export const LINES = [
  { id: 'mon', name: 'Golden Box', max: 20, base: 150, g: 1.35, eff: l => 0.1 * l, desc: (a, b) => `Mon from draws +${pct(a)} → +${pct(b)}` },
  { id: 'bargain', name: 'Bargain Prayer', max: 15, base: 400, g: 1.5, eff: l => 0.02 * l, desc: (a, b) => `All offerings cost ${pct(a)} → ${pct(b)} less` },
  { id: 'crit', name: 'Lucky Streak', max: 20, base: 250, g: 1.4, eff: l => 0.01 * l, desc: (a, b) => `${pct(a)} → ${pct(b)} chance each roll draws a bonus aura` },
  { id: 'deep', name: 'Deep Prayer', max: 20, base: 5000, g: 1.6, eff: l => 1.06 ** l, desc: (a, b) => `Luck ×${a.toFixed(2)} → ×${b.toFixed(2)}` },
  { id: 'swift', name: 'Second Wind', max: 10, base: 800, g: 1.55, eff: l => 0.03 * l, desc: (a, b) => `Draws ${pct(a)} → ${pct(b)} faster` },
  { id: 'favor', name: "Fortune's Favor", max: 10, base: 400, g: 1.5, eff: l => 0.25 * l, desc: (a, b) => `Mon from 1 in 1,000+ auras +${pct(a)} → +${pct(b)}` },
  { id: 'bell', name: 'Quick Bell', max: 5, base: 2000, g: 2.5, eff: l => 10 - l, desc: (a, b) => `Tenth bell rings every ${a} → ${b} draws` },
  { id: 'charmtime', name: 'Long Charms', max: 10, base: 300, g: 1.5, eff: l => 0.1 * l, desc: (a, b) => `Timed charms last +${pct(a)} → +${pct(b)}` },
  { id: 'charmpow', name: 'Strong Charms', max: 10, base: 500, g: 1.55, eff: l => 0.05 * l, desc: (a, b) => `Timed charm luck +${pct(a)} → +${pct(b)}` },
  { id: 'slipfold', name: 'Slip Folding', max: 10, base: 1000, g: 1.6, eff: l => 0.1 * l, desc: (a, b) => `One-roll slips +${pct(a)} → +${pct(b)}` },
  { id: 'purse', name: 'Token Purse', max: 10, base: 300, g: 1.45, eff: l => 0.1 * l, desc: (a, b) => `Harvest tokens +${pct(a)} → +${pct(b)}` },
  { id: 'oil', name: 'Lantern Oil', max: 5, base: 800, g: 1.8, eff: l => l, desc: (a, b) => `Each Harvest Lantern lasts +${a} → +${b} min` },
  { id: 'basket', name: 'Gift Basket', max: 10, base: 300, g: 1.5, eff: l => 0.15 * l, desc: (a, b) => `Login rewards +${pct(a)} → +${pct(b)}` },
  { id: 'scholar', name: 'Quest Scholar', max: 10, base: 400, g: 1.5, eff: l => 0.1 * l, desc: (a, b) => `Quest rewards +${pct(a)} → +${pct(b)}` },
  { id: 'treats', name: 'Pet Treats', max: 10, base: 500, g: 1.5, eff: l => 0.1 * l, desc: (a, b) => `Pet bonus +${pct(a)} → +${pct(b)}` },
  { id: 'attune', name: 'Backdrop Attunement', max: 10, base: 600, g: 1.5, eff: l => 0.1 * l, desc: (a, b) => `Backdrop boost +${pct(a)} → +${pct(b)}` },
  { id: 'sense', name: 'Weather Sense', max: 10, base: 600, g: 1.5, eff: l => 0.1 * l, desc: (a, b) => `Weather and time-of-day boosts +${pct(a)} → +${pct(b)}` },
];
export const LINE = Object.fromEntries(LINES.map(l => [l.id, l]));
export const lineCost = (ln, l, bargain) => Math.round(ln.base * ln.g ** l * (1 - bargain));

// pets: one active at a time
export const PETS = [
  { id: 'fox', name: 'Fox', cost: 3000, kind: 'luck', v: 0.1, desc: 'Luck +10%' },
  { id: 'cat', name: 'Cat', cost: 8000, kind: 'mon', v: 0.25, desc: 'Mon +25%' },
  { id: 'tanuki', name: 'Tanuki', cost: 20000, kind: 'charm', v: 0.25, desc: 'Charms last +25%' },
  { id: 'crane', name: 'Crane', cost: 50000, kind: 'speed', v: 0.08, desc: 'Draws 8% faster' },
  { id: 'dragonling', name: 'Dragonling', cost: 250000, kind: 'luck', v: 0.25, desc: 'Luck +25%' },
];
export const PET = Object.fromEntries(PETS.map(p => [p.id, p]));

// one-time unlocks (biomes and pets are bought from their own lists)
export const UNLOCKS = [
  { id: 'helper', name: 'Charm Helper', cost: 25000, desc: 'When a timed charm runs out, it relights itself if you hold another.' },
  { id: 'ring', name: 'Ring Slot', cost: 60000, desc: 'A third gear slot that holds any piece you own.' },
];
export const OFFER_COUNT = LINES.length + UNLOCKS.length + PETS.length + BIOMES.filter(b => b.cost).length; // 17 + 2 + 5 + 6 = 30
