// Lucklight game data: auras, upgrades, charms and gear. Pure data, also imported by the Worker.

// n = base odds "1 in n". c = pixel palette (dark -> light).
// fx = effect name in fx.js, or a list of layers: names or { f, ...params, c? } (c overrides the palette for that layer)
import { GEN, EVENT, EVENT_AURAS } from './more.js';
export { EVENT };
const A = (id, name, n, fx, c, tint) => ({ id, name, n, fx, c, ...(tint ? { tint } : {}) });
const BASE = [
  A('dust', 'Dust', 2, 'motes', ['#6f6658', '#a89c86', '#d6cbb3']),
  A('pebble', 'Pebble', 3, [{ f: 'orbit', n: 4, r: 13, ry: 3, y: 6, sp: 0.6 }], ['#4a443c', '#7a7266', '#a39a8a', '#c8bfae']),
  A('breeze', 'Breeze', 4, [{ f: 'breeze', n: 6 }], ['#8aa0a8', '#b8ccd0', '#dceaea', '#ffffff']),
  A('moss', 'Moss', 5, 'leaves', ['#3f5a2a', '#6f8f3a', '#a9c45a']),
  A('puddle', 'Puddle', 6, [{ f: 'ripple', n: 2, r: 16, per: 2, drop: 1 }], ['#3a5a7a', '#5a86a8', '#8fb8d8', '#d0e8f8']),
  A('clover', 'Clover', 8, [{ f: 'orbit', g: 'clover', n: 4, r: 16, sp: 0.7 }], ['#2f5a2a', '#4f8a3a', '#9fd06a', '#e0f8b0']),
  A('sprout', 'Sprout', 10, [{ f: 'rise', g: 'leaf', n: 8, per: 3 }], ['#5a4a2a', '#4f8a3a', '#9fd06a', '#d0f0a0']),
  A('rain', 'Rain', 12, 'rain', ['#3b5a8a', '#6f9ccf', '#b7d6f2']),
  A('pollen', 'Pollen', 15, [{ f: 'rise', n: 22, per: 4, w: 34, sway: 4 }], ['#a08a2a', '#e0c84a', '#f8e88a', '#fff8d0']),
  A('dew', 'Dew', 18, [{ f: 'fall', g: 'drop', n: 8, per: 2.5 }], ['#4a8aa8', '#7ac0d8', '#c8f0f8', '#ffffff']),
  A('bubble', 'Bubble', 22, [{ f: 'rise', g: 'bubble', n: 6, per: 4 }], ['#4a7aa8', '#8ac8e8', '#e0f8ff', '#ffffff']),
  A('spark', 'Spark', 26, [{ f: 'rise', n: 18, per: 1, h: 22, sway: 0 }, { f: 'ripple', n: 1, r: 12, per: 1 }], ['#a85a1a', '#f0a03a', '#ffe07a', '#ffffff']),
  A('firefly', 'Firefly', 30, 'fireflies', ['#5a6a1a', '#c9d84a', '#f4f7a0']),
  A('smoke', 'Smoke', 38, [{ f: 'smoke' }], ['#3a3640', '#5a5662', '#8a8692', '#b8b4c0']),
  A('chime', 'Chime', 46, [{ f: 'rings', n: 1, r: 14, tilt: 0.2, sp: 2 }, { f: 'rise', g: 'note', n: 4, per: 3 }], ['#6a5a2a', '#c8a040', '#f0d880', '#fff8e0']),
  A('maple', 'Maple', 55, 'petals', ['#7a2a10', '#d8582a', '#f0a040', '#ffd890']),
  A('wisp', 'Wisp', 65, [{ f: 'orbit', g: 'drop', n: 3, r: 15, ry: 6, sp: 1.4 }, 'motes'], ['#2a6a7a', '#5ac8d8', '#c0f8ff', '#ffffff']),
  A('ember', 'Ember', 75, 'flame', ['#7a1f12', '#d2562a', '#f2a24a', '#ffe08a']),
  A('koi', 'Koi', 95, [{ f: 'ripple', n: 2, r: 20, per: 2.5, c: ['#2a4a6a', '#4a7aa8', '#8ac0e0', '#d0f0ff'] }, { f: 'orbit', g: 'fish', n: 3, r: 18, ry: 4, y: 7, sp: 0.8, bob: 0.5 }], ['#1a1420', '#f05a2a', '#ffffff', '#ffd0a0']),
  A('ripple', 'Ripple', 120, [{ f: 'ripple', n: 4, r: 24, per: 1.4 }, { f: 'ripple', n: 2, r: 20, y: -2, flat: 0.9, per: 2 }], ['#2a3a6a', '#4a6ab8', '#8aa8f0', '#e0e8ff']),
  A('origami', 'Origami', 145, [{ f: 'orbit', g: 'crane', n: 4, r: 19, ry: 6, sp: 0.9, bob: 3 }], ['#8a2a2a', '#d84a3a', '#f0e0c8', '#ffffff']),
  A('candle', 'Candle', 170, [{ f: 'orbit', g: 'candle', n: 5, r: 16, ry: 4, y: 6, sp: 0.4, bob: 0 }, 'motes'], ['#a8987a', '#e8dcc0', '#f0a03a', '#ffe880']),
  A('sakura', 'Sakura', 200, 'petals', ['#a8406a', '#e58fb0', '#f8d2de']),
  A('bamboo', 'Bamboo', 240, [{ f: 'fall', g: 'leaf', n: 8, per: 3.5 }, { f: 'breeze', n: 4 }], ['#2a4a1a', '#4a7a2a', '#8ac04a', '#d0f0a0']),
  A('bell', 'Bell', 290, [{ f: 'ripple', y: -2, flat: 0.8, r: 26, n: 3, per: 1.8 }, { f: 'orbit', g: 'bell', n: 3, r: 17, sp: 0.6 }], ['#7a5a1a', '#d0a040', '#f8e08a', '#ffffff']),
  A('moth', 'Moth', 350, [{ f: 'orbit', g: 'moth', n: 5, r: 14, ry: 8, sp: 1.8, bob: 3 }, 'fireflies'], ['#6a6058', '#b0a898', '#e8e0d0', '#ffffff']),
  A('wisteria', 'Wisteria', 420, ['petals', { f: 'fall', g: 'petal', n: 6, per: 3 }], ['#4a2a6a', '#8a5ac0', '#c8a8f0', '#f0e0ff']),
  A('maneki', 'Maneki', 460, [{ f: 'rise', g: 'coin', n: 9, per: 2.2 }, { f: 'ripple', n: 2, per: 2 }], ['#8a5a1a', '#d8a030', '#f8e070', '#ffffff']),
  A('frost', 'Frost', 500, 'frost', ['#4a7a9a', '#9fd0e6', '#f0fbff']),
  A('mist', 'Mist', 600, [{ f: 'smoke', n: 12, w: 50, h: 14, y: 9, size: 5, per: 5 }, { f: 'breeze', n: 3, sp: 15 }], ['#8a9aa8', '#b8c8d0', '#dce8ec', '#ffffff']),
  A('echo', 'Echo', 720, [{ f: 'ripple', y: -2, flat: 0.85, r: 30, n: 3, per: 2 }], ['#3a2a5a', '#6a5aa8', '#a898e0', '#e8e0ff']),
  A('ink', 'Ink', 850, [{ f: 'smoke', n: 10, size: 4, per: 3 }, { f: 'fall', g: 'drop', n: 6, per: 2 }], ['#0a0a10', '#1a1a24', '#3a3a48', '#6a6a7a'], 'rgba(0,0,0,0.2)'),
  A('snowfall', 'Snowfall', 1000, [{ f: 'fall', g: 'flake', n: 14, per: 5, w: 44 }], ['#6a8aa8', '#b8d8f0', '#ffffff', '#ffffff']),
  A('tide', 'Tide', 1200, 'waves', ['#1d4f6e', '#2f86a8', '#8fe0e8', '#e8fbff']),
  A('crystal', 'Crystal', 1450, [{ f: 'orbit', g: 'shard', n: 5, r: 17, sp: 0.7 }], ['#2a4a8a', '#5a8ae0', '#a8d0ff', '#ffffff']),
  A('hearth', 'Hearth', 1750, ['flame', { f: 'rise', n: 12, per: 1.4, h: 36 }], ['#5a1a0a', '#c84a1a', '#f09a2a', '#ffe68a']),
  A('shamisen', 'Shamisen', 2100, [{ f: 'rise', g: 'note', n: 8, per: 3, w: 34 }, { f: 'rings', n: 1, r: 15, sp: 0.8, tilt: 0 }], ['#3a2a1a', '#a8783a', '#f0d8a0', '#ffffff']),
  A('stormcloud', 'Storm Cloud', 2500, [{ f: 'smoke', n: 10, y: -18, h: 6, w: 34, size: 5, per: 6 }, { f: 'fall', g: 'drop', n: 10, per: 1.2 }], ['#2a2a3a', '#4a4a5a', '#d8d8f0', '#ffffff'], 'rgba(10,10,20,0.25)'),
  A('thunder', 'Thunder', 3000, 'bolts', ['#3a2f7a', '#8a7ae0', '#f2e05a', '#ffffff']),
  A('runes', 'Runes', 3600, [{ f: 'orbit', g: 'rune', n: 6, r: 17, sp: 0.6 }, { f: 'ripple', n: 2 }], ['#1a2a4a', '#3a6ab8', '#7ae0ff', '#ffffff']),
  A('prism', 'Prism', 4300, [{ f: 'rays', n: 6 }, { f: 'orbit', g: 'shard', n: 3, r: 16, sp: 1 }], ['#ff6a5a', '#ffd04a', '#6ad08a', '#5ab0ff', '#b88aff']),
  A('owl', 'Owl', 5200, [{ f: 'eyes', n: 5, w: 70 }, { f: 'orbit', g: 'feather', n: 4, r: 17, sp: 0.5 }], ['#1a1420', '#d8a030', '#f8e070', '#ffffff'], 'rgba(0,0,0,0.2)'),
  A('ghostfire', 'Ghostfire', 6200, [{ f: 'foxfire', noEars: 1 }], ['#1a4a3a', '#3ac8a0', '#b0fff0', '#ffffff']),
  A('daruma', 'Daruma', 7200, [{ f: 'orbit', g: 'daruma', n: 3, r: 18, sp: 0.6, bob: 2 }, { f: 'ripple', n: 2 }], ['#5a0a0a', '#c8302a', '#f0e0c0', '#1a1420']),
  A('lantern', 'Lantern', 8000, 'lanterns', ['#7a2416', '#d9532c', '#f6c25a', '#fff0b0']),
  A('blizzard', 'Blizzard', 9500, [{ f: 'breeze', n: 16, sp: 70 }, { f: 'fall', g: 'flake', n: 10, per: 2, w: 50 }], ['#8ab0d0', '#d0e8f8', '#ffffff', '#ffffff'], 'rgba(200,220,255,0.12)'),
  A('taiko', 'Taiko', 11500, [{ f: 'ripple', n: 3, r: 34, per: 0.9 }, { f: 'ripple', y: -2, flat: 0.85, r: 26, n: 2, per: 0.9 }], ['#5a1a0a', '#b84a2a', '#f0c870', '#fff0c0']),
  A('moonbeam', 'Moonbeam', 14000, [{ f: 'beam', w: 9 }], ['#4a5a8a', '#8aa0d8', '#d0e0ff', '#ffffff']),
  A('foxrain', 'Fox Rain', 17000, ['rain', 'foxfire'], ['#8a6a1a', '#e0b84a', '#fff0a0', '#ffffff']),
  A('kitsune', 'Kitsune', 20000, 'foxfire', ['#2a4a8a', '#5a9af0', '#c8e8ff', '#ffffff']),
  A('tengu', 'Tengu', 24000, [{ f: 'wings', len: 13, sp: 4 }, { f: 'fall', g: 'feather', n: 6, per: 3 }], ['#0a0a10', '#2a2a3a', '#4a4a5a', '#8a8aa0']),
  A('jade', 'Jade', 29000, [{ f: 'orbit', g: 'shard', n: 7, r: 18, sp: -0.8 }, { f: 'ripple', n: 2 }], ['#0a3a2a', '#2a8a5a', '#7ad8a0', '#e0fff0']),
  A('sandstorm', 'Sandstorm', 36000, [{ f: 'breeze', n: 26, sp: 85, len: 8 }, { f: 'smoke', n: 6, w: 60, h: 10, size: 5, per: 2 }], ['#7a5a2a', '#c8a060', '#f0d8a0', '#fff0d0'], 'rgba(200,160,90,0.18)'),
  A('chains', 'Chains', 45000, [{ f: 'orbit', g: 'link', n: 14, r: 17, ry: 4, sp: 1.2, bob: 0, y: 2 }, { f: 'orbit', g: 'link', n: 12, r: 15, ry: 4, sp: -1, bob: 0, y: -8 }], ['#2a2a30', '#6a6a78', '#b0b0c0', '#ffffff']),
  A('lotus', 'Lotus', 52000, [{ f: 'orbit', g: 'lotus', n: 8, r: 14, ry: 3, y: 8, sp: 0.3, bob: 0 }, { f: 'rise', g: 'petal', n: 8, per: 3.5 }], ['#8a2a5a', '#e070a0', '#ffc8e0', '#ffffff']),
  A('eclipse', 'Eclipse', 60000, 'eclipse', ['#08060c', '#3a2a40', '#c8862a', '#f6d36a']),
  A('bluefire', 'Bluefire', 72000, ['flame', { f: 'rise', n: 14, per: 1.2, h: 44 }], ['#0a1a5a', '#2a4ac8', '#5aa0ff', '#e0f4ff'], 'rgba(0,10,40,0.25)'),
  A('carp', 'Carp', 88000, [{ f: 'beam', w: 7, c: ['#1a3a6a', '#3a7ac0', '#8ac8f0', '#e0f8ff'] }, { f: 'rise', g: 'fish', n: 4, per: 2.5, w: 14, sway: 0 }], ['#1a1420', '#f0b030', '#ffffff', '#ffe8a0']),
  A('starfall', 'Starfall', 105000, [{ f: 'fall', g: 'star', n: 8, per: 1.6, w: 50 }, 'comets'], ['#2a2a6a', '#6a6ac8', '#c8c8ff', '#ffffff'], 'rgba(10,10,40,0.25)'),
  A('mirage', 'Mirage', 125000, ['aurora', { f: 'breeze', n: 5, sp: 20 }], ['#a86a3a', '#f0b070', '#f8e0a0', '#fff8e8'], 'rgba(240,180,100,0.12)'),
  A('comet', 'Comet', 150000, 'comets', ['#1c2f5a', '#4a78c8', '#9fc4ff', '#ffffff']),
  A('crown', 'Crown', 180000, ['crown', { f: 'rise', g: 'star', n: 6, per: 3 }, { f: 'ripple', n: 2 }], ['#7a5a1a', '#d8a030', '#f8e070', '#ffffff']),
  A('clockwork', 'Clockwork', 220000, [{ f: 'rings', n: 2, r: 16, tilt: 0.3, sp: 1 }, { f: 'orbit', g: 'gear', n: 4, r: 22, ry: 7, sp: -0.5 }], ['#4a3a2a', '#a87a3a', '#e0c080', '#fff0c0']),
  A('blades', 'Blades', 270000, [{ f: 'orbit', g: 'sword', n: 6, r: 17, ry: 5, sp: 2.2, bob: 0 }], ['#2a2a3a', '#8a8aa0', '#d0d8e8', '#ffffff']),
  A('thorn', 'Thorn', 330000, [{ f: 'helix', n: 36, r: 15, sp: 1, strands: 2 }, { f: 'orbit', g: 'thorn', n: 8, r: 20, sp: -0.4 }], ['#1a0a10', '#3a5a2a', '#8a1a2a', '#e04a5a']),
  A('oni', 'Oni', 400000, 'oni', ['#3a0a0a', '#8a1a14', '#d83a22', '#ff8a4a']),
  A('yurei', 'Yurei', 480000, [{ f: 'smoke', n: 8, per: 4, c: ['#3a4a5a', '#6a7a8a', '#a8b8c8', '#d8e8f0'] }, { f: 'orbit', g: 'ghost', n: 4, r: 19, ry: 7, sp: 0.7, bob: 3 }], ['#4a5a6a', '#d8e8f0', '#1a1420', '#ffffff'], 'rgba(20,40,60,0.3)'),
  A('bloodmoon', 'Blood Moon', 580000, ['eclipse', { f: 'fall', g: 'drop', n: 6, per: 2, c: ['#4a0008', '#a01020', '#ff4a40', '#ff8a70'] }], ['#2a0004', '#6a0a10', '#c81a20', '#ff6a50'], 'rgba(80,0,0,0.35)'),
  A('redstring', 'Red String', 700000, [{ f: 'helix', n: 50, r: 16, strands: 1, sp: 1.2 }, { f: 'orbit', g: 'heart', n: 4, r: 20, ry: 6, sp: 0.6 }], ['#5a0a14', '#d82a3a', '#ff8a9a', '#ffffff']),
  A('kirin', 'Kirin', 850000, ['dragon', { f: 'rise', g: 'star', n: 5, per: 3 }], ['#6a4a1a', '#e0c070', '#fff0c0', '#ffffff']),
  A('aurora', 'Aurora', 1000000, 'aurora', ['#1e8a6a', '#5ad6a0', '#9a6ae0', '#e0f0ff']),
  A('nebula', 'Nebula', 1250000, [{ f: 'galaxy', arms: 3, r: 34, flat: 0.5 }], ['#2a1040', '#c05ab0', '#5ab0e8', '#ffffff'], 'rgba(30,10,40,0.3)'),
  A('code', 'Code', 1600000, [{ f: 'matrix' }], ['#001a08', '#0a6a2a', '#3ae070', '#d0ffe0'], 'rgba(0,10,0,0.45)'),
  A('kagami', 'Kagami', 2000000, ['eclipse', { f: 'rings', n: 1, r: 20, tilt: -0.2, sp: 0.6 }], ['#c8d0e0', '#8a98b0', '#ffffff', '#e0f0ff']),
  A('static', 'Static', 2500000, ['glitch', { f: 'breeze', n: 12, sp: 120, len: 10 }], ['#101010', '#6a6a6a', '#c8c8c8', '#ffffff']),
  A('glitch', 'Glitch', 3000000, 'glitch', ['#101010', '#ff2a6a', '#2affd0', '#ffffff']),
  A('tsunami', 'Tsunami', 3700000, ['waves', { f: 'helix', n: 44, r: 20, sp: 2.5, strands: 2 }, { f: 'ripple', n: 3, r: 30, per: 1.2 }], ['#0a2a5a', '#1a6ab0', '#5ac0f0', '#e0faff']),
  A('raijin', 'Raijin', 4600000, ['bolts', { f: 'orbit', g: 'drum', n: 8, r: 20, ry: 6, sp: 0.8, y: -6 }], ['#2a1a5a', '#6a4ae0', '#f2e05a', '#ffffff'], 'rgba(20,10,50,0.3)'),
  A('phoenix', 'Phoenix', 5800000, [{ f: 'wings', len: 15, sp: 2.5 }, 'flame', { f: 'rise', g: 'feather', n: 6, per: 2 }], ['#6a0a0a', '#e04a1a', '#ffa030', '#fff0a0'], 'rgba(80,20,0,0.25)'),
  A('galaxy', 'Galaxy', 7500000, [{ f: 'galaxy', arms: 2, r: 42, flat: 0.4, sp: 0.6 }, { f: 'orbit', g: 'star', n: 3, r: 26, ry: 8, sp: 0.4 }], ['#100a2a', '#6a5ae0', '#e0b0ff', '#ffffff'], 'rgba(10,0,30,0.4)'),
  A('ryujin', 'Ryujin', 8800000, ['dragon', 'waves'], ['#0a2a4a', '#2a7ab8', '#8ad0f0', '#ffffff'], 'rgba(0,30,60,0.3)'),
  A('dragon', 'Dragon', 10000000, 'dragon', ['#0f4a3a', '#2fa070', '#8ad86a', '#f2d24a']),
  A('seraph', 'Seraph', 13000000, [{ f: 'beam', w: 8 }, { f: 'wings', n: 3, len: 13, sp: 2 }, { f: 'orbit', g: 'feather', n: 6, r: 22, ry: 6, sp: 0.4 }], ['#a07a2a', '#f0e0b0', '#fff8e0', '#ffffff']),
  A('chrono', 'Chrono', 18000000, [{ f: 'clock' }, { f: 'rings', n: 3, r: 15, tilt: 0.4, sp: 1.5 }], ['#2a1a4a', '#7a5ac0', '#e0c060', '#fff8d0'], 'rgba(20,10,40,0.3)'),
  A('abyss', 'Abyss', 25000000, ['void', { f: 'eyes', n: 14, w: 90 }], ['#000000', '#3a0a4a', '#c04aff', '#f0d0ff'], 'rgba(10,0,20,0.6)'),
  A('supernova', 'Supernova', 33000000, [{ f: 'rays', n: 10 }, { f: 'ripple', y: -4, flat: 0.9, r: 46, n: 3, per: 1.1 }, { f: 'rise', n: 20, per: 1, h: 40, w: 40 }], ['#5a1a6a', '#ff7a3a', '#ffd060', '#ffffff'], 'rgba(60,10,30,0.3)'),
  A('fujin', 'Fujin', 41000000, [{ f: 'breeze', n: 20, sp: 90, len: 12 }, { f: 'helix', n: 40, r: 18, sp: 3, strands: 3 }], ['#1a4a3a', '#4ab090', '#b0f0d8', '#ffffff']),
  A('halo', 'Halo', 50000000, 'halo', ['#a07a2a', '#e6c060', '#fff0b8', '#ffffff']),
  A('amaterasu', 'Amaterasu', 65000000, [{ f: 'rays', n: 12 }, 'eclipse', { f: 'beam', w: 10 }], ['#fff0a0', '#ffb030', '#ffd060', '#ffffff'], 'rgba(255,200,80,0.18)'),
  A('tsukuyomi', 'Tsukuyomi', 85000000, ['eclipse', { f: 'fall', g: 'star', n: 6, per: 3 }, { f: 'rings', n: 2, r: 18, sp: 0.5 }], ['#d8e0f0', '#8a9ac8', '#a8c0ff', '#ffffff'], 'rgba(10,20,50,0.4)'),
  A('singularity', 'Singularity', 110000000, [{ f: 'galaxy', arms: 3, r: 40, flat: 0.35, sp: 1.4, core: 7 }, 'void'], ['#000000', '#1a1a2a', '#ff9a3a', '#fff0d0'], 'rgba(0,0,0,0.55)'),
  A('milkyway', 'Milky Way', 150000000, [{ f: 'galaxy', arms: 4, r: 60, flat: 0.25, sp: 0.25 }, { f: 'orbit', g: 'star', n: 5, r: 28, ry: 10, sp: 0.3 }], ['#1a1a3a', '#8a8ac8', '#e8e0ff', '#ffffff'], 'rgba(5,5,25,0.45)'),
  A('susanoo', 'Susanoo', 200000000, [{ f: 'smoke', n: 10, y: -18, h: 6, w: 40, size: 5, per: 6 }, 'bolts', { f: 'orbit', g: 'sword', n: 3, r: 20, sp: 1.5 }, 'waves'], ['#0a1a3a', '#3a5ab0', '#a0c0ff', '#ffffff'], 'rgba(0,10,40,0.4)'),
  A('void', 'Void', 250000000, 'void', ['#000000', '#2a0a3a', '#7a3aff', '#e0d0ff']),
  A('genesis', 'Genesis', 320000000, [{ f: 'beam', w: 12 }, { f: 'rays', n: 8 }, { f: 'rise', g: 'leaf', n: 12, per: 2.5, w: 40 }], ['#3a6a2a', '#8ad86a', '#fff6c0', '#ffffff'], 'rgba(255,250,200,0.15)'),
  A('kami', 'Kami', 450000000, [{ f: 'rays', n: 16 }, { f: 'beam', w: 8 }, { f: 'rings', n: 2, r: 20, sp: 0.7 }, 'crown'], ['#a07a2a', '#f0c050', '#fff0b0', '#ffffff'], 'rgba(255,220,120,0.15)'),
  A('infinity', 'Infinity', 650000000, [{ f: 'galaxy', arms: 2, r: 30, flat: 0.4, sp: -0.5 }, { f: 'infinity', r: 30 }, { f: 'infinity', r: 20 }], ['#1a0a3a', '#8a5ae0', '#e0b0ff', '#ffffff'], 'rgba(20,0,40,0.4)'),
  A('paradox', 'Paradox', 900000000, ['void', 'glitch', { f: 'infinity', r: 26 }], ['#ffffff', '#000000', '#ff3a6a', '#3affe0'], 'rgba(255,255,255,0.12)'),
  A('omen', 'Omen', 1200000000, ['eclipse', { f: 'eyes', n: 18, w: 100 }, { f: 'orbit', g: 'link', n: 14, r: 20, ry: 5, sp: 0.8, bob: 0 }], ['#000000', '#3a0006', '#ff2a2a', '#ffd0c0'], 'rgba(30,0,0,0.6)'),
  A('lucklight', 'Lucklight', 7700000000, 'lucklight', ['#ff6a5a', '#ffc04a', '#8ae06a', '#5ac8ff', '#b88aff', '#fff6d0']),
];
// all auras sorted by odds; event auras carry ev and only roll while their event runs
export const AURAS = [...BASE, ...GEN, ...EVENT_AURAS].sort((a, b) => a.n - b.n);
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
  { id: 'multi',   name: 'Multi-draw',    max: 99, cost: l => Math.round(100 * 1.13 ** l), desc: l => `Each draw rolls ${l + 1} → ${l + 2} auras` },
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
  { id: 'basket', name: 'Harvest Basket', mult: 3, secs: 300, need: { acorn: 8, 'corn-husk': 4, cranberry: 1 }, mon: 300, ev: 'harvest' },
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
  { id: 'harvestgloves', slot: 'hand', name: 'Harvest Gloves', luck: 1.5, speed: 0.05, tokens: 250 },
  { id: 'wishbonependant', slot: 'neck', name: 'Wishbone Pendant', luck: 2, speed: 0, tokens: 400 },
  { id: 'cometstone',slot: 'neck', name: 'Comet Stone',      luck: 6,   speed: 0.1,  need: { comet: 1, eclipse: 1, lantern: 3 },   mon: 120000 },
];
