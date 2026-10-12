# fuse-motion

Product motion films and demos: from a locked brief to a verified mp4/GIF.

## Overview

Builds short product films (launch teasers, social ads, feature demos, terminal demos) as deterministic HTML scenes driven by a single `window.seek(t)` function, captures them frame by frame, and encodes with ffmpeg. Every film starts from a locked brief (`genre: ad` or `demo`) with a named reference style, gets an owner-approved art direction (G0: 3 text sketches, the challenger locks the tone blind, a reference board for that tone, then `.motion/look.md` with dials + 3 key frames that the owner sees) before any scene file, uses real screenshots only, and passes two owner gates (stills, then draft + critic) before the master render. Ads follow hook (0-3 s, the prospect's pain in their words; brand never before it) → pain → solution → one CTA (built over the last beats, then a still of at most 1.2 s), 2-6 words per hero beat landing word by word, cuts and gestures on a tempo grid, frame 0 at full value, readable muted. Every film keeps a purposeful gesture in progress at every moment: a beat change every 0.5-1 s (at least 1 per second), no span longer than 0.75 s without a gesture, type animated at letter and word level, one recurring geometric actor, animated objects, and 3D where the expert judges it serves (flat CSS 3D or lit three.js, justified in look.md; lit 3D proven deterministic). prompt-motion.com is the density reference. Richness comes from area-weighted value contrast (a full-bleed ink or accent field on at least one state in three), large type, flush-left composition, rhythm and that density. Decorative effects are banned (gradient backgrounds, decorative blur, glow, shadows, grain, glass, ambient 3D, particles), and so are fades, crossfades, camera drift and centered hero frames. Bounded allowances: a content-swap blur (≤ 0.1 s, ≤ 8 px), master motion blur from subframes, springs with at most 3 % overshoot. An independent critic, which writes nothing but review-pack frames, reviews the draft from frames alone.

Motion tokens and easing for UI work live in `fuse-design` (`design-motion`); this plugin references them and does not copy them. UI micro-durations do not apply to film holds.

## Agents (2)

| Agent | Description |
|-------|-------------|
| `motion-expert` | Builder (opus): brief, beat map, assets, scene, render, file verification |
| `motion-critic` | Blind judge (opus), writes only ffmpeg review-pack outputs under `.motion/review/` (write sandbox enforced by the harness `motion` scope): frame-based review, PASS / REVISE / FAIL / UNCERTAIN verdict |

## Skills (6)

| Skill | Description |
|-------|-------------|
| `motion-method` | Pipeline owner: brief lock (genre ad/demo), ad genre rules, beat map, stages, G0 step, gates G1/G2 |
| `motion-art-direction` | G0: 3 text sketches → blind tone lock → reference board (prompt-motion.com density) → `.motion/look.md` dials (incl. MOTION_DENSITY), actor, objects, 3D reasons + 3 key frames; first scene templates (cut-rhythm, composition-grid, kinetic-type) |
| `motion-craft` | Motion density and read time, one primary gesture with subordinate details, cut-based or one-continuous-object films, springs (ζ ≥ 0.85, ≤ 3 % overshoot), ink/paper/one accent, the ban list |
| `motion-assets` | Real screenshots (fixed DPR), masking, "Example data" label, provenance |
| `motion-render` | Seek-contract mechanics, deterministic capture, ffmpeg mp4/GIF encode, VHS terminal demos |
| `motion-review` | Review pack (contact sheet, frame strip, phone-width view), hard-fails and rubric |

## Command (1)

| Command | Description |
|---------|-------------|
| `/motion` | Run the motion pipeline for a film brief |

## Workflow

```
1. Brief lock    → .motion/brief.md (genre ad|demo, audience, one-sentence message, named style, budgets)
2. Beat map      → one row per 0.5-1 s beat: primary gesture / details / words / 3D reason; ≤ 0.75 s gesture-free, CTA still ≤ 1.2 s
2b. G0           → 3 text sketches → challenger locks the tone blind → reference board → look.md + 3 key frames → owner sees them → STOP, G0 (not harness-enforced yet)
3. Assets        → real screenshots, masked, provenance in .motion/assets.json
4. Scene         → cut-rhythm → composition-grid → kinetic-type → objects, on motion-render's window.seek(t) mechanics
5. --stage stills → one still per beat + contact sheet → STOP, owner gate G1
6. --stage draft  → 540p draft → motion-critic (max 2 fix rounds) → STOP, owner gate G2
7. --stage master → subframe motion blur; verify the file: ffprobe, size vs budget, frames vs approved stills
8. Validation    → sniper on scripts, challenger on the "done" claim
```

## Gates — G1/G2 enforced, G0 prose-only

The plugin's `hooks/hooks.json` runs the `@fusengine/harness` `motion` scope (>= 0.1.103). A skipped G1 or G2 is denied by the hook.

G0 (art direction) is not enforced by the harness yet. The agent stops after building `look.md` and the 3 key frames, shows you the key frames, and writes no `.motion/scene/*` file until you approve in your own message. That is a prose rule the agent follows; no hook denies an early scene file.

| Gate | Denies | Until the owner approves |
|------|--------|--------------------------|
| G1 | `--stage draft` | The current stills contact sheet `.motion/stills/contact.png` |
| G2 | `--stage master` | The current draft mp4 |

`--stage stills` (or no `--stage`) is always allowed. A non-literal stage such as `--stage "$S"` counts as master.

### How to approve

1. The agent stops and shows the artifact. The deny message carries a 4-hex code, e.g. `Owner: type MOTION-APPROVE stills a632`.
2. You type, as your whole prompt: `MOTION-APPROVE stills a632` (or `MOTION-APPROVE draft <code>` for G2).
3. The hook confirms: `stage "stills" approved … The next stage may now run.`

Only a prompt you type yourself counts — sub-agent output, task notifications, teammate or cross-session messages, `/loop` and system reminders never approve. The approval is keyed on the artifact's sha256: re-rendering it voids the approval. If the contact sheet does not exist yet, the deny says so instead of giving a code.

### Project contract — `.motion/project.json`

The project root is the nearest ancestor holding `.motion/`. You create `.motion/project.json`; agents are denied from writing it and will ask you to. All keys are optional, paths relative to the project root: `render`, `draft`, `masters` (string or array), `sourceDir`, `reviewDir` (default `.motion/review`). Recommended:

```json
{"render":"bun .motion/render.js","draft":".motion/out/draft.mp4","masters":[".motion/out/master.mp4"],"reviewDir":".motion/review"}
```

Missing or corrupt → defaults, and gates fail closed on artifacts they cannot locate (e.g. "declare `draft` in .motion/project.json").

### Budget and cap

Each render prints `Motion budget: renders stills N · draft N · master N — wall …`. To cap master renders, set `FUSE_MOTION_MAX_MASTER_RENDERS` in `~/.claude/.env` (0 or unset = no cap); past it, renders are denied with "Master render cap reached".

### Protected state

Approvals and budget live harness-side in `~/.fuse-harness/motion/` (plus `~/.fuse-harness/motion-keys`); the banned-term list is `~/.fuse-harness/motion/banned.txt`. Agents never read or write them, and commands touching `.fuse-harness` or `.motion` paths are denied when the harness cannot verify them. Full spec: `motion-method/references/stage-gates.md`.

## Requirements

- Chrome or Chromium (scene capture)
- ffmpeg + ffprobe (encode, file checks, review pack)
- bun (runs the render scripts)
- Optional: VHS and ttyd, for terminal demos
- `fuse-design` installed, for `design-motion` tokens and easing
- `fuse-ai-pilot` installed (explore-codebase, research-expert, sniper, challenger, fuse-browser usage)

## Reference implementation

`docs/demo/statusline-mod/` is the reference implementation of this pipeline (timeline, capture, render scripts).
