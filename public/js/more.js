import { WAVE3 } from './names3.js';
// Lucklight: the 300 extra auras and the Harvest Festival event auras.
// Each line is "Name:family:palette". Lists are in rarity order; odds are spread log-evenly inside each band.

const P = {
  ash: ['#4a4450', '#7a7484', '#b0aab8', '#e8e4ee'], stone: ['#3a3a40', '#6a6a74', '#a0a0aa', '#d8d8e0'],
  moss: ['#2a4a1a', '#4a7a2a', '#8ac04a', '#d0f0a0'], leaf: ['#1a5a2a', '#3a9a4a', '#8ae08a', '#e0ffd8'],
  sea: ['#0a2a5a', '#1a6ab0', '#5ac0f0', '#e0faff'], sky: ['#3a5a8a', '#6a9ad8', '#b0d8ff', '#ffffff'],
  ice: ['#4a7a9a', '#9fd0e6', '#e0f8ff', '#ffffff'], teal: ['#0a4a4a', '#2a9a8a', '#7ae0c8', '#e0fff8'],
  gold: ['#7a5a1a', '#d8a030', '#f8e070', '#ffffff'], amber: ['#6a3a0a', '#c87a1a', '#f0b84a', '#fff0c0'],
  fire: ['#6a0a0a', '#e04a1a', '#ffa030', '#fff0a0'], ember: ['#5a1a0a', '#c84a1a', '#f09a2a', '#ffe68a'],
  blood: ['#2a0004', '#8a0a14', '#d82a2a', '#ff8a7a'], rose: ['#7a1a4a', '#d85a8a', '#ffb0d0', '#fff0f6'],
  sakura: ['#a8406a', '#e58fb0', '#f8d2de', '#ffffff'], plum: ['#3a0a3a', '#8a2a7a', '#d070c0', '#ffd8f8'],
  violet: ['#2a1a5a', '#6a4ae0', '#b8a0ff', '#f0e8ff'], night: ['#0a0a20', '#2a2a6a', '#6a6ac8', '#d0d0ff'],
  void: ['#000000', '#2a0a3a', '#7a3aff', '#e0d0ff'], ink: ['#0a0a10', '#2a2a34', '#5a5a6a', '#9a9aa8'],
  bone: ['#5a5040', '#a89a80', '#e0d8c0', '#fffff0'], sand: ['#7a5a2a', '#c8a060', '#f0d8a0', '#fff0d0'],
  rust: ['#3a1a0a', '#8a3a1a', '#c8682a', '#f0a870'], copper: ['#4a2a1a', '#a85a2a', '#e09a5a', '#ffd8b0'],
  silver: ['#5a6070', '#9aa0b0', '#d0d8e8', '#ffffff'], jade: ['#0a3a2a', '#2a8a5a', '#7ad8a0', '#e0fff0'],
  lime: ['#3a5a0a', '#7ab01a', '#c8f04a', '#f8ffd0'], mint: ['#1a5a4a', '#4ab090', '#b0f0d8', '#ffffff'],
  coral: ['#7a2a2a', '#f06a5a', '#ffb0a0', '#fff0e8'], peach: ['#8a4a3a', '#f0a080', '#ffd8c0', '#fffaf0'],
  lemon: ['#7a6a0a', '#e0d020', '#fff080', '#ffffe0'], storm: ['#1a1a2a', '#4a4a6a', '#9a9ac0', '#ffffff'],
  neon: ['#101010', '#ff2a6a', '#2affd0', '#ffffff'], toxic: ['#1a2a0a', '#4a8a0a', '#a0ff2a', '#f0ffd0'],
  cocoa: ['#2a1a10', '#6a4a2a', '#a8784a', '#e8c8a0'], aurora: ['#1e8a6a', '#5ad6a0', '#9a6ae0', '#e0f0ff'],
  dusk: ['#2a1a3a', '#8a3a6a', '#f0805a', '#ffe0a0'], dawn: ['#3a2a5a', '#e07a8a', '#ffc070', '#fff8e0'],
  cosmic: ['#100a2a', '#6a5ae0', '#e0b0ff', '#ffffff'], obsidian: ['#000000', '#1a1020', '#5a3a7a', '#c0a0ff'],
  crimson: ['#1a0008', '#6a0018', '#e0203a', '#ffc0c8'], solar: ['#6a2a00', '#ff8a1a', '#ffe04a', '#ffffff'],
  prism: ['#ff6a5a', '#ffd04a', '#6ad08a', '#5ab0ff', '#b88aff', '#ffffff'],
};

// effect families: layer lists for fx.js. A number after the list = sky tint strength.
const F = {
  dots: [[{ f: 'orbit', n: 5, r: 15 }]], motes: [['motes']], leaves: [['leaves']], rain: [['rain']], flies: [['fireflies']],
  flame: [['flame']], petals: [['petals']], frost: [['frost']], waves: [['waves']], bolts: [['bolts']], lanterns: [['lanterns']],
  wisps: [[{ f: 'foxfire', noEars: 1 }]], fox: [['foxfire']], eclipse: [['eclipse'], 0.3], comets: [['comets']], aurora: [['aurora']],
  glitch: [['glitch']], oni: [['oni'], 0.25],
  orbitStar: [[{ f: 'orbit', g: 'star', n: 4, r: 18, sp: 0.6 }]], orbitShard: [[{ f: 'orbit', g: 'shard', n: 5, r: 17, sp: 0.7 }]],
  orbitRune: [[{ f: 'orbit', g: 'rune', n: 6, r: 17, sp: 0.6 }, { f: 'ripple', n: 2 }]], orbitHeart: [[{ f: 'orbit', g: 'heart', n: 4, r: 18, sp: 0.6 }]],
  orbitSword: [[{ f: 'orbit', g: 'sword', n: 5, r: 17, sp: 1.8, bob: 0 }]], orbitLink: [[{ f: 'orbit', g: 'link', n: 14, r: 17, ry: 4, sp: 1.2, bob: 0 }]],
  orbitCoin: [[{ f: 'orbit', g: 'coin', n: 6, r: 16, sp: 1 }]], orbitGear: [[{ f: 'orbit', g: 'gear', n: 4, r: 19, sp: -0.6 }]],
  orbitFeather: [[{ f: 'orbit', g: 'feather', n: 5, r: 18, sp: 0.5 }]], orbitBell: [[{ f: 'orbit', g: 'bell', n: 4, r: 17, sp: 0.6 }]],
  orbitThorn: [[{ f: 'orbit', g: 'thorn', n: 6, r: 17, sp: 2.5, bob: 0 }]],
  orbitFish: [[{ f: 'ripple', n: 2, r: 20 }, { f: 'orbit', g: 'fish', n: 3, r: 18, ry: 4, y: 7, sp: 0.8, bob: 0.5 }]],
  riseNote: [[{ f: 'rise', g: 'note', n: 8, per: 3 }]], riseBubble: [[{ f: 'rise', g: 'bubble', n: 7, per: 4 }]],
  riseCoin: [[{ f: 'rise', g: 'coin', n: 9, per: 2.2 }]], riseLeaf: [[{ f: 'rise', g: 'leaf', n: 9, per: 3 }]],
  riseSpark: [[{ f: 'rise', n: 18, per: 1.1, h: 26, sway: 0 }]],
  fallFlake: [[{ f: 'fall', g: 'flake', n: 12, per: 4, w: 44 }]], fallStar: [[{ f: 'fall', g: 'star', n: 7, per: 1.8, w: 48 }]],
  fallPetal: [[{ f: 'fall', g: 'petal', n: 9, per: 3 }]], fallDrop: [[{ f: 'fall', g: 'drop', n: 9, per: 1.6 }]],
  breeze: [[{ f: 'breeze', n: 10 }]], gale: [[{ f: 'breeze', n: 22, sp: 85, len: 9 }]],
  ripple: [[{ f: 'ripple', n: 3, r: 24, per: 1.5 }]], pulse: [[{ f: 'ripple', y: -2, flat: 0.85, r: 28, n: 3, per: 1.4 }]],
  smoke: [[{ f: 'smoke' }]], cloud: [[{ f: 'smoke', n: 10, y: -18, h: 6, w: 36, size: 5, per: 6 }, { f: 'fall', g: 'drop', n: 8, per: 1.3 }], 0.2],
  beam: [[{ f: 'beam', w: 9 }]], rays: [[{ f: 'rays', n: 8 }]], rings: [[{ f: 'rings', n: 2, r: 16 }]],
  wings: [[{ f: 'wings', len: 13 }]], wings3: [[{ f: 'wings', n: 3, len: 13, sp: 2 }]], helix: [[{ f: 'helix', n: 40, r: 15 }]],
  galaxy: [[{ f: 'galaxy', arms: 3, r: 36, flat: 0.45 }], 0.3], matrix: [['matrix'], 0.4], eyes: [[{ f: 'eyes', n: 8, w: 80 }], 0.25],
  crown: [['crown', { f: 'rise', g: 'star', n: 5, per: 3 }]], infinity: [[{ f: 'infinity', r: 26 }]],
  spirit: [[{ f: 'orbit', g: 'ghost', n: 4, r: 19, ry: 7, sp: 0.7, bob: 3 }, { f: 'smoke', n: 8, per: 4 }], 0.3],
  fireworks: [[{ f: 'rise', n: 18, per: 1.2, h: 40 }, { f: 'ripple', y: -26, flat: 1, r: 16, n: 2, per: 1.2 }]],
  storm2: [[{ f: 'helix', n: 44, r: 20, sp: 3 }, { f: 'breeze', n: 16, sp: 80 }]],
  kaleido: [[{ f: 'rays', n: 12, sp: -0.6 }, { f: 'orbit', g: 'shard', n: 6, r: 18, sp: 1 }]],
  raiju: [['bolts', { f: 'orbit', n: 6, r: 16, sp: 2 }], 0.2],
  star: [['comets', { f: 'fall', g: 'star', n: 6, per: 2 }], 0.25],
  stormKing: [['bolts', { f: 'smoke', n: 10, y: -18, h: 6, w: 40, size: 5, per: 6 }, { f: 'orbit', g: 'sword', n: 3, r: 20, sp: 1.5 }], 0.3],
  inferno: [['flame', { f: 'wings', len: 15, sp: 2.5 }, { f: 'rise', n: 16, per: 1, h: 40 }], 0.25],
  tempest: [['waves', { f: 'helix', n: 44, r: 20, sp: 2.5 }, 'bolts'], 0.25],
  serpent: [['dragon', { f: 'rise', g: 'star', n: 5, per: 3 }], 0.2],
  regal: [['crown', { f: 'rays', n: 12 }, { f: 'orbit', g: 'coin', n: 6, r: 20 }]],
  oracle: [[{ f: 'orbit', g: 'rune', n: 8, r: 20, sp: 0.5 }, 'eclipse', { f: 'eyes', n: 4, w: 60 }], 0.3],
  sanctum: [[{ f: 'beam', w: 8 }, { f: 'wings', n: 2, len: 12 }, { f: 'rings', n: 1, r: 20 }]],
  abyss: [['void', { f: 'eyes', n: 12, w: 90 }], 0.55], cosmos: [[{ f: 'galaxy', arms: 2, r: 42, flat: 0.4 }, { f: 'infinity', r: 24 }], 0.35],
  clockgod: [['clock', { f: 'rings', n: 3, r: 15, tilt: 0.4, sp: 1.5 }, { f: 'orbit', g: 'gear', n: 4, r: 24, sp: -0.5 }], 0.3],
  kraken: [['waves', { f: 'helix', n: 30, r: 18, strands: 4, sp: 1.5 }], 0.3],
  muse: [[{ f: 'rise', g: 'note', n: 10, per: 3 }, 'waves', { f: 'rings', n: 1, r: 20 }]],
  fortune: [[{ f: 'rise', g: 'coin', n: 12, per: 2 }, { f: 'orbit', g: 'fish', n: 2, r: 20, sp: 0.6 }, { f: 'rays', n: 8 }]],
  kitsuneGod: [['foxfire', { f: 'rays', n: 9 }]],
  blade: [[{ f: 'beam', w: 6 }, { f: 'orbit', g: 'sword', n: 8, r: 20, sp: 2.5, bob: 0 }]],
  mirror: [['eclipse', { f: 'rings', n: 2, r: 20, sp: 0.6 }, { f: 'rays', n: 8 }]],
  blackhole: [[{ f: 'galaxy', arms: 3, r: 40, flat: 0.35, sp: 1.4, core: 7 }, 'void'], 0.5],
  borealis: [['aurora', { f: 'fall', g: 'star', n: 5, per: 2.5 }], 0.3],
  winter: [['frost', { f: 'breeze', n: 18, sp: 70 }, { f: 'fall', g: 'flake', n: 10, per: 2 }]],
  blossom: [[{ f: 'breeze', n: 12, sp: 60 }, 'petals', { f: 'fall', g: 'petal', n: 10, per: 2.5 }]],
  enlight: [[{ f: 'rays', n: 16 }, { f: 'beam', w: 10 }, { f: 'orbit', g: 'lotus', n: 8, r: 14, ry: 3, y: 8, sp: 0.3, bob: 0 }]],
  mandala: [[{ f: 'rings', n: 3, r: 14, tilt: 0 }, { f: 'rays', n: 12, sp: -0.3 }, { f: 'orbit', g: 'rune', n: 8, r: 24, sp: 0.4 }]],
  ouro: [['dragon', { f: 'infinity', r: 28 }, { f: 'galaxy', arms: 2, r: 40, sp: -0.4 }], 0.35],
  oblivion: [['void', { f: 'eyes', n: 20, w: 110 }, { f: 'helix', n: 44, r: 22, strands: 3, sp: -2 }], 0.6],
  celest: [[{ f: 'beam', w: 10 }, { f: 'rays', n: 12 }, { f: 'wings', n: 3, len: 14, sp: 2 }, 'halo'], 0.15],
  bigbang: [[{ f: 'rays', n: 16 }, { f: 'ripple', y: -4, flat: 0.9, r: 60, n: 4, per: 0.9 }, { f: 'galaxy', arms: 4, r: 50, sp: 1 }], 0.25],
  void: [['void'], 0.45],
  nova: [[{ f: 'rays', n: 10 }, { f: 'ripple', y: -4, flat: 0.9, r: 44, n: 3, per: 1.1 }], 0.2],
  ygg: [['leaves', { f: 'beam', w: 8 }, { f: 'rise', g: 'leaf', n: 14, per: 2.5, w: 44 }, { f: 'rings', n: 2, r: 22, sp: 0.4 }], 0.2],
  phoenix: [['flame', { f: 'wings', n: 2, len: 16, sp: 2.5 }, { f: 'rays', n: 12 }, { f: 'rise', g: 'feather', n: 8, per: 2 }], 0.3],
  ocean: [['waves', { f: 'helix', n: 40, r: 22, strands: 4, sp: 1.4 }, { f: 'ripple', n: 3, r: 40, per: 1.3 }, { f: 'rise', g: 'bubble', n: 8, per: 3 }], 0.35],
  storm: [['bolts', { f: 'smoke', n: 12, y: -20, h: 6, w: 50, size: 5, per: 6 }, { f: 'breeze', n: 20, sp: 90 }, { f: 'helix', n: 44, r: 22, sp: 3 }], 0.4],
  timeF: [['clock', { f: 'rings', n: 3, r: 18, tilt: 0.4, sp: 1.5 }, { f: 'infinity', r: 30 }, { f: 'orbit', g: 'gear', n: 6, r: 26, sp: -0.4 }], 0.35],
  beast: [['dragon', { f: 'rays', n: 12 }, { f: 'galaxy', arms: 2, r: 40, sp: 0.5 }, { f: 'rise', g: 'star', n: 6, per: 2 }], 0.35],
  cosmicF: [[{ f: 'galaxy', arms: 4, r: 50, flat: 0.4, sp: 0.7 }, { f: 'infinity', r: 24 }, { f: 'rays', n: 10, sp: -0.3 }, { f: 'fall', g: 'star', n: 6, per: 2 }], 0.45],
  frostF: [['frost', { f: 'breeze', n: 18, sp: 70 }, { f: 'fall', g: 'flake', n: 12, per: 2 }, { f: 'rays', n: 10 }, { f: 'rings', n: 2, r: 20 }], 0.25],
  divine: [[{ f: 'beam', w: 12 }, { f: 'rays', n: 16 }, { f: 'wings', n: 3, len: 14, sp: 2 }, { f: 'rings', n: 2, r: 22, sp: 0.6 }, 'crown'], 0.15],
  abyssF: [['void', { f: 'eyes', n: 22, w: 120 }, { f: 'helix', n: 44, r: 24, strands: 3, sp: -2 }, { f: 'smoke', n: 10, per: 4 }], 0.6],
  bloomF: [[{ f: 'breeze', n: 14, sp: 60 }, 'petals', { f: 'fall', g: 'petal', n: 14, per: 2.2 }, { f: 'rays', n: 8 }, { f: 'rings', n: 1, r: 22 }], 0.15],
  primal: [[{ f: 'galaxy', arms: 2, r: 46, sp: 0.3 }, { f: 'rays', n: 12 }, { f: 'beam', w: 9 }, { f: 'rings', n: 2, r: 22, sp: 0.6 }, 'crown'], 0.3],
};

const LOW = `Twig:riseLeaf:cocoa|Sand:breeze:sand|Ash:motes:ash|Pond:ripple:sea|Seed:riseLeaf:lime|Drizzle:fallDrop:sky|Feather:orbitFeather:bone|Glow:flies:lemon|Clay:dots:rust|Tea:smoke:mint|Honey:riseBubble:amber|Gust:breeze:silver|Coal:flame:ink|Petal:fallPetal:rose|Salt:fallFlake:bone|Fern:leaves:leaf|Copper:orbitCoin:copper|Lily:fallPetal:peach
|Rust:motes:rust|Dandelion:riseSpark:bone|Lilypad:ripple:leaf|Mochi:riseBubble:peach|Ramune:riseBubble:sky|Ginkgo:petals:lemon|Cicada:riseNote:moss|Pinwheel:rings:coral|Kite:breeze:coral|Tanuki:dots:cocoa|Sparrow:orbitFeather:cocoa|Plum:petals:plum|Shell:ripple:peach|Pearl:orbitShard:bone|Hail:fallFlake:silver|Fog:smoke:ash|Glowworm:flies:teal|Matcha:riseLeaf:jade|Furin:orbitBell:sky|Ume:fallPetal:plum|Coral:riseBubble:coral|Chestnut:dots:cocoa|Sunbeam:beam:lemon|Moonstone:orbitShard:silver|Kabuto:dots:jade|Sake:riseBubble:bone|Inari:wisps:amber|Vermilion:rays:fire|Snowdrop:fallFlake:mint|Willow:leaves:mint|Thistle:fallPetal:violet|Lavender:petals:violet|Marble:orbitShard:stone|Iron:orbitLink:stone|Bronze:orbitCoin:amber|Wheat:riseLeaf:sand|Dust Devil:gale:sand|Dragonfly:orbitFeather:teal|Jellyfish:riseBubble:plum|Starfish:orbitStar:coral|Seafoam:waves:mint|Tsukimi:eclipse:bone|Ema:orbitBell:cocoa|Omamori:orbitHeart:fire|Soot:smoke:ink
|Quartz:orbitShard:ice|Amethyst:orbitShard:violet|Topaz:orbitShard:amber|Garnet:orbitShard:crimson|Opal:orbitShard:prism|Obsidian:orbitShard:obsidian|Sapphire:orbitShard:sea|Monsoon:rain:sea|Sleet:fallFlake:storm|Heatwave:aurora:solar|Cinder:riseSpark:ember|Wildfire:flame:fire|Lava:flame:blood|Magma:flame:solar|Glacier:frost:ice|Rime:frost:silver|Undertow:waves:night|Riptide:waves:teal|Whirlpool:helix:sea|Volt:bolts:lemon|Gale:gale:silver|Cyclone:helix:storm|Thunderhead:cloud:storm|Rainbow:rays:prism|Sunflower:rays:lemon|Bonfire:flame:amber|Tanabata:orbitStar:sky|Koto:riseNote:cocoa|Shakuhachi:riseNote:bone|Biwa:riseNote:amber|Hanabi:fireworks:prism|Kappa:riseBubble:jade|Hitodama:wisps:sky|Onibi:wisps:blood|Kodama:riseLeaf:mint|Baku:dots:plum|Nue:bolts:plum|Karakasa:fallDrop:fire|Chochin:lanterns:amber|Komainu:orbitCoin:stone|Shishi:flame:gold|Hamaya:orbitSword:bone|Kagura:petals:fire|Mikoshi:orbitBell:gold|Zen:ripple:stone|Koi Pond:orbitFish:sea|Water Lily:ripple:rose|Bonsai:riseLeaf:moss|Sakura Storm:gale:sakura|Snow Lantern:lanterns:ice|Abalone:orbitShard:teal|Swarm:flies:lime|Haze:smoke:dusk|Dusk:aurora:dusk|Dawn:rays:dawn|Twilight:eclipse:dusk|Rosewater:riseBubble:rose|Ironwood:orbitLink:cocoa|Steam:smoke:silver|Clockspring:orbitGear:copper
|Emerald:orbitShard:leaf|Ruby:orbitShard:crimson|Diamond:orbitShard:silver|Onyx:orbitShard:ink|Silver Moon:eclipse:silver|Meteor:comets:fire|Shooting Star:fallStar:gold|Constellation:orbitStar:night|Polaris:beam:sky|Sirius:orbitStar:ice|Orion:orbitStar:violet|Subaru:fallStar:sky|Equinox:rings:dawn|Solstice:rays:solar|Basalt:orbitShard:stone|Avalanche:gale:ice|Hurricane:storm2:storm|Tornado:storm2:sand|Typhoon:storm2:sea|Tremor:pulse:rust|Geyser:beam:teal|Onsen:smoke:peach|Coral Reef:orbitFish:coral|Whale Song:riseNote:sea|Samurai:orbitSword:crimson|Ronin:orbitSword:ink|Shinobi:smoke:night|Shuriken:orbitThorn:silver|Katana:orbitSword:silver|Naginata:orbitSword:copper|Kyudo:orbitSword:bone|Daimyo:crown:crimson|Hannya:eyes:crimson|Noh:eyes:bone|Jorogumo:orbitLink:plum|Nekomata:wisps:violet|Bakeneko:eyes:lime|Yamabiko:pulse:mint|Funayurei:spirit:sea|Zashiki-warashi:spirit:peach|Umibozu:spirit:night|Ittan-momen:breeze:bone|Tsukumogami:orbitGear:rust|Rainbow Koi:orbitFish:prism|Kingyo:orbitFish:fire|Botan:petals:rose|Tsubaki:fallPetal:crimson|Ayame:petals:violet|Kiku:rays:gold|Ajisai:petals:sky|Higanbana:rays:crimson|Moon Rabbit:fallStar:bone|Thunderbird:wings:lemon|Tancho:wings:bone|Raven:wings:ink|Peacock:wings:teal|Kingfisher:wings:sky|Calligraphy:orbitRune:ink|Haiku:fallPetal:bone|Zen Garden:ripple:sand|Bamboo Grove:riseLeaf:jade|Tea Ceremony:smoke:jade|Bell Tower:orbitBell:copper|Prayer Wheel:rings:gold|Incense:smoke:plum
|Starlight:fallStar:silver|Moonfall:fallStar:night|Sunspot:eclipse:solar|Corona:eclipse:fire|Quasar:beam:cosmic|Pulsar:pulse:cosmic|Comet Tail:comets:ice|Asteroid:dots:stone|Black Ice:frost:obsidian|Hellfire:flame:crimson|Plasma:bolts:violet|Neon Sign:rings:neon|Pixel:glitch:prism|Virus:matrix:toxic|Cipher:matrix:violet|Firewall:matrix:fire|Hologram:rings:teal|Kaleidoscope:kaleido:prism|Eye of the Storm:stormKing:storm|Yuki-onna:spirit:ice|Gashadokuro:spirit:bone|Nurarihyon:crown:night|Tamamo:fox:gold|Shuten-doji:oni:crimson|Ibaraki:oni:plum|Raiju:raiju:lemon|Tsuchigumo:orbitLink:ink|Kamaitachi:gale:mint|Suzaku:inferno:fire|Seiryu:serpent:sea|Byakko:stormKing:silver|Genbu:waves:obsidian|Shachihoko:orbitFish:gold|Hanami:fallPetal:sakura|Yozakura:petals:dusk|Momiji:gale:fire|Fuyu:frost:sky|Natsu:riseSpark:solar|Haru:riseLeaf:sakura|Aki:fallPetal:amber|Tsuyu:rain:violet|Higurashi:riseNote:dusk|Ginga:galaxy:night|Amanogawa:galaxy:sky|Hoshizora:fallStar:cosmic|Ryusei:star:fire|Kaminari:bolts:sky|Tatsumaki:storm2:violet|Kazahana:fallFlake:sakura|Shinkiro:aurora:dawn|Kagerou:smoke:solar|Oboro:eclipse:ash|Akatsuki:beam:dawn|Yugure:galaxy:dusk|Kurenai:riseSpark:crimson|Ruri:orbitStar:sea|Kohaku:dots:amber|Hisui:rings:jade|Sango:pulse:coral|Kin:riseCoin:gold|Gin:riseCoin:silver|Tetsu:orbitSword:stone|Kurogane:orbitGear:ink|Kintsugi:orbitLink:gold|Ukiyo:breeze:dawn`;

const MIL = `Leviathan:tempest:sea|Kraken:kraken:plum|Yamata-no-Orochi:serpent:crimson|Gyuki:oni:ink|Hachiman:regal:crimson|Bishamon:regal:gold|Benzaiten:muse:sea|Ebisu:fortune:gold|Daikokuten:fortune:amber|Fukurokuju:sanctum:jade|Jurojin:clockgod:bone|Hotei:fortune:peach|Inari Okami:kitsuneGod:solar|Izanagi:sanctum:sky|Izanami:abyss:obsidian|Kagutsuchi:inferno:solar|Watatsumi:tempest:teal|Ame-no-Uzume:muse:sakura|Takemikazuchi:stormKing:lemon|Sarutahiko:regal:dawn|Okuninushi:sanctum:leaf|Yatagarasu:wings3:obsidian|Kusanagi:blade:silver|Yata Mirror:mirror:silver|Magatama:oracle:jade|Event Horizon:blackhole:solar|Andromeda:cosmos:violet|Zodiac:oracle:cosmic|Corona Borealis:regal:night|Star Dragon:serpent:cosmic|Aurora Borealis:borealis:aurora|Polar Night:borealis:night|Raikou:stormKing:violet|Eternal Winter:winter:ice|Senbonzakura:blossom:sakura|Guren:inferno:crimson|Yomi:abyss:blood|Takamagahara:sanctum:gold|Nirvana:enlight:gold|Mandala:mandala:plum|Eon:clockgod:violet|Elysium:enlight:mint`;

const BIL = `Ouroboros:ouro:gold:1800000000|Oblivion:oblivion:void:2600000000|Celestia:celest:dawn:3600000000|Big Bang:bigbang:solar:5000000000|Primordial:primal:cosmic:6300000000`;

const hexA = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const nice = x => { const p = 10 ** (Math.floor(Math.log10(x)) - 1); return Math.round(x / p) * p; };
function make(name, fam, pal, n) {
  const [fx, tint] = F[fam], c = P[pal];
  if (!fx || !c) throw new Error(`bad aura ${name}: ${fam}/${pal}`);
  return { id: slug(name), name, n, fx, c, fam, ...(tint ? { tint: hexA(c[0], tint) } : {}) };
}
const parse = s => s.replace(/\n/g, '').split('|').map(x => x.split(':'));
// band sizes for LOW, by decade: 10-100, 100-1k, 1k-10k, 10k-100k, 100k-1M
const BANDS = [[10, 18], [100, 45], [1e3, 60], [1e4, 65], [1e5, 65]];

// palette from keywords in the name (first rule that matches), else any palette by hash
const KP = [
  [/prism|spectrum|rainbow|kaleido|refraction|holo/i, ['prism']],
  [/frost|ice|snow|glacier|rime|hail|blizzard|winter|yuki|chill|flake|sleet|polar|cold|zero|white|whiteout|graupel|powder|icicle/i, ['ice', 'silver', 'sky']],
  [/blood|crimson|scarlet|\bred\b|aka|oni|ruby|garnet|beryl|wrath|lust/i, ['crimson', 'blood']],
  [/fire|flame|ember|blaze|lava|magma|cinder|coal|torch|pyre|inferno|hell|heat|phoenix|hearth|bonfire|spark|match|tinder|kindling|volcan|sun|solar|flare|brazier|fervor|courage|fenghuang|vermilion|fudo/i, ['fire', 'ember', 'solar', 'amber']],
  [/gold|honey|amber|coin|koban|ryo|treasure|fortune|lucky|jackpot|greed|brass|citrine|topaz|pride|crown|king|emperor|throne|age|daruma|mallet|uchide|takarabune|pheasant|horseshoe/i, ['gold', 'amber']],
  [/jade|leaf|moss|fern|tree|forest|grove|bamboo|oak|pine|cedar|birch|ivy|herb|basil|seed|sprout|sapling|clover|meadow|hedge|thicket|bramble|bonsai|twig|bud|kodama|garden|ygg|emerald|peridot|malachite|kappa|shika|orchard|tamagushi|arashiyama|fourleaf|jinmenju/i, ['leaf', 'moss', 'jade', 'lime']],
  [/sea|tide|wave|ocean|koi|fish|carp|pond|brook|creek|stream|river|bubble|pearl|coral|shell|kraken|leviathan|whale|water|surf|swell|eddy|ryu|tsunami|abalone|brine|aqua|sapphire|lapis|turquoise|minnow|guppy|tadpole|eel|amabie|ningyo|naga|otohime|tortoise|tiamat|kame|bore|itsukushima|maelstrom|wishing|well|tranquil|serenity/i, ['sea', 'teal', 'sky']],
  [/void|shadow|dark|black|abyss|oblivion|nightmare|dread|omen|yomi|requiem|umbra|curse|onyx|\bjet\b|obsidian|envy|sloth|pandora|lost|bakunawa|wormhole|nadir|ghost/i, ['void', 'obsidian', 'ink']],
  [/moon|night|star|luna|lunar|twilight|nebula|galax|comet|cosmic|eclipse|constell|orion|vega|sirius|polaris|altair|deneb|rigel|betel|antares|canopus|arctur|aldebar|pleiad|meteor|nova|quasar|pulsar|astro|dream|cassiop|sagitt|universe|multiverse|singular|cosmos|kaguya|bolide|perihelion|reverie|usagi|crescent|dwarf|giant|neutron|magnetar|warp|tanabata|wonder|lucid|binary/i, ['night', 'cosmic', 'violet', 'silver']],
  [/sakura|petal|blossom|flower|rose|plum|ume|lily|lotus|wisteria|peony|camellia|daisy|tulip|poppy|orchid|lilac|jasmine|gardenia|azalea|magnolia|primrose|hanami|kindness|bliss|heart|sweet|daydream|ikebana|nostalgia|konohana|kannon/i, ['sakura', 'rose', 'plum', 'peach']],
  [/storm|thunder|lightning|volt|bolt|rai|tempest|typhoon|hurricane|cyclone|tornado|squall|static|whirl|downburst|cloudburst|tiger|mjolnir|tenjin/i, ['storm', 'violet', 'lemon']],
  [/wind|breeze|gust|gale|zephyr|draft|kaze|mistral|sirocco|bora|kite|feather|wing|bird|crane|heron|egret|swan|dove|sky|cloud|nimbus|hawk|falcon|hayabusa|tori|garuda|simurgh|roc|ziz|magpie|wren|robin|finch|swallow|tessen|yabusame|wanderlust|kinshi|haraegushi/i, ['sky', 'mint', 'silver']],
  [/fog|mist|haze|smoke|steam|vapor|smog|spirit|soot|incense|ink|enenra|raku|kettle|puff/i, ['ash', 'stone', 'ink']],
  [/divine|god|kami|heaven|holy|sacred|angel|halo|celest|shrine|torii|miko|temple|sanctum|nirvana|elysium|ascen|grace|faith|hope|mercy|light|lumen|radian|zenith|shintai|kannushi|jizo|ninigi|fushimi|bell|suzu|ofuda|sutra|mantra|gohei|kamidana|omikuji|shugendo|harmony|valor|wisdom|justice/i, ['gold', 'dawn', 'bone']],
  [/iron|steel|sword|blade|katana|tanto|wakizashi|yari|kunai|tetsu|metal|pewter|nickel|tin|cog|gear|clock|watch|windup|hourglass|mainframe|kernel|firmware|data|code|quantum|neural|laser|muramasa|masamune|kendo|resolve|sohei|kusarigama|excalibur|gungnir|murakumo|issun|momotaro|aegis/i, ['silver', 'stone', 'copper']],
  [/neon|synth|vaporwave|cyber|pixel|glitch|overclock|bitcrush|hyper/i, ['neon', 'violet', 'teal']],
];
const ALLP = Object.keys(P).filter(k => k !== 'prism');
const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const palFor = name => { for (const [re, list] of KP) if (re.test(name)) return list[hash(name) % list.length]; return ALLP[hash(name) % ALLP.length]; };

export const GEN = [];
{
  const low = parse(LOW); let i = 0;
  for (const [lo, k] of BANDS) for (let j = 0; j < k; j++, i++) { const [nm, f, p] = low[i]; GEN.push(make(nm, f, p, nice(lo * 10 ** ((j + 0.5) / k)))); }
  if (i !== low.length) throw new Error(`LOW has ${low.length}, bands want ${i}`);
  parse(MIL).forEach(([nm, f, p], j, all) => GEN.push(make(nm, f, p, nice(1e6 * 1000 ** ((j + 0.5) / all.length)))));
  parse(BIL).forEach(([nm, f, p, n]) => GEN.push(make(nm, f, p, +n)));
  // wave 3: 600 more. Each band's auras are spread log-evenly through its decade.
  const bands = {};
  for (const line of WAVE3.trim().split('\n')) {
    const [b, famPal, names] = line.split('|'), [fam, pal] = famPal.split(':');
    for (const nm of names.split(',').map(x => x.trim()).filter(Boolean)) (bands[b] ||= []).push([nm, fam, pal || palFor(nm)]);
  }
  const shuffle = list => list.map(x => [hash(x[0]), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  ['0', '1', '2', '3', '4'].forEach(b => { const list = shuffle(bands[b]), lo = 10 ** (+b + 1); list.forEach(([nm, f, p], j) => GEN.push(make(nm, f, p, nice(lo * 10 ** ((j + 0.5) / list.length))))); });
  shuffle(bands.M).forEach(([nm, f, p], j, all) => GEN.push(make(nm, f, p, nice(1e6 * 1000 ** ((j + 0.5) / all.length)))));
  bands.B.forEach(([nm, f, p]) => GEN.push(make(nm, f, p, 1e9))); // legends: odds set from lore.js order in data.js
}

// ---------- Harvest Festival (Thanksgiving 2026). Rollable only while the event runs; kept forever once found.
export const EVENT = {
  id: 'harvest', name: 'Harvest Festival',
  start: Date.UTC(2026, 10, 14, 6), end: Date.UTC(2026, 11, 1, 6), // Nov 14 – Nov 30, midnight Central
  day: Date.UTC(2026, 10, 26, 6), luck: 1.25, gift: { mon: 300, charm: 'red' },
};
const ev = (name, n, fx, pal, tint) => ({ id: slug(name), name, n, fx, c: P[pal], ev: EVENT.id, ...(tint ? { tint: hexA(P[pal][0], tint) } : {}) });
export const EVENT_AURAS = [
  ev('Acorn', 40, [{ f: 'orbit', g: 'acorn', n: 4, r: 15, sp: 0.6 }], 'cocoa'),
  ev('Corn Husk', 150, [{ f: 'rise', g: 'corn', n: 6, per: 3 }], 'lemon'),
  ev('Cranberry', 600, [{ f: 'rise', g: 'bubble', n: 8, per: 3 }, { f: 'ripple', n: 2 }], 'crimson'),
  ev('Maple Leaf', 2500, [{ f: 'fall', g: 'maple', n: 9, per: 3 }, { f: 'breeze', n: 8, sp: 50 }], 'fire'),
  ev('Pumpkin Patch', 9000, [{ f: 'orbit', g: 'pumpkin', n: 5, r: 17, ry: 4, y: 6, sp: 0.4, bob: 0 }, { f: 'ripple', n: 2 }], 'amber'),
  ev('Wishbone', 30000, [{ f: 'rays', n: 8 }, { f: 'orbit', g: 'wishbone', n: 3, r: 18, sp: 0.7 }], 'bone'),
  ev('Pumpkin Pie', 90000, [{ f: 'smoke', n: 6, y: -10, h: 18, w: 12, per: 2.5 }, { f: 'orbit', g: 'pie', n: 4, r: 17, sp: 0.6 }], 'peach'),
  ev('Gobbler', 200000, [{ f: 'orbit', g: 'turkey', n: 3, r: 19, ry: 5, y: 3, sp: 0.6, bob: 1 }, { f: 'fall', g: 'maple', n: 7, per: 3 }], 'cocoa'),
  ev('Harvest Moon', 450000, ['eclipse', { f: 'fall', g: 'maple', n: 8, per: 3 }, { f: 'rings', n: 1, r: 20, sp: 0.4 }], 'amber', 0.35),
  ev('Cornucopia', 900000, [{ f: 'rays', n: 12 }, 'crown', { f: 'rise', g: 'corn', n: 6, per: 2.5 }, { f: 'orbit', g: 'pumpkin', n: 4, r: 20, sp: 0.5 }], 'gold'),
];

// ---------- Harvest Market: the all-year way to get festival things
export const HARVEST = {
  tokens: n => Math.max(1, Math.round(Math.log10(n) ** 1.5)), // per festival aura drawn: Acorn 2 … Cornucopia 16
  giftTokens: 10,
  lantern: { mon: 1500, secs: 300, max: 3600 }, // festival auras roll while lit
  basket: 30,
  auras: { acorn: 5, 'corn-husk': 10, cranberry: 20, 'maple-leaf': 40, 'pumpkin-patch': 80, wishbone: 150, 'pumpkin-pie': 300, gobbler: 600, 'harvest-moon': 1200, cornucopia: 2500 },
};
