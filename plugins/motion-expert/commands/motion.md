---
name: motion
description: "Short product film or social ad from real UI: brief (genre ad|demo) → beats → G0 art direction (3 text sketches → blind tone lock → reference board → look.md + 3 key frames) → real screenshots → deterministic scene → stills (G1) → draft + critic (G2) → verified master. Spawns motion-expert."
---

# /motion — Product Film Pipeline

Spawn the `motion-expert` agent with the brief below. It routes every step to its owning skill and STOPS at the owner's art-direction step (G0), stills gate (G1) and draft gate (G2).

**Complete documentation**: `skills/motion-method/SKILL.md`

## Usage

```
/motion 20 s launch clip for the new statusline, Linear-launch style, 16:9 mp4 + README GIF
/motion 9:16 social cut showing the review queue, one accent, under 8 MB
/motion terminal demo of the install command, GIF for the README
/motion 15 s Reels ad for the review queue, genre ad, one CTA
```

Missing brief fields (genre ad|demo, audience, one-sentence message, named reference style, surfaces + byte budgets, duration, aspect, accent, sensitive-data list) → the agent asks ONE question first.

## Workflow

1. `skills/motion-method/SKILL.md` — lock `.motion/brief.md` (`genre: ad` → `references/ad-genre.md`, you confirm the message), write the beat map (DURATION = sum of beats; a gesture on every beat of the grid — no span over 0.75 s without one, the final CTA still ≤ 1.2 s).
2. `skills/motion-art-direction/SKILL.md` — G0: 3 text sketches (tone candidates) → challenger locks the tone blind → reference board → `.motion/look.md` (dials) + 3 key frames → you see the key frames → **STOP (G0)**. No `.motion/scene/*` file is written before you approve.
3. `skills/motion-assets/SKILL.md` — real screenshots, masked, "Example data" label, `.motion/assets.json`.
4. Scene: `motion-art-direction` templates first (`cut-rhythm` → `composition-grid` → `kinetic-type` → `objects.md`), built against `look.md`; `skills/motion-render/SKILL.md` supplies only the `window.seek(t)` / capture / encode mechanics.
5. `bun .motion/render.js --stage stills` → one still per beat on a contact sheet → **STOP (G1)**, owner approves.
6. `--stage draft` → `motion-critic` via `skills/motion-review/SKILL.md` (≤2 fix rounds) → **STOP (G2)**, owner approves.
7. `--stage master` → ffprobe, frame count, size vs budget, frames diffed vs approved stills; sniper on scripts, challenger on "done".

## Gates

G0 (look.md + 3 key frames) is an owner step that the harness does not enforce yet. The agent stops and waits for your approval in your own message, and writes no scene file before it. G1/G2 are **enforced** by the harness `motion` scope: `--stage draft` and `--stage master` are denied until you approve. The deny shows a code; type, as your whole prompt, `MOTION-APPROVE stills <code>` (G1) or `MOTION-APPROVE draft <code>` (G2). Re-rendering voids the approval. `.motion/project.json` is yours to create; the agent gives you the content and never writes it, nor an approval.

## Forbidden

Skipping the brief lock. Any scene file before G0 approval. Any decorative effect, fade, crossfade or drift (list: `skills/motion-craft/references/anti-slop-video.md`). Rendering draft or master without owner approval of the current artefact hash. Invented UI, client names, or real spend amounts on screen. Reporting a master as done from the render exit code instead of ffprobe + frame diff.
