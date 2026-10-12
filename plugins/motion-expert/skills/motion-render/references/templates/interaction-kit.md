---
name: interaction-kit
description: Complete .motion/scene/interact.js — dual-edge springs (the leading edge of an indicator or knob stretches ahead of the trailing one, no bounce), a drawn cursor that clicks and drags (value from the cursor while held, spring-back from wherever it was on release), swapBlur (the one allowed blur on content swapping inside a morphing container, ≤ 0.1 s, ≤ 8 px, outgoing and incoming text on their own timing) and checkLoop (last frame = first frame, position and velocity); all pure functions of t
keywords: interaction, dual-edge, spring, stretch, squash, knob, indicator, cursor, drag, click, rubber band, spring back, content swap, swapBlur, blur, morphing container, loop, seam, velocity
---

# Interaction Kit Template

For the **one continuous object** film type ([continuous-take.md](../../../motion-craft/references/continuous-take.md))
and any UI-led beat: a drawn cursor performs real clicks and drags, and the object
retargets on every beat. Loaded after `lib.js` and `beats.js`, before `timeline.js`
([timeline-seek.md](timeline-seek.md) §script order). Uses `springUI`, `springBox`,
`inOut`, `expoOut`, `prog`, `lerp`, `clamp01` from `lib.js`.

**Tested** 2026-10-11 (node, `node --check` + numeric run with lib.js):
- `dualEdge` 0 → 300 → 100 px, width 200: stretches to 257.5 px while moving, the left
  edge peaks at 300.84 (+0.28 % of travel) and settles at 100.00 / 300.00.
- `cursorDrag` grab 400 → drag to 1000 on a 100-800 track: value 808 at mid-drag, 870
  (rubber band) at release, 829 at +0.1 s, 800 at +0.5 s.
- `swapBlur` at mid-swap: `blur(8.00px)`, outgoing hidden, incoming visible; 0.2 s throws.
- `checkLoop` passes a 4 s sine and throws on a ramp (0 vs 40 at the end).

| Helper | Rule it enforces |
|--------|------------------|
| `dualEdge` | Squash/stretch as two springs on two edges; neither passes its target by more than 0.43 % |
| `cursorDrag` | Direct manipulation: value = f(cursor) while pressed; on release, a spring from the released value to the nearest bound |
| `swapBlur` | Throws past 0.1 s or 8 px (`motion-review` D2 a); outgoing exits in the first half, incoming enters in the second, never overlapping |
| `checkLoop` | Position and velocity match at 0 and DURATION, or the loop stutters |

---

## File: `.motion/scene/interact.js`

```javascript
/**
 * Interaction kit (fuse-motion): dual-edge springs, a cursor that clicks and drags,
 * a bounded content-swap blur and a loop-seam check. Classic script loaded after lib.js
 * and beats.js; every function is a pure function of `t`.
 */

/**
 * Dual-edge spring: the two edges of an indicator ride different springs. Per move, the
 * edge on the side of travel leads (springUI), the other trails (springBox), so the shape
 * stretches while moving and returns to its width on landing — no bounce.
 *
 * @param {number} t - Film time (s)
 * @param {number} x0 - Left edge at rest before the first move (px)
 * @param {number} width - Width at rest (px)
 * @param {Array<{at:number, to:number}>} moves - New left-edge targets, in time order
 * @returns {{left:number, right:number}}
 */
function dualEdge(t, x0, width, moves, lead = springUI, trail = springBox) {
	let left = x0, right = x0 + width, prev = x0;
	for (const m of moves) {
		const d = m.to - prev;
		const forward = d > 0;
		left += d * (forward ? trail : lead)(t - m.at);
		right += d * (forward ? lead : trail)(t - m.at);
		prev = m.to;
	}
	return { left, right };
}

/**
 * Cursor-driven drag: the cursor travels to the handle, presses at `down`, drags to `to`
 * and releases at `up`. While held the value is computed from the cursor position (with
 * a rubber-band stretch past the range); on release it springs back from wherever it was
 * to the nearest bound.
 *
 * @param {number} t
 * @param {{start:{x:number,y:number}, grab:{x:number,y:number}, to:{x:number,y:number},
 *          arrive:number, down:number, up:number, min:number, max:number, stretch?:number}} d
 *        x positions map 1:1 to the value's px track; `stretch` = rubber factor past a bound
 * @returns {{cursor:{x:number,y:number}, pressed:boolean, value:number}}
 */
function cursorDrag(t, d) {
	const k = d.stretch ?? 0.35;
	const toValue = (x) => (x > d.max ? d.max + (x - d.max) * k : x < d.min ? d.min - (d.min - x) * k : x);
	const approach = inOut(prog(t, d.down - d.arrive, d.down));
	const drag = inOut(prog(t, d.down, d.up));
	const cursor = t < d.down
		? { x: lerp(d.start.x, d.grab.x, approach), y: lerp(d.start.y, d.grab.y, approach) }
		: { x: lerp(d.grab.x, d.to.x, drag), y: lerp(d.grab.y, d.to.y, drag) };
	const released = toValue(d.to.x);
	const rest = Math.min(d.max, Math.max(d.min, released));
	const value = t < d.down ? toValue(d.grab.x)
		: t < d.up ? toValue(cursor.x)
		: released + (rest - released) * springUI(t - d.up);
	return { cursor, pressed: t >= d.down && t < d.up, value };
}

/** Content-swap blur bounds (motion-review D2 a): ≤ 0.1 s, radius ≤ 8 px. */
const SWAP_MAX_S = 0.1, SWAP_MAX_PX = 8;

/**
 * Content swap inside a morphing container: the outgoing text exits up during the first
 * half, the incoming enters from below during the second half — each with its own timing,
 * so they never overlap — under a short blur that peaks at the swap. Only for content
 * swapping inside a container that is itself morphing; never on a headline reveal.
 *
 * @param {HTMLElement} outEl @param {HTMLElement} inEl
 * @param {number} t @param {number} at - Swap start (s) @param {number} dur - ≤ 0.1 s
 * @param {number} radius - Peak blur, ≤ 8 px @param {number} dist - Travel (px)
 */
function swapBlur(outEl, inEl, t, at, dur, radius, dist = 24) {
	if (dur > SWAP_MAX_S + 1e-9 || radius > SWAP_MAX_PX) throw new Error(`swapBlur ${dur}s/${radius}px > ${SWAP_MAX_S}s/${SWAP_MAX_PX}px`);
	const p = prog(t, at, at + dur);
	const b = p > 0 && p < 1 ? radius * (1 - Math.abs(2 * p - 1)) : 0;
	const pOut = expoOut(clamp01(p * 2)), pIn = expoOut(clamp01(p * 2 - 1));
	outEl.style.visibility = p < 0.5 ? "visible" : "hidden";
	inEl.style.visibility = p >= 0.5 ? "visible" : "hidden";
	outEl.style.transform = `translateY(${(-dist * pOut).toFixed(2)}px)`;
	inEl.style.transform = `translateY(${(dist * (1 - pIn)).toFixed(2)}px)`;
	const f = b > 0 ? `blur(${b.toFixed(2)}px)` : "none";
	outEl.style.filter = f;
	inEl.style.filter = f;
}

/**
 * Loop seam check at load: each channel (a pure function of t) must match at 0 and at
 * DURATION in position AND velocity, or the loop stutters.
 *
 * @param {Record<string,(t:number)=>number>} channels @param {number} duration @param {number} fps
 * @param {number} [eps] - Position tolerance (px or units)
 */
function checkLoop(channels, duration, fps, eps = 0.5) {
	const dt = 1 / fps;
	for (const [name, f] of Object.entries(channels)) {
		const p0 = f(0), p1 = f(duration);
		const v0 = (f(dt) - f(0)) / dt, v1 = (f(duration) - f(duration - dt)) / dt;
		if (Math.abs(p0 - p1) > eps) throw new Error(`loop: ${name} ${p0.toFixed(2)} at 0 vs ${p1.toFixed(2)} at the end`);
		if (Math.abs(v0 - v1) > eps * fps) throw new Error(`loop: ${name} speed ${v0.toFixed(1)} vs ${v1.toFixed(1)} per s`);
	}
}
```

## Usage inside `seek(t)` (timeline.js)

```javascript
// Tab indicator: one object, retargeted on three beats; the edges stretch on each move.
const tab = dualEdge(time, 72, 220, [{ at: 1.0, to: 330 }, { at: 1.5, to: 588 }, { at: 2.0, to: 72 }]);
$("indicator").style.transform = `translateX(${tab.left.toFixed(2)}px)`;
$("indicator").style.width = `${(tab.right - tab.left).toFixed(2)}px`;
// Slider dragged past its max by a drawn cursor, then released.
const drag = cursorDrag(time, { start: { x: 900, y: 1500 }, grab: { x: 400, y: 900 }, to: { x: 1000, y: 900 },
	arrive: 0.5, down: 2.5, up: 3.0, min: 100, max: 800 });
$("cursor").style.transform = `translate(${drag.cursor.x.toFixed(2)}px, ${drag.cursor.y.toFixed(2)}px) scale(${drag.pressed ? 0.9 : 1})`;
$("knob").style.transform = `translateX(${drag.value.toFixed(2)}px)`;
// Label swap inside the morphing container, on the beat.
swapBlur($("label-a"), $("label-b"), time, 3.5, 0.1, 6);
```

Call `checkLoop({ cursorX: (t) => cursorDrag(t, D).cursor.x, … }, DURATION, FPS)` once at
load for a looping film. The cursor is the real OS pointer asset (`motion-assets`
real-screenshots), never an invented one.

## Adapting

| Change | How |
|--------|-----|
| Vertical indicator | Feed `dualEdge` top-edge targets; set `translateY` + `height` |
| Knob of a toggle | Same `dualEdge` on a short track: the knob stretches toward the side it flips to |
| A click without a drag | `down` and `up` one frame apart at the beat; `pressed` scales the cursor to 0.9 |
| No blur wanted | Keep the separate exit/enter timing and pass `radius = 0` |
| A blur longer or wider | Not allowed: the bounds are the owner's (`motion-craft` anti-slop-video.md) |
