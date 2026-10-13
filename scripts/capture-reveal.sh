#!/usr/bin/env bash
# Renders the approved logo reveal (self-contained HTML) to a deterministic MP4
# by screenshotting each frame with headless Chrome, then assembling with ffmpeg.
set -euo pipefail

CHROME="${CHROME_PATH:-}"
if [ -z "$CHROME" ]; then
  CHROME="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || true)"
fi
if [ -z "$CHROME" ]; then echo "ERROR: no Chrome found"; exit 1; fi
echo "Chrome: $CHROME"

FPS=30
DUR=10
N=$((FPS * DUR))
mkdir -p frames public

for ((i=0; i<N; i++)); do
  t=$(awk "BEGIN{printf \"%.5f\", $i/$FPS}")
  "$CHROME" \
    --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
    --enable-unsafe-swiftshader --force-device-scale-factor=1 \
    --window-size=1280,720 --virtual-time-budget=4000 \
    --screenshot="frames/f_$(printf '%04d' "$i").png" \
    "file://$PWD/reveal/sarvam_logo_reveal.html?t=${t}&bare=1" >/dev/null 2>&1
  if [ $((i % 50)) -eq 0 ]; then echo "  frame $i / $N"; fi
done

echo "frames captured: $(ls frames | wc -l)"
ffmpeg -hide_banner -loglevel error -framerate "$FPS" -i frames/f_%04d.png \
  -c:v libx264 -pix_fmt yuv420p -crf 16 -vf scale=1920:1080 -y public/logo_reveal.mp4
ls -lh public/logo_reveal.mp4
