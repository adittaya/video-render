# video-render

Temporary public repo that renders the Sarvam brand film on GitHub Actions.

## What it does
- Pulls the heavy media (images, audio) from the `assets-v1` release.
- Renders the approved **logo reveal** (self-contained HTML in `reveal/`) to `logo_reveal.mp4`
  with headless Chrome + ffmpeg — deterministic, one screenshot per frame.
- Renders the film with **Remotion**, at a low scale for fast preview.

## Run it
Actions → **Render Sarvam film** → *Run workflow*
- `scale`: `0.25` (fastest) · `0.5` (preview) · `1` (full)
- `composition`: `FilmWithReveal` (reveal + film) or `SarvamFilm` (film only)

The finished MP4 is attached as a build artifact named `sarvam-preview`.
