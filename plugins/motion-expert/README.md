# fuse-motion

Short product films built from **real UI**: launch clips, social ads, README GIFs, social cuts, terminal demos. A film is code — an HTML scene driven by `window.seek(t)`, captured frame by frame in headless Chrome, encoded with ffmpeg — so the same source renders the same frames every time, and the owner approves stills and a draft before the master is rendered.

## Purpose

Most generated motion fails the same ways: no single message, text too fast to read on a phone, invented UI, decorative "AI" effects (gradients, glow, blur, ambient 3D, grain), fades and slow camera drift instead of value contrast, large type, composition and rhythm, and still frames where nothing purposeful moves — and a "done" claimed because the render command exited 0. `fuse-motion` turns each of those into a step with an owner, a gate, or a check on the output file itself.

## Agents

| Agent | Model | Role |
|-------|-------|------|
| `motion-expert` (`agents/motion-expert.md`) | opus | Builder and thin router. Moves the brief through the pipeline, dispatching each step to its skill. Stops at G0 (owner step), G1 and G2. |
| `motion-critic` (`agents/motion-critic.md`) | opus | Blind judge; writes nothing except ffmpeg review-pack outputs under `.motion/review/` (write sandbox enforced by the harness `motion` scope). Sees frames only — never the brief or source. Restates the message in one sentence before the rubric, scores the `motion-review` rubric with frame refs, returns `PASS` / `REVISE` / `FAIL` / `UNCERTAIN` in one pass. |

## Skills

| Skill | Covers |
|-------|--------|
| `motion-method` | The pipeline: brief lock (`genre: ad\|demo`; ad = pain hook → pain → solution → one CTA, tempo grid), beat map, stage flags, artefact paths, gate spec — read first |
| `motion-art-direction` | G0: 3 text sketches → challenger locks the tone blind → reference board → `.motion/look.md` dials (area-weighted value contrast, type scale, motion density: ≤ 0.75 s gesture-free, CTA still ≤ 1.2 s, ≥ 1 beat change/s) + the actor, objects and justified 3D + 3 key frames → owner sees them; the first scene templates (cut-rhythm, composition-grid, kinetic-type at letter/word level) |
| `motion-craft` | One primary gesture with subordinate details, density and tempo grid, cut-based or one-continuous-object films, springs (ζ ≥ 0.85, ≤ 3 % overshoot), ink/paper/one accent, type as a large object, the single-source ban list (every decorative effect), phone legibility; points to `fuse-design:design-motion` for tokens |
| `motion-assets` | Real screenshots (fixed DPR), masking, "Example data" label, provenance in `.motion/assets.json` |
| `motion-render` | Seek-contract mechanics, Chrome capture, mp4/GIF encode, VHS terminal demos, byte budgets, GitHub delivery |
| `motion-review` | Review pack, ffprobe checks, rubric, hard-fails, symptom → cause table |

## Pipeline

```
1 Brief lock      .motion/brief.md (genre ad|demo, one-sentence message, named style, budgets)
2 Beat map        DURATION = sum of beats, one primary gesture per 0.5-1 s beat, ≤ 0.75 s gesture-free
2b G0             3 text sketches -> challenger locks tone blind -> board
                  -> look.md + 3 key frames -> owner sees -> STOP, G0 (not harness-enforced yet)
3 Assets          real screenshots only, masked, provenance recorded
4 Scene           classic scripts lib -> rhythm -> grid -> kinetic -> timeline (each within `FUSE_SOLID_MAX_LINES`)
5 --stage stills  one still per beat + contact sheet -> STOP, owner gate G1
6 --stage draft   540p + motion-critic (<=2 fixes)  -> STOP, owner gate G2
7 --stage master  subframe motion blur; ffprobe, frames = DURATION x FPS, size vs budget, diff vs stills
8 Close-out       sniper on scripts, challenger on the "done" claim
```

Command: `/motion <brief>` spawns `motion-expert`.

## Gates — status: G1/G2 enforced, G0 prose-only

`hooks/hooks.json` runs the `@fusengine/harness` `motion` scope (>= 0.1.103) on PreToolUse, PostToolUse, PostToolUseFailure, UserPromptSubmit, SubagentStart, SubagentStop and Stop. It fails closed.

- **G1**: `--stage draft` denied until the owner approves `.motion/stills/contact.png`. **G2**: `--stage master` denied until the owner approves the draft mp4. A non-literal `--stage` counts as master; `--stage stills` is always allowed.
- **Approve**: the deny shows a code; the owner types, as the whole prompt, `MOTION-APPROVE stills|draft <4-hex>`. Only a human-typed prompt counts. Keyed on the artifact sha256 — a re-render voids it.
- **Contract**: `.motion/project.json` (`render`, `draft`, `masters`, `sourceDir`, `reviewDir`) is owner-managed — agent writes are denied. Missing → defaults, and gates fail closed on artifacts they cannot locate.
- **Critic**: `motion-critic` is write-sandboxed to review-pack outputs under the review dir.
- **Budget**: every render prints per-stage counts and wall time; optional `FUSE_MOTION_MAX_MASTER_RENDERS` in `~/.claude/.env` caps master renders.
- **State**: `~/.fuse-harness/motion/` and `~/.fuse-harness/motion-keys` are harness-only; `.fuse-harness` / `.motion` paths are protected.

Full spec: `motion-method` → `references/stage-gates.md`.

## Requirements

- **Chrome or Chromium** — headless capture (`CHROME_BIN` overrides the lookup). Missing → the agent stops.
- **ffmpeg + ffprobe** — encode and verify. Missing → the agent stops.
- **bun** — runs the render entry.
- **VHS + ttyd** (optional) — terminal demos only.
- **fuse-design** plugin installed — `motion-craft` points to `design-motion` easing tokens instead of copying them.
- **fuse-ai-pilot** plugin installed — explore-codebase, research-expert, sniper, challenger, fuse-browser usage.

## Honesty Notes

- G1 and G2 are enforced by the harness `motion` scope hook; the agents also stop at them on their own. G0 is not enforced yet: "no scene file before the owner approves look.md and the key frames" is a prose rule the agent follows.
- Chromium determinism flags reported from the field are marked "verify on your Chromium" in `motion-render`. `--disable-gpu-compositing` (CSS 3D) and SwiftShader (lit three.js r186) were proven by twice-rendered sha256 on Chrome 154, macOS, 2026-10-11.
- GitHub README video playback limits are community reports; the default delivery is an inline GIF linking the mp4.
- Remotion is not used (license terms); mentioned only as an alternative.
