# Lucklight

Draw fortunes (omikuji) at a pixel-art shrine at night. Each draw wraps your character in one of 100 auras, from **Dust** (1 in 2) to **Lucklight** (1 in 1,500,000,000).

Live at **https://lucklight.rennko.tech**. It's also a cabinet in [Rennko Arcade](https://arcade.rennko.tech).

## How it plays

- **Draw** (click the box or press Space). Rarer auras get bigger reveals: a name spin, then a full-screen slip with a stinger and a grade from 末吉 up to 大大吉.
- **Offerings**: spend mon (shrine coins) on Prayer (luck), Quick Hands (draw speed), Tenth Bell (every 10th draw is luckier) and the Shrine Helper (auto-draw, toggle with A).
- **Charms**: fold auras and mon into timed luck charms or one-shot slips for the next draw.
- **Craft**: make gear for your hand and neck slots for permanent luck and speed.
- **Board**: global leaderboard for rarest aura and most draws.

All art is drawn in code as pixels (`public/js/fx.js`); sound is a small WebAudio synth (`public/js/sfx.js`). Progress is saved in the browser.

## Build

```bash
./build.sh check    # syntax check
./build.sh dev      # local server with the leaderboard
./build.sh deploy   # publish to Cloudflare Workers
```

Stack: static files in `public/` plus a Worker (`src/worker.js`) with one SQLite Durable Object for the leaderboard.

Made by Virat Reddy Kaukuntla ([@learningnihongo934-byte](https://github.com/learningnihongo934-byte)).
