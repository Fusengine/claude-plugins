---
name: objects
description: Animated objects as first-class film material — the one recurring geometric actor (a hard-edged plane or accent block that travels, wipes, splits the frame, grows to full bleed and becomes the CTA), the object vocabulary (blocks, cubes, prisms, circles, arrows, lines, flat stand-ins for the product, the brand mark as an object), the transforms between objects, and 3D by judgment (where it serves a reveal, a transform or a transition; flat-shaded CSS 3D or lit three.js; every choice justified in look.md and the beat table; ambient 3D and banned materials never)
when-to-use: Planning the actor and objects at Gate 0, writing look.md's objects/3D fields and the state table, deciding whether a beat uses 3D and in which style, or when a draft has type but nothing else moving
keywords: objects, actor, recurring actor, accent block, plane, wipe, split, full bleed, cta, cube, prism, circle, arrow, line, browser frame, phone, server stack, chat bubble, brand mark, assemble, stack, snap, transform, morph, 3d, css 3d, three.js, lit, flat-shaded, judgment
priority: high
related: rhythm.md, type-as-image.md, composition.md, contrast.md, bans.md, templates/look.md
---

# Objects and the Actor

## Overview

The owner's words: "pas seulement typo mais joue avec des objets animés et des fois en 3D".
Type stays the image, but it is no longer alone. Flat, hard-edged objects in the palette
(ink / paper / one accent) move with purpose — travel, stack, assemble, snap together,
transform into the next object, become the CTA — and one of them, **the actor**, ties every
beat to the next. Density comes from these purposeful gestures, never from ambient motion.

---

## The recurring actor (one per film)

A hard-edged plane or solid accent block. It is the connective tissue between beats: it
**morphs, never fades**.

| Job | What it does | When |
|-----|--------------|------|
| Travel | Crosses the frame under or beside the key word | Hook, a beat with a held word |
| Wipe | Its edge sweeps across and the next state is behind it | State changes (instead of a plain cut) |
| Split | Cuts the frame into two planes; a word splits along its edge | Pain, turn |
| Full bleed | Grows past all four corners and becomes the ground | The turn (accent cut) |
| CTA | Shrinks or grows into the CTA band/button the name sits on | The last beats |

Name it in look.md (`actor:` field) with its colour role, its rest geometry and the beats
where it acts — at least 3 jobs across the film, the last being the CTA.

---

## Object vocabulary

| Family | Objects | Stands for |
|--------|---------|------------|
| Geometric | Block, bar, cube, prism, circle, arrow, line | Structure, direction, a step, a count |
| Product stand-ins (flat shapes) | Browser frame, phone, server stack, chat bubble, card, toggle | The product's world — drawn as flat shapes, never a fake UI screen ([S2](../../motion-review/references/hard-fails.md)) |
| Brand mark | The logo as an object (a hexagon logo → a hexagonal prism) | The payoff; often the CTA |

Rules: palette only (ink / paper / accent, plus one darker/lighter step of the accent for a
3D face); hard edges; no stroke weights that fight the type; never a decorative shape with
no meaning (critic D8 particles, X1 slop).

## Transforms between objects

| Transform | Example | How |
|-----------|---------|-----|
| Assemble / disassemble | Blocks snap into a server stack | Each block on `springBox`, staggered 80–120 ms |
| Stack | Cards stack into a deck | Same, vertical |
| Snap together | Two halves of an arrow meet | `springUI`, one curve |
| Morph | Chat bubble → card → button | One element, `springSum` on width/height/radius/colour per beat ([continuous-take](../../motion-craft/references/continuous-take.md)) |
| Become the CTA | The actor → the CTA band | The last morph before the final still |

Every transform is a primary gesture on the grid (one at a time); small parts settling
after it are secondary details.

---

## 3D — by judgment

3D is a normal tool with **no quota**. The expert decides where it serves the story and
how much of it, and writes why. In an `ad`, 3D is a **main gesture family, not a garnish**
(owner: "plus d'animation 3D"): plan it on several beats — panel flips between states,
face turns that reveal the next word or object, a fold into the CTA, the logo or a product
object built as a solid — and land the strongest turn on an accented kick or the drop. One
lone 3D beat in an ad is under-using it; ambient 3D stays banned.

**3D must read as 3D on the still, not only mid-turn.** A flip lasting a few frames and then
settling flat is invisible to the viewer (owner, looking at the G1 contact sheet: "tu vois de
la 3D ?" — no). A 3D beat passes only if its **settled still** shows a solid:

| Requirement | Value |
|-------------|-------|
| Angle at rest | Held at a three-quarter view (≈ 20-35° on Y, 10-25° on X), never squared back to face-on |
| Faces visible | ≥ 2, better 3 (front + side + top) |
| Face values | Each visible face a **different** palette value (ink / paper / accent / one accent step) — two faces of the same value read as a flat shape |
| Size | The solid is a main object (≥ 25 % of the frame width), not a corner icon |
| Depth | Real `perspective` (CSS ≈ 800-1400 px at 1080 w) or a three.js camera — no fake skew |

Check on the contact sheet: if a 3D beat's still could be drawn with flat rectangles, it
fails — fix the rest angle, not the transition.

| Decide | Options |
|--------|---------|
| Where | A reveal (a face turns to show the result), a transform (one object becomes another), a transition (a panel flips into the next state), the logo, a product object |
| Style | **Flat-shaded** — CSS 3D faces, each one palette value (`motion-render` timeline-seek `#cube`) — or **lit** — three.js with lights, natural shading on the object's own faces ([webgl-scene.md](../../motion-render/references/templates/webgl-scene.md)) |
| Proof | Lit 3D needs the stills rendered twice with identical sha256 (seeded scene, fixed DPR); no proof → CSS 3D |

Every 3D gesture is recorded twice: in the beat table (`d3` reason in cut-rhythm, `3d`
column in beats.md) and in look.md's `objects` field — **why 3D here, why this style**.

**Still banned, whatever the style:** ambient or decorative 3D (spinning with no purpose,
floating shapes), glow and bloom, drop shadows on the ground, environment reflections,
chrome or glass materials, depth of field, grain, gradient backgrounds, particles. The
light shading a lit object's own faces is the only exception to the gradient ban, and it
applies only to that surface.

---

## Checks at Gate 0

| Check | Pass when |
|-------|-----------|
| Actor named | look.md `actor:` gives colour, geometry, ≥ 3 jobs, the last = CTA |
| Objects mean something | Each object in the state table names what it stands for |
| 3D justified | Each 3D beat has a job (reveal / transform / transition) and a style reason |
| 3D visible at rest | Each 3D beat's still shows a solid at ¾ view, ≥ 2 faces of different values |
| Lit 3D provable | The twice-rendered sha256 step is planned before G1 |
| Palette | Objects use ink / paper / accent only (+ one accent step on a 3D face) |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Type only, nothing else moves | Give the actor its jobs; let an object stand for the product |
| A shape for decoration | Name what it stands for, or cut it |
| A cube spinning while a word reads | Ambient 3D (D7): give the turn a job, on its beat |
| Chrome logo with reflections | Flat faces or Lambert-lit faces; no env map |
| Actor fading out | It morphs, wipes or becomes the next thing — never a fade |

## Related

- [rhythm.md](rhythm.md) — where the actor's jobs fall on the grid
- [type-as-image.md](type-as-image.md) — the type that moves with the objects
- `motion-render` → timeline-seek.md (actor, CSS 3D cube), webgl-scene.md (lit three.js), interaction-kit.md
