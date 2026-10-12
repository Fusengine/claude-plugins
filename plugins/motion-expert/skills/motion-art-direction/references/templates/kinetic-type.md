---
name: kinetic-type
description: Complete kinetic-type helpers, the THIRD block of the scene step (.motion/scene/kinetic.js) — type at letter and word level — splitLetters + letterStagger (per-letter/per-word hard-edged mask rise), slam (full size on a cut, pushed out by the next word), scaleJump (3–4× → set size on the heavy spring), splitWord (halves slide apart along a plane boundary), plus mask reveal, push/replace, weight/size swap, keyword accent switch; safeBezier throws past 3 % overshoot; a frame-0 guard; no opacity anywhere; pure functions of t
keywords: kinetic type, letter stagger, word stagger, splitLetters, slam, scale jump, split, plane boundary, mask reveal, clip-path, push, replace, weight swap, size swap, accent switch, overshoot guard, frame 0, no fade, seek, kinetic.js, deterministic
---

# Kinetic Type Template

Third block of the scene step: **rhythm.js → grid.js → kinetic.js → timeline.js**, each a
classic script loaded after `motion-render`'s `lib.js`. Pure functions of `t`: they use
`FPS` and `onFrame` from [cut-rhythm.md](cut-rhythm.md), and `prog`, `lerp`, `clamp01`,
`bezier`, `stagger`, `springHeavy` and `$` from `lib.js` (timeline-seek.md). Every style is
set on every `seek(t)` call from `t` alone, so frames can be shot in any order.

| Behaviour | Function | Rule enforced |
|-----------|----------|---------------|
| Letter / word stagger | `splitLetters` + `letterStagger` | Hard-edged mask per letter, `gap` 20–60 ms per letter (80–120 ms per word); hidden until its turn |
| Slam | `slam` | Full size on the cut (2-frame arrival from 1.08×), pushed out by the next word on the film in-out |
| Scale jump | `scaleJump` | 3–4× → set size on `springHeavy` (ζ 0.87, peak +0.42 %), from the baseline-left corner |
| Split along a plane | `splitWord` | Two copies clipped at the plane boundary, halves slide apart on one curve |
| Mask reveal, hard edge | `maskReveal` | `clip-path: inset()`, a straight 0 px edge; never at frame 0 |
| Push / replace | `pushReplace` | Both words move together, same curve, one line height |
| Weight / size swap | `swap` | Step on a frame boundary, or ≤ 4 frames |
| Keyword accent switch | `accentSwitch` | One element, step on the beat |
| Overshoot guard | `safeBezier` | Samples the curve at load; throws past [−0.03, 1.03] (≤ 3 %, critic D9) |

Rotate them: never the same behaviour on two consecutive beats (`validateDensity` checks
the plan). No helper writes `opacity`. Frame 0 shows the opening statement at full value;
a reveal starting at t = 0 throws (critic F1).

**Tested** 2026-10-11, Chrome 154 via the capture's CDP path, with `lib.js` + `rhythm.js`:
`node --check` passes; stagger, slam, scale jump and split shot at 5 times, twice →
identical sha256; frames show letters rising behind the mask, the slam pushed out at
+0.25 s, the scale jump landing from 3.5×, the halves apart. `safeBezier(.3,1.6,.3,1)`
throws (reaches 1.036); `safeBezier(.34,1.08,.64,1)` passes (peak ≤ 1.03).

---

## Markup (inside the composition-grid world)

```html
<style>
	/* The kill-switch stays: no CSS animation/transition anywhere. */
	.line { display: block; overflow: hidden; line-height: 1; }   /* push/replace box */
	.word { display: inline-block; white-space: nowrap; }
	.object { font-family: var(--display); font-size: 400px; font-weight: 800; letter-spacing: -0.03em; }
	.display { font-size: 200px; font-weight: 800; letter-spacing: -0.03em; }
	.label { font-size: 52px; font-weight: 400; }
</style>
<!-- hook-1: word-object bleeding left, label on col 1; both visible at t = 0. -->
<section id="s-hook-1" class="scene" style="left:0; top:0">
	<span id="w-still" class="word object" style="position:absolute; left:-60px; top:960px">still</span>
	<span id="w-label" class="word label" style="position:absolute; left:72px; top:1340px">your deploys</span>
</section>
<!-- hook-2: "broke" slams on the cut; "split" halves on the plane at row 8 -->
<section id="s-hook-2" class="scene" style="left:0; top:0">
	<span id="w-broke" class="word display" style="position:absolute; left:72px; top:640px">broke</span>
	<span id="w-split-a" class="word object" style="position:absolute; left:72px; top:1180px">split</span>
	<span id="w-split-b" class="word object" style="position:absolute; left:72px; top:1180px">split</span>
</section>
<!-- pain-1: "again" scale-jumps on the cut -->
<section id="s-pain-1" class="scene" style="left:0; top:0">
	<span id="w-again" class="word display" style="position:absolute; left:72px; top:860px">again</span>
</section>
<!-- pain: push/replace, two words share one line box of exactly one line height -->
<div class="line display" style="position:absolute; left:72px; top:600px; height:200px">
	<span id="w-a" class="word" style="position:absolute; left:0; top:0">slow</span>
	<span id="w-b" class="word" style="position:absolute; left:0; top:0">fixed</span>
</div>
```

---

## File: `.motion/scene/kinetic.js`

```javascript
/**
 * Kinetic type — pure functions of t (fuse-motion art direction). Classic script loaded
 * after lib.js and rhythm.js (uses FPS, onFrame, prog, lerp, clamp01, bezier, springHeavy).
 * No helper writes `opacity`: words appear by a cut, a mask, a push, a slam, a scale jump
 * or a split.
 */

/**
 * bezier() with an overshoot guard: the curve may pass its target by at most 3 % (owner
 * bound, critic D9). Samples the curve at load and throws past [-0.03, 1.03].
 *
 * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
 * @returns {(x: number) => number} eased progress
 */
function safeBezier(x1, y1, x2, y2) {
	const f = bezier(x1, y1, x2, y2);
	for (let i = 0; i <= 200; i++) {
		const y = f(i / 200);
		if (y > 1.03 || y < -0.03) throw new Error(`bezier(${x1},${y1},${x2},${y2}) reaches ${y.toFixed(3)}: overshoot > 3 %`);
	}
	return f;
}
/** Snappy expo-out arrivals and the film in-out for pushes (guarded). */
const enter = safeBezier(0.16, 1, 0.3, 1);
const push = safeBezier(0.6, 0, 0.2, 1);

/** Frame-0 guard: no reveal may start on frame 0 (it already shows the statement, F1). */
function notOnFrame0(what, at) {
	if (onFrame(at) < 1 / FPS) throw new Error(`${what} starts at frame 0 — frame 0 must already show the statement`);
}

/**
 * Splits an element's text into one inline-block span per letter, once at load (pure DOM
 * setup, before any seek). Spaces become fixed-width gaps.
 *
 * @param {HTMLElement} el @returns {HTMLElement[]} the letter spans
 */
function splitLetters(el) {
	const text = el.textContent;
	el.textContent = "";
	return [...text].map((ch) => {
		const s = document.createElement("span");
		s.className = "ch";
		s.style.display = "inline-block";
		s.textContent = ch === " " ? " " : ch;
		el.appendChild(s);
		return s;
	});
}

/**
 * Letter (or word) stagger: each item rises through a hard-edged mask, `gap` seconds
 * after the previous one. Fully masked → hidden (nothing half-drawn before its turn).
 *
 * @param {HTMLElement[]} items @param {number} t @param {number} at - First start (s, ≥ 1 frame)
 * @param {number} gap - 0.02–0.06 per letter, 0.08–0.12 per word @param {number} dur - Per item (s)
 */
function letterStagger(items, t, at, gap = 0.03, dur = 0.2) {
	stagger(t, onFrame(at), items.length, gap, dur, enter).forEach((p, i) => {
		const el = items[i];
		el.style.clipPath = `inset(${(100 * (1 - p)).toFixed(3)}% 0 0 0)`;
		el.style.transform = `translateY(${(40 * (1 - p)).toFixed(2)}px)`;
		el.style.visibility = p <= 0 ? "hidden" : "visible";
	});
}

/**
 * Slam: the word is on screen at full size from the cut `at` (a 2-frame arrival from
 * 8 % larger), then the next word pushes it out from `outAt` by `dist` px.
 *
 * @param {HTMLElement} el @param {number} t @param {number} at @param {number} outAt @param {number} dist
 */
function slam(el, t, at, outAt, dist = 1080) {
	const a = onFrame(at);
	const s = lerp(1.08, 1, clamp01((t - a) / (2 / FPS)));
	const x = -dist * push(prog(t, onFrame(outAt), onFrame(outAt) + 0.25));
	el.style.transformOrigin = "0 100%";
	el.style.transform = `translateX(${x.toFixed(2)}px) scale(${s.toFixed(4)})`;
	el.style.visibility = t >= a && x > -dist ? "visible" : "hidden";
}

/**
 * Scale jump on a cut: lands at `from`× (3–4) and settles to set size on the heavy
 * spring (ζ 0.87, peak +0.42 %), from the baseline-left corner.
 *
 * @param {HTMLElement} el @param {number} t @param {number} at @param {number} from
 */
function scaleJump(el, t, at, from = 3.5) {
	const a = onFrame(at);
	el.style.transformOrigin = "0 100%";
	el.style.transform = `scale(${lerp(from, 1, springHeavy(t - a)).toFixed(4)})`;
	el.style.visibility = t >= a ? "visible" : "hidden";
}

/**
 * Split along a plane boundary: two stacked copies of the word, clipped above and below
 * `cut` (% of its height, = the ink/paper boundary), slide apart on one curve.
 *
 * @param {HTMLElement} top @param {HTMLElement} bottom - Same word, same position
 * @param {number} t @param {number} at @param {number} cut - 0–100 @param {number} gap - px each way
 */
function splitWord(top, bottom, t, at, cut = 50, gap = 140) {
	const p = push(prog(t, onFrame(at), onFrame(at) + 0.5));
	top.style.clipPath = `inset(0 0 ${(100 - cut).toFixed(2)}% 0)`;
	bottom.style.clipPath = `inset(${cut.toFixed(2)}% 0 0 0)`;
	top.style.transform = `translateX(${(-gap * p).toFixed(2)}px)`;
	bottom.style.transform = `translateX(${(gap * p).toFixed(2)}px)`;
}

/**
 * Hard-edge mask reveal across a word, in reading direction.
 *
 * @param {HTMLElement} el @param {number} t @param {number} at @param {number} dur
 * @param {"ltr"|"btt"} dir
 */
function maskReveal(el, t, at, dur, dir = "ltr") {
	const p = enter(prog(t, onFrame(at), onFrame(at) + dur));
	const hidden = (100 * (1 - p)).toFixed(3);
	el.style.clipPath = dir === "ltr" ? `inset(0 ${hidden}% 0 0)` : `inset(${hidden}% 0 0 0)`;
	el.style.visibility = p <= 0 ? "hidden" : "visible";
}

/**
 * Push / replace inside one `.line` box (overflow hidden): the outgoing word leaves by
 * one line height while the incoming one takes its place, same curve.
 */
function pushReplace(outEl, inEl, t, at, dur, dist) {
	const p = push(prog(t, onFrame(at), onFrame(at) + dur));
	outEl.style.transform = `translateY(${(-dist * p).toFixed(2)}px)`;
	inEl.style.transform = `translateY(${(dist * (1 - p)).toFixed(2)}px)`;
	outEl.style.visibility = p >= 1 ? "hidden" : "visible";
	inEl.style.visibility = p <= 0 ? "hidden" : "visible";
}

/** Weight / size swap on the beat: a step, or ≤ 4 frames (more is a morph). */
function swap(el, t, at, from, to, frames = 0) {
	if (frames > 4) throw new Error("swap longer than 4 frames is a morph");
	const a = onFrame(at);
	const p = frames === 0 ? (t >= a ? 1 : 0) : clamp01((t - a) / (frames / FPS));
	el.style.fontVariationSettings = `"wght" ${Math.round(lerp(from.wght, to.wght, p))}`;
	el.style.transformOrigin = "0 100%";
	el.style.transform = `scale(${lerp(from.scale, to.scale, p).toFixed(4)})`;
}

/** Keyword accent switch: one element flips to the accent at `at`, back at `until`. */
function accentSwitch(el, t, at, until = Infinity) {
	el.style.color = t >= onFrame(at) && t < onFrame(until) ? "var(--accent)" : "var(--fg)";
}
```

## Usage in `seek(t)` (timeline.js), times from the cut-rhythm example

```javascript
// At load (once): split the label into letters, guard every reveal against frame 0.
const LABEL = splitLetters($("w-label"));
notOnFrame0("letterStagger #w-label", 0.5);
// In seek(t):
showState($("s-hook-1"), time, "hook-1");            // t = 0: "still" + label at full value
letterStagger(LABEL, time, 0.5, 0.03, 0.2);          // 0.5 s: label letters rise
showState($("s-hook-2"), time, "hook-2");
slam($("w-broke"), time, 1.5, 2.0);                  // 1.5 s primary: "broke" slams, pushed out at 2.0 s
splitWord($("w-split-a"), $("w-split-b"), time, 2.0, 46, 140); // 2.0 s primary: halves part at the plane
showState($("s-pain-1"), time, "pain-1");
scaleJump($("w-again"), time, 2.5, 3.5);             // 2.5 s primary (pain-1): lands at 3.5× → set size
pushReplace($("w-a"), $("w-b"), time, 4.0, 0.5, 200); // 4.0 s primary (pain-2 "push")
accentSwitch($("w-b"), time, 4.5, 5.0);              // a step on the beat, inside pain-3
```

Letters of the first state must already be visible at frame 0 when they carry the
opening statement — stagger a later line, never the statement itself.

---

## Adapting

| Change | How |
|--------|-----|
| Word stagger instead of letters | Wrap words in `.word` spans and pass them to `letterStagger` with `gap` 0.08–0.12 |
| Static font (no `wght` axis) | Swap between 2 stacked spans of the 2 weights with `visibility`, step only |
| Split on a vertical plane | Clip with `inset(0 X% 0 0)` / `inset(0 0 0 Y%)` and slide the halves vertically |
| Canvas scene | Same progress functions; clip with `ctx.rect(...); ctx.clip()` for the hard mask |
| A curve from a reference | Pass it through `safeBezier` — it fails loudly past 3 % |
| "It needs a fade" | It does not: slam, stagger, mask, push, split or swap (bans.md B10–B11) |
| File near 200 lines | Move unused helpers out; the hook caps each scene file at 200 |
