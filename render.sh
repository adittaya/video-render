#!/usr/bin/env bash
# One command to render.  Usage:  bash render.sh [scale]
#   scale 0.25 = fastest/low   (default 0.5)   1 = full 1920x1080
set -euo pipefail
cd "$(dirname "$0")"
SCALE="${1:-0.5}"
npm install --no-audit --no-fund
npx remotion render FilmWithReveal out/preview.mp4 --scale="$SCALE"
echo; echo "DONE -> out/preview.mp4"; ls -lh out/preview.mp4
