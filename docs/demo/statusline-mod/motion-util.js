/**
 * Shared helpers for the statusline-mod demo: clamped progress, the two easing curves
 * the whole film uses (no bounce anywhere), and span-to-markup rendering.
 * Classic script: everything lands on `globalThis.MU`.
 */
(() => {
	/** Clamp `x` to [0, 1]. */
	const clamp01 = (x) => Math.min(1, Math.max(0, x));

	/** Progress of `t` through the window [a, b], clamped. */
	const prog = (t, a, b) => clamp01((t - a) / (b - a));

	/** Exponential ease-out, the entrance curve (≈ cubic-bezier(0.16, 1, 0.3, 1)). */
	const easeOut = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x));

	/** Symmetric ease-in-out, for on-screen morphs (window resize, value climbs). */
	const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

	/** Linear interpolation. */
	const lerp = (a, b, p) => a + (b - a) * p;

	/** Escape text for markup. */
	const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

	/** Force text (not emoji) presentation of the stopwatch, as both surfaces draw it. */
	const textGlyphs = (s) => s.replace(/⏱(?!︎)/g, "⏱︎");

	/**
	 * One span as markup: its color, bold when asked, dim as reduced opacity.
	 *
	 * @param {{text: string, color?: string, bold?: boolean, dim?: boolean}} s - The span
	 * @param {(c: string|undefined) => string} [map] - Maps a named color to a hex value
	 * @returns {string} The markup
	 */
	const span = (s, map = (c) => c) => {
		const style = [`color:${map(s.color) ?? "inherit"}`];
		if (s.bold) style.push("font-weight:600");
		if (s.dim) style.push("opacity:.6");
		return `<span style="${style.join(";")}">${esc(textGlyphs(s.text))}</span>`;
	};

	/** Opacity + translate entrance at progress `p` (0 hidden, 1 settled), as inline style. */
	const enter = (p, dx = 0, dy = 8) => {
		const e = easeOut(p);
		return `opacity:${e.toFixed(3)};transform:translate(${(dx * (1 - e)).toFixed(2)}px,${(dy * (1 - e)).toFixed(2)}px)`;
	};

	globalThis.MU = { clamp01, prog, easeOut, easeInOut, lerp, esc, textGlyphs, span, enter };
})();
