# Lucklight

Draw fortunes (omikuji) at a pixel-art shrine at night. Each draw wraps your character in one of 400 auras, from **Dust** (1 in 2) to **Lucklight** (1 in 7,700,000,000). Seven auras sit in the billions and seventy in the millions.

Live at **https://lucklight.rennko.tech**. It's also a cabinet in [Rennko Arcade](https://arcade.rennko.tech).

## How it plays

- **Draw** (click the box or press Space). Rarer auras get bigger reveals: a name spin, then a full-screen slip with a stinger and a grade from 末吉 up to 大大吉.
- **Offerings**: spend mon (shrine coins) on Prayer (luck), Quick Hands (draw speed), Tenth Bell (every 10th draw is luckier) and the Shrine Helper (auto-draw, toggle with A).
- **Charms**: fold auras and mon into timed luck charms or one-shot slips for the next draw.
- **Craft**: make gear for your hand and neck slots for permanent luck and speed.
- **Luck dial**: turn your base luck down (from ×1 up to your max) to grind smaller auras.
- **Multi-draw**: buy it level by level (99 levels) until every draw rolls up to 100 auras at once.
- **Harvest Festival** (Thanksgiving, Nov 15–30 2026): 10 limited auras, autumn shrine, festival luck ×1.25, a daily gift and the Harvest Basket charm.
- **Board**: global leaderboard for rarest aura and most rolls.
- **Settings**: auto-wear, reveal mode (always / new only / off, click to skip), stop auto-draw on a rarity or new aura, volume, save export/import.
- **Admin command bar** (press `` ` ``): `admin <key>` unlocks `give`, `mon`, `luck`, `roll`, `up`, `maxall`, `charm`, `gear all`, `unlock all`, `wear`, `reveal`, `event on|off|auto`, `board remove <name>` and more (`help`). The key is the Worker secret `ADMIN_KEY` (kept locally in the gitignored `.admin-key`). Saves that use progress commands are marked admin and don't post to the board.

Auras live in `public/js/data.js` (the first 100) and `public/js/more.js` (300 more as a compact name:effect:palette table, plus festival auras). All art is drawn in code as pixels (`public/js/fx.js`); sound is a small WebAudio synth (`public/js/sfx.js`). Progress is saved in the browser.

## Build

```bash
./build.sh check    # syntax check
./build.sh dev      # local server with the leaderboard
./build.sh deploy   # publish to Cloudflare Workers
```

Stack: static files in `public/` plus a Worker (`src/worker.js`) with one SQLite Durable Object for the leaderboard.

Made by Virat Reddy Kaukuntla ([@learningnihongo934-byte](https://github.com/learningnihongo934-byte)).
