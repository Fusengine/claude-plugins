---
name: look
description: Complete .motion/look.md template — register, tone locked blind by the challenger from 3 text sketches, signature device, 7 argued dials (area-weighted VALUE_CONTRAST, TYPE_SCALE, HOLD read floor, MOTION_DENSITY ≥ 1 gesture/s with ≤ 0.75 s gesture-free and a CTA still ≤ 1.2 s), OKLCH colour roles, px type ramp at the 1080-wide frame, 6-col grid, kinetic set at letter/word level, the recurring actor, objects with every 3D beat justified (why 3D, why this style), tempo, the state table that plans planes, words and gestures per beat, 3 key frames in words (frame 0 at full value, nothing centered), borrowed/not-borrowed, banned list B1-B23, owner approval after seeing the key frames
keywords: look.md, gate 0, g0, dials, value contrast, area-weighted, full bleed, motion density, gesture, actor, objects, 3d, oklch, type ramp, grid, kinetic, tempo, state table, planes, key frames, banned, approval
---

# look.md Template

Every field is mandatory ([../gate-zero.md](../gate-zero.md)). A field left `TBD` means the
gate is closed: no file under `.motion/scene/` is written until this file and its 3 key
frames exist **and** the owner has seen the key frames and approved. That rule is prose
only; the harness does not enforce G0 yet. The values below are a worked example (15 s
9:16 ad, 1080×1920, 30 fps) matching the [cut-rhythm.md](cut-rhythm.md) example; replace
all of them. Units: px at the 1080-wide frame, OKLCH L 0–100.

---

## File: `.motion/look.md`

```markdown
# Look — <film name>
status: draft                       # draft → approved (G0)
board: .motion/refs/board.png       refs: .motion/refs/refs.md (3 traits × 2, one trait = motion density)

## register
brand                               # brand (ad) | product (demo from real UI)

## tone  (one extreme, locked blind — sketches came before the board)
Percussive and dry: a gesture on every beat, no breath until the CTA, then a dead stop.
challenger (blind, 3 text sketches, <date>): "<quoted reason, one paragraph>"
salvaged from losing sketch: <one idea + where it lands | none, because …>

## signature  (one device, used ≥ 2×)
Every act change is a full-frame ink↔paper inversion on the downbeat; type keeps its
position across the cut. At 2.5, 6.0, 10.0, 11.0 s (4 uses).

## dials  (one argued line each — dials.md; equal to the critic floors)
DESIGN_VARIANCE   7  flush-left everywhere, word-object bleeds in hook and turn
VISUAL_DENSITY    3  one word-object or display line + the actor per state; state table proves it
MOTION_INTENSITY  7  6 kinetic behaviours rotated, one actor with 4 jobs, two 3D turns
VALUE_CONTRAST   64  area-weighted, worst state = CTA (ink 75 % vs accent band 25 %: 78 − 14)
  full bleed      8  ink/accent ≥ 50 % on 8 of 12 states (≥ ⌈12/3⌉ = 4 needed)
TYPE_SCALE      7.7  hook 400 / 52; mid 360 / 52 = 6.9; CTA 300 / 52 = 5.8; largest ≥ 180 everywhere
HOLD           0.25  s/word read floor; states ≥ 0.5 s for 2 words
MOTION_DENSITY  2.0  28 primary gestures / 14.0 s body; longest gesture-free span 0 s; CTA still 1.0 s

## colour  (OKLCH; no mid-tone fills; accent is a plane ≥ 20 % or one keyword)
ink     oklch(14% 0.01 260)    ground of hook, proof, CTA; ink band on paper states
paper   oklch(97% 0.01 90)     upper plane of pain and breath states; type on ink
accent  oklch(78% 0.17 65)     the actor; full-bleed at the turn; CTA band (25 %); ink type on it
accent-dark oklch(62% 0.15 60) one step, used only on a 3D face turned from the light
body/label contrast: ink/paper ≥ 7:1 ✓, ink/accent ≥ 7:1 (verify with a contrast checker)

## type  (px at the 1080-wide frame; one family + one display word; ≤ 2 weights)
text family:    <family, shipped locally>   weights 400 / 800
display word:   <serif/display face>        word-objects only
word-object     300–420  (may bleed off the frame)
display         200      (hero floor 180)
label            52      (minimum 44)
tracking: display −0.03 em (verify on the face); case: lowercase

## grid
6 cols · margins 72 px · gutter 24 px · col 136 px · rows 12 × 160 px
safe zone: top 14 %, bottom 35 %, sides 6 % (verify on Meta 9:16 guidance, <date>)
alignment: flush-left on col 1 or col 3; no centered hero frame, CTA included

## kinetic  (letter/word level, rotated, never the same twice in a row — kinetic-type.md)
letter stagger (30 ms, mask rising) · slam (full size on the cut, pushed out by the next) ·
scale jump (3.5× → set size) · split along the ink/paper plane · push · weight swap
entrance cubic-bezier(.16,1,.3,1) · push cubic-bezier(.6,0,.2,1) · springs 120/19 (ζ 0.87)
no opacity: states cut by visibility; no crossfade, no drift

## actor  (one recurring geometric actor — objects.md)
accent block, rest 360 × 120 px at row 9; jobs: travels under "still" (0.0) · floods to
the turn's accent field (5.5) · splits the breath frame (10.0) · grows into the CTA band (11.0)

## objects  (what each stands for; every 3D beat: why 3D, why this style)
server stack (3 flat blocks) = the deploy pipeline · hexagonal prism = the brand mark
3D proof-4 9.0 s  flip · reveal: the server block turns to its check face · CSS 3D, flat faces (accent / accent-dark)
3D cta 13.0 s     flip · transform: the hexagon mark turns face-on as the CTA · lit three.js r186
                  (one key light on its own faces) — stills twice, same sha256, or fall back to CSS 3D

## tempo  (templates/cut-rhythm.md)
120 BPM (measured: <none | track, first downbeat at <s>>) · beat 0.5 s · subdivision 0.25 s ·
FPS 30 · tolerance ±1 frame · gesture-free ≤ 0.75 s · final CTA still ≤ 1.2 s

## states  (one line per state: time · planes ≥ 20 % · words · gestures per beat [primary | details])
hook-1   0.0–1.5   ink 100 % · "still" 400 px bleeding left + label 52 px · 0.0 actor travels | 0.5 label letters stagger | 1.0 rule draws
hook-2   1.5–2.5   ink 100 % · "broke" 220 px · 1.5 slam | 2.0 "split" halves part at row 8
pain-1   2.5–3.5   paper 55 % / ink band 45 % · 4 words 200 px · 2.5 scale jump 3.5× | 3.0 underline draws
pain-2   3.5–4.5   paper / ink band · 3 words · 3.5 word stagger | 4.0 push
pain-3   4.5–5.5   paper / ink band · 2 words · 4.5 slam (accent switch on "slow") | 5.0 split
turn     5.5–6.0   accent 100 % (the actor) · 1 word 220 px · 5.5 actor floods
proof-1  6.0–7.0   ink 100 % · "0" 360 px + label · 6.0 counter springs | 6.5 rule draws [counter retargets]
proof-2  7.0–8.0   ink · "0" match cut · 7.0 scale jump | 7.5 stagger
proof-3  8.0–9.0   ink · 2 words · 8.0 slam | 8.5 push
proof-4  9.0–10.0  ink · server stack · 9.0 3D flip to the check face | 9.5 stagger
breath   10.0–11.0 paper 60 % / ink 40 % split · 1 word · 10.0 split at the plane | 10.5 rule draws
cta      11.0–15.0 ink 75 % / accent band 25 % · name 300 px + URL 52 px · 11.0 actor → band |
                   11.5 name slams | 12.0 URL staggers | 12.5 rule draws | 13.0 mark turns (3D) |
                   13.5 weight swap | 14.0–15.0 still (1.0 s)

## keyframes  (words; position · size · role — the owner sees these before any scene code)
frame 0 (t=0.00)  full value, nothing fading. Ink field 100 %. "still" paper, 400 px, x=−60
                  (bleeds left), baseline row 7. Label "your deploys" paper 52 px, col 1, row 9.
                  Accent actor 360 × 120 entering from the left edge at row 10.
mid    (t=7.40)   ink field. "0" paper 360 px col 1–2 rows 5–7, "failed" 200 px col 3, same
                  baseline. Redrawn log line 52 px col 1 row 9. TYPE_SCALE 6.9.
CTA    (t=14.50)  ink field; accent band rows 6–8 full width (25 %). "<product>" ink 300 px
                  flush-left col 1 on the band; URL paper 52 px col 1 row 10; mark face-on col 5.

## borrowed  (from refs.md — one borrow / one don't per reference)
01 Don't Blink      borrow: one word per state, 5–7 frames      don't: CG product shots, music
02 prompt-motion    borrow: a gesture on every beat, letter-level type, one element carrying focus
                    don't: their assets, glass, glows, particles
… (6 lines)

## banned  (bans.md B1–B23, plus film-specific)
B1–B23 all apply · film-specific: no lowercase/uppercase mixing; no second accent

## approval
G0: pending                         # owner saw the 3 key frames + this file; approved in message on <date>
sha256(look.md): <hash at approval>
```

---

## Checks before showing it

| Check | Pass when |
|-------|-----------|
| No `TBD`, no empty field | `grep -n "TBD" .motion/look.md` returns nothing |
| Dials argued | Each dial line has a reason, not only a number |
| Planes named | Every state line gives its planes ≥ 20 % with shares; no state is a lone paper plane |
| Full bleed planned | Ink/accent ≥ 50 % states ≥ ⌈N/3⌉ |
| Gestures planned | Every state names a primary gesture per beat; no span > 0.75 s without one; the CTA is built, then still ≤ 1.2 s; ≥ 1 primary per second |
| Rotation | No behaviour twice in a row in the state table |
| Actor | Named, ≥ 3 jobs, the last = CTA |
| 3D justified | Every 3D beat has a job and a style reason; lit 3D has its sha256 proof step |
| Key frames concrete | Each has grid positions, px sizes and colour roles; frame 0 at full value; none centered |
| Type floors | Largest type ≥ 180 px and TYPE_SCALE ≥ 4 on each key frame |
| Bans copied | `banned` lists B1–B23 |

## Adapting

| Situation | Change |
|-----------|--------|
| `register: product` (demo) | States name real screenshots (`motion-assets`); a cursor or counter keeps a gesture in progress while a UI region is read |
| One continuous object film | `actor` is the object itself; states are its shapes; gestures are its retargets, content swaps and cursor actions |
| 16:9 | Grid 12 cols at 1920×1080, margins 96 px; px values × `W / 1080` |
| Paper-dominant tone | Swap ground roles, keep an ink/accent plane ≥ 20 % on every paper state |
| No 3D | Leave `objects` with its stand-ins and write "3D: none, because …" |
