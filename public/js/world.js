// Lucklight world: time of day, weather and backdrops. Each one boosts auras with matching tags.
// Time and weather follow the real clock, so every player sees the same sky.

export const PHASES = [
  { id: 'dusk', name: 'Dusk', mins: 5, tags: ['dark', 'fire'], mult: 1.5 },
  { id: 'night', name: 'Night', mins: 9, tags: ['night', 'cosmic'], mult: 1.5 },
  { id: 'dawn', name: 'Dawn', mins: 4, tags: ['day', 'bloom'], mult: 1.5 },
  { id: 'day', name: 'Day', mins: 4, tags: ['day', 'nature'], mult: 1.5 },
];
const CYCLE = PHASES.reduce((s, p) => s + p.mins, 0) * 6e4;
export function phaseAt(now) {
  let m = (now % CYCLE) / 6e4;
  for (const p of PHASES) { if (m < p.mins) return { ...p, left: (p.mins - m) * 6e4 }; m -= p.mins; }
  return { ...PHASES[0], left: 0 };
}

export const WEATHERS = [
  { id: 'clear', name: 'Clear', w: 38, tags: [], mult: 1 },
  { id: 'rain', name: 'Rain', w: 18, tags: ['rain', 'water'], mult: 2 },
  { id: 'snow', name: 'Snow', w: 12, tags: ['snow'], mult: 2 },
  { id: 'fog', name: 'Fog', w: 12, tags: ['fog', 'dark'], mult: 2 },
  { id: 'storm', name: 'Storm', w: 10, tags: ['storm', 'rain'], mult: 2 },
  { id: 'sakura', name: 'Petal Wind', w: 10, tags: ['bloom', 'wind'], mult: 2 },
];
const SLOT = 7 * 6e4, WSUM = WEATHERS.reduce((s, w) => s + w.w, 0);
const rnd = k => { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
export function weatherAt(now) {
  const slot = Math.floor(now / SLOT); let r = rnd(slot) * WSUM;
  for (const w of WEATHERS) { if ((r -= w.w) < 0) return { ...w, left: (slot + 1) * SLOT - now }; }
  return { ...WEATHERS[0], left: 0 };
}

// backdrops: unlocked in Offerings, picked in the stage corner menu
export const BIOMES = [
  { id: 'shrine', name: 'Night Shrine', tags: ['divine'], mult: 1.25, cost: 0 },
  { id: 'bamboo', name: 'Bamboo Forest', tags: ['nature', 'wind'], mult: 1.75, cost: 5000 },
  { id: 'koi', name: 'Koi Garden', tags: ['water'], mult: 1.75, cost: 12000 },
  { id: 'snow', name: 'Snowy Peak', tags: ['snow'], mult: 1.75, cost: 25000 },
  { id: 'sky', name: 'Sky Shrine', tags: ['wind', 'divine'], mult: 1.75, cost: 60000 },
  { id: 'moon', name: 'Moon Temple', tags: ['night', 'cosmic'], mult: 1.75, cost: 150000 },
  { id: 'volcano', name: 'Volcano', tags: ['fire'], mult: 1.75, cost: 400000 },
];
export const BIOME = Object.fromEntries(BIOMES.map(b => [b.id, b]));

// tags from an aura's name and effect family
const KEY = {
  night: /moon|night|star|luna|lunar|tsuki|nebula|galax|comet|eclipse|constell|orion|vega|sirius|polaris|altair|deneb|rigel|betel|antares|canopus|arctur|aldebar|subaru|pleiad|meteor|twilight|crescent|nadir|kaguya|hoshi/i,
  day: /sun|solar|dawn|day|light|gold|ray|radian|bright|morning|zenith|amaterasu|haru|natsu|halo|lumen|glimmer|gleam|shine/i,
  rain: /rain|drizzle|shower|drop|dew|puddle|monsoon|squall|tsuyu|cloud|nimbus|overcast|downpour/i,
  snow: /snow|frost|ice|glacier|rime|hail|blizzard|winter|fuyu|yuki|chill|flake|sleet|polar|cold|zero|whiteout|icicle|graupel|powder/i,
  fog: /fog|mist|haze|smoke|steam|vapor|smog|ghost|spirit|yurei|oboro|kagerou|soot|incense|enenra|puff|kettle/i,
  storm: /storm|thunder|lightning|volt|bolt|rai|kaminari|tempest|typhoon|hurricane|cyclone|tornado|squall|whirl|downburst|ragnarok|typhon/i,
  bloom: /sakura|petal|blossom|flower|rose|plum|ume|lily|lotus|wisteria|peony|botan|tsubaki|camellia|daisy|tulip|poppy|orchid|lilac|jasmine|gardenia|azalea|magnolia|iris|ayame|kiku|ajisai|higanbana|hanami|primrose|marigold|violet|ikebana/i,
  wind: /wind|breeze|gust|gale|zephyr|draft|kaze|fujin|mistral|sirocco|bora|whirl|kite|feather|wing|bird|crane|heron|egret|swan|dove|hawk|falcon|tengu|sky/i,
  water: /sea|tide|wave|ocean|koi|fish|carp|pond|brook|creek|stream|river|bubble|pearl|coral|shell|kraken|leviathan|whale|water|surf|swell|eddy|ryu|tsunami|abalone|brine|kappa|minnow|guppy|tadpole|eel|amabie|ningyo|naga|otohime|maelstrom|lily/i,
  fire: /fire|flame|ember|blaze|burn|lava|magma|ash|cinder|coal|torch|pyre|inferno|hell|heat|phoenix|suzaku|kagutsuchi|candle|hearth|bonfire|spark|match|tinder|kindling|volcan|brazier|flare/i,
  nature: /leaf|moss|fern|tree|forest|grove|bamboo|oak|pine|cedar|birch|ivy|herb|basil|seed|sprout|sapling|clover|meadow|hedge|thicket|bramble|bonsai|twig|bud|kodama|garden|ygg|orchard|tamagushi|arashiyama|shika/i,
  divine: /god|kami|heaven|holy|sacred|divine|seraph|angel|halo|celest|shrine|torii|miko|temple|sanctum|nirvana|elysium|ascen|grace|faith|enlight|shintai|kannushi|omikuji|ofuda|gohei|bell|suzu/i,
  dark: /void|abyss|shadow|dark|black|oblivion|nightmare|dread|omen|hell|yomi|izanami|requiem|umbra|curse|onyx|obsidian|ghost/i,
  cosmic: /cosm|galax|nebula|star|astro|quasar|pulsar|nova|universe|multiverse|singular|horizon|planet|supermassive|big bang|primordial|matter|dwarf|giant|neutron|magnetar|warp/i,
};
const FAMKEY = {
  night: ['galaxy', 'cosmos', 'comets', 'eclipse', 'fallStar', 'orbitStar', 'star'], day: ['rays', 'beam', 'divine', 'enlight'],
  rain: ['rain', 'fallDrop', 'cloud'], snow: ['frost', 'fallFlake', 'winter', 'frostF'], fog: ['smoke', 'spirit'],
  storm: ['bolts', 'stormKing', 'storm2', 'tempest', 'raiju', 'storm'], bloom: ['petals', 'fallPetal', 'blossom', 'bloomF'],
  wind: ['breeze', 'gale', 'wings', 'wings3'], water: ['waves', 'ripple', 'orbitFish', 'riseBubble', 'kraken', 'ocean'],
  fire: ['flame', 'inferno', 'riseSpark', 'phoenix'], nature: ['leaves', 'riseLeaf', 'ygg'], divine: ['sanctum', 'celest', 'halo', 'divine'],
  dark: ['abyss', 'oblivion', 'void', 'eyes', 'abyssF'], cosmic: ['galaxy', 'cosmos', 'blackhole', 'bigbang', 'primal', 'cosmicF'],
};
const famName = a => [a.fam, ...(Array.isArray(a.fx) ? a.fx.map(x => typeof x === 'string' ? x : x.f) : [a.fx])];
export function tagsOf(a) {
  if (a._tags) return a._tags;
  const fams = new Set(famName(a)), out = [];
  for (const k of Object.keys(KEY)) if (KEY[k].test(a.name) || FAMKEY[k].some(f => fams.has(f))) out.push(k);
  return (a._tags = out);
}
