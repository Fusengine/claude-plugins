/**
 * Master clock of the statusline-mod demo. `window.seek(t)` draws the exact frame at `t`
 * seconds (deterministic, no wall clock), which is what the frame-by-frame capture drives.
 * Opened by hand, the page plays itself in a loop; under prefers-reduced-motion it holds
 * one still frame of each surface instead.
 *
 * Shots (s): title 0-2.4 · Desktop 2.3-10.7 · CLI 10.5-17.9 (resize 14.1-15.9) · end 17.8-21.
 */
(() => {
	const { prog, easeOut, lerp } = globalThis.MU;
	const DURATION = 21;

	/** Fade + rise in over [a, a+0.5], fade + lift out over [b, b+0.5]; `null` hides. */
	function shot(t, a, b, rise = 14) {
		const i = easeOut(prog(t, a, a + 0.5));
		const o = easeOut(prog(t, b, b + 0.5));
		const opacity = Math.min(i, 1 - o);
		const y = lerp(rise, 0, i) - lerp(0, rise * 0.8, o);
		const scale = lerp(0.985, 1, i) - 0.015 * o;
		return { opacity, transform: `translateY(${y.toFixed(2)}px) scale(${scale.toFixed(4)})` };
	}

	/** Applies a shot to the element with `id`, hidden entirely when transparent. */
	function place(id, st) {
		const el = document.getElementById(id);
		if (!el) return;
		el.style.opacity = st.opacity.toFixed(3);
		el.style.transform = st.transform;
		el.style.visibility = st.opacity <= 0.001 ? "hidden" : "visible";
	}

	/**
	 * Draws frame `t`.
	 *
	 * @param {number} t - Seconds, wrapped into [0, DURATION)
	 */
	function seek(t) {
		const time = ((t % DURATION) + DURATION) % DURATION;
		place("title", shot(time, 0.15, 1.9, 10));
		place("deskshot", shot(time, 2.3, 10.2));
		place("termshot", shot(time, 10.6, 17.3));
		place("end", shot(time, 17.9, 20.4, 10));
		globalThis.DesktopScene.render(time);
		globalThis.TerminalScene.render(time);
	}

	window.seek = seek;
	window.DURATION = DURATION;
	window.FPS = 30;

	/** Self-play when opened by hand; `?t=4.5` holds one frame; `?capture` is driven by `seek`. */
	function autoplay() {
		const q = new URLSearchParams(location.search);
		if (q.has("t")) return seek(Number(q.get("t")));
		if (q.has("capture")) return seek(0);
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
			const stills = [5, 13.6];
			let i = 0;
			seek(stills[0]);
			setInterval(() => seek(stills[++i % stills.length]), 4000);
			return;
		}
		const start = performance.now();
		const tick = (now) => {
			seek((now - start) / 1000);
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	}

	document.fonts.ready.then(autoplay);
})();
