# Sarvam brand film

Motion-graphics brand film for Sarvam AI — **Remotion 4 + React + TypeScript**. 16:9, 30 fps.

The approved **logo reveal** is a real composition in this project (not an external clip),
and it plays first, then the film.

## Render

```bash
npm install
npx remotion render FilmWithReveal out/preview.mp4 --scale=0.5
```

Or: `bash render.sh 0.5`

## Watch without rendering

```bash
npx remotion studio
```

## Compositions

| id | frames | duration | what |
|---|---|---|---|
| `LogoReveal` | 300 | 10.00 s | the approved logo reveal on its own |
| `SarvamFilm` | 3326 | 110.87 s | the film |
| `FilmWithReveal` | 3626 | 120.87 s | reveal, then the film |

The film sits inside a `<Sequence>`, so its internal frame clock — and therefore the audio,
which is the master clock — still starts at 0.

## Speed

`--scale` is the main lever: `0.25` → 480×270, `0.5` → 960×540, `1` → 1920×1080.
Add `--concurrency=8` to push further.

## Layout

```
src/LogoReveal.tsx        the approved logo reveal (native Remotion composition)
src/revealAssets.ts       official Sarvam marks as data URIs (supersampled from vector)
src/OrbShader.tsx         obsidian / smoked-glass sphere (WebGL)
src/Film.tsx              the film — 14 beats on the voiceover timeline
src/ProductUI.tsx         motion-graphics fragments
src/ComposerSequence.tsx  the 15-frame composer storyboard
src/Root.tsx              compositions
reveal/                   the same reveal as a standalone HTML (for reference)
public/                   images, fonts, audio
```

## Brand notes

- The palette is Sarvam's **continuous blue → orange run** (deep blue → #C1CCF5 → #F1C5AA →
  orange), taken from the official brand system — not discrete colour blocks.
- Marks come from the official brand assets (`sarvam-logo-black.svg`,
  `sarvam-wordmark-black.svg`), supersampled from vector. Never redrawn.
- Audio is the master clock. Beat boundaries in `Film.tsx` derive from word-level voiceover
  timestamps — don't retime beats without re-checking against `public/mixed_audio.wav`.
- Indic script is pre-rendered to PNGs (`indic_line.png`, `tamil_line.png`) because headless
  Chrome renders Indic text inconsistently.
