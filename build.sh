#!/usr/bin/env bash
# Lucklight build script.
#   ./build.sh check    syntax-check every JS file
#   ./build.sh dev      run locally with the leaderboard at http://localhost:8787
#   ./build.sh deploy   check, then publish to https://lucklight.rennko.tech (Cloudflare Workers)
set -euo pipefail
cd "$(dirname "$0")"

check() { for f in public/js/*.js src/*.js; do node --check "$f"; done; echo "JS ok"; }

case "${1:-check}" in
  check)  check ;;
  dev)    check && npx -y wrangler@4 dev ;;
  deploy) check && npx -y wrangler@4 deploy ;;
  *) echo "usage: ./build.sh [check|dev|deploy]"; exit 1 ;;
esac
