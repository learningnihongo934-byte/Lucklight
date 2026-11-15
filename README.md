# Lucklight

Draw fortunes (omikuji) at a pixel-art shrine at night. Each draw wraps your character in one of **1,000 auras**, from **Dust** (1 in 2) to **Lucklight** (1 in 1,000,000,000,000). 50 auras sit at 1 in a billion or rarer: these are the **legends**, each with its own backstory and pixel film. 150 more are in the millions.

Live at **https://lucklight.rennko.tech**. It's also a cabinet in [Rennko Arcade](https://arcade.rennko.tech).

## How it plays

- **Legend films** (`public/js/film.js`, lore in `public/js/lore.js`): drawing any legend plays a ~19 s pixel film in four shots, with its backstory typed on screen. Every film can be replayed from the **Theater** tab or the legend's Collection card.
- **World** (`public/js/world.js`): a 22-minute day/night cycle, weather that changes every 7 minutes, and 7 backdrops. Each boosts auras whose tags match (night, rain, snow, fire, water, divine and so on); the stage corner shows what is boosted now.
- **Quests** (`public/js/quests.js`): shrine visitors walk onto the stage with requests, 3 daily quests, a 12-chapter story, 54 achievements (titles and permanent blessings) and a login streak.
- **Offerings** (`public/js/offer.js`): the original 5 upgrades plus 17 upgrade lines, Charm Helper, a Ring gear slot, 5 pets and 6 backdrops.

- **Draw** (click the box or press Space). Rarer auras get bigger reveals: a name spin, then a full-screen slip with a stinger and a grade from 末吉 up to 大大吉.
- **Offerings**: spend mon (shrine coins) on Prayer (luck), Quick Hands (draw speed), Tenth Bell (every 10th draw is luckier) and the Shrine Helper (auto-draw, toggle with A).
- **Charms**: fold auras and mon into timed luck charms or one-shot slips for the next draw.
- **Craft**: make gear for your hand and neck slots for permanent luck and speed.
- **Luck dial**: turn your base luck down (from ×1 up to your max) to grind smaller auras.
- **Multi-draw**: buy it level by level (99 levels) until every draw rolls up to 100 auras at once.
- **Harvest Festival** (Thanksgiving, Nov 14–30 2026, Central time): 10 limited auras, autumn shrine, festival luck ×1.25, a daily gift and the Harvest Basket charm.
- **Harvest Market** (all year): festival auras pay harvest tokens; spend mon on a Harvest Lantern (festival auras can roll for 5 min, even after the festival) and tokens on any festival aura, the Harvest Basket charm, Harvest Gloves and the Wishbone Pendant.
- **Board**: global leaderboard for rarest aura and most rolls.
- **Settings**: auto-wear, reveal mode (always / new only / off, click to skip), stop auto-draw on a rarity or new aura, volume, save export/import.
- **Admin command bar** (press `` ` ``): `admin <key>` unlocks `give`, `mon`, `luck`, `roll`, `up`, `maxall`, `charm`, `gear all`, `unlock all`, `wear`, `reveal`, `event on|off|auto`, `board remove <name>`, `tokens`, `lantern` and more. The bar suggests commands and arguments as you type (Tab completes, arrows pick). The key is the Worker secret `ADMIN_KEY` (kept locally in the gitignored `.admin-key`). Saves that use progress commands are marked admin and don't post to the board.

Auras live in `public/js/data.js` (the first 100), `public/js/more.js` (300 more plus festival auras) and `public/js/names3.js` (600 more, grouped by rarity band; palettes come from keywords in each name). All art is drawn in code as pixels (`public/js/fx.js`); sound is a small WebAudio synth (`public/js/sfx.js`). Background music is "yoiyami core theme" by Yoiyami ([OpenGameArt](https://opengameart.org/content/yoiyami-core-theme-%E2%80%93-deep-blue-ambient-piano), CC0), re-encoded to 96 kbps in `public/audio/`. Header buttons toggle popups (reveal spins, full-screen slips, rare-draw toasts), music and sound. Progress is saved in the browser.

## Build

```bash
./build.sh check    # syntax check
./build.sh dev      # local server with the leaderboard
./build.sh deploy   # publish to Cloudflare Workers
```

Stack: static files in `public/` plus a Worker (`src/worker.js`) with one SQLite Durable Object for the leaderboard (table `p3` since the 1,000-aura fresh start; saves use the `lucklight.v3` key).

Made by Virat Reddy Kaukuntla ([@learningnihongo934-byte](https://github.com/learningnihongo934-byte)).
