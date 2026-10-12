/**
 * Terminal scene of the statusline-mod demo: Claude Code CLI with the mod in the old
 * statusline's look. Segments carry the old engine's colors (statusline/src/utils/colors.ts,
 * rendered values sampled from docs/img/statusline-mod-terminal.png); the cache segment
 * comes from the mod's own `cacheSpans`. Segments flow whole, like layout-terminal.ts.
 * Classic script: exposes `globalThis.TerminalScene.render(t)`.
 */
(() => {
	const { prog, easeInOut, lerp, span } = globalThis.MU;
	const SL = globalThis.SL;

	/** The terminal's rendering of the engine's named colors. */
	const PALETTE = {
		gray: "#767676",
		blue: "#5070e0",
		green: "#46a759",
		cyan: "#36a3bf",
		magenta: "#c45a9e",
		red: "#d0595b",
		yellow: "#dcc940",
		orange: "#e0892a",
		purple: "#9f6bd8",
		white: "#ffffff",
	};
	const TRACK = "#19311d";
	const map = (c) => (c && c.startsWith("#") ? c : (PALETTE[c] ?? PALETTE.white));
	const AT = { segs: 11.35, step: 0.12, resize: [14.1, 15.9], wide: 1240, narrow: 560 };
	const PAD = 18;

	const s = (text, color = "white", bold = false) => ({ text, color, bold });
	/** The engine's `filled` progress bar: one cell per glyph, fill green, track dark. */
	const bar = (pct, len = 4) => {
		const n = Math.round((pct / 100) * len);
		return { cells: Array.from({ length: len }, (_, i) => (i < n ? PALETTE.green : TRACK)) };
	};

	/** Line 1 then line 2, segment by segment, in the engine's priority order. */
	function segments() {
		const cache = SL.cacheSpans({ cache: { ratio: 0.36, read: 26_000, written: 46_000, leftMs: 59.5 * 60_000 } }, 0);
		const l1 = [
			[s("08.10.26 - 13:03", "gray")],
			[s("◆", "blue"), s(" 2.1.294")],
			[s("⬢", "green"), s(" 26.3.0")],
			[s("⌂", "cyan"), s(" "), s("~/../my-app", "white", true), s(" "), s("(", "gray"), s("main*", "magenta"), s(" "), s("~73", "red"), s(")", "gray")],
			[s("⚙", "purple"), s(" Opus 5.5 "), s("[70.0K/1M]", "yellow")],
			[s("◐", "orange"), s(" medium thinking")],
			cache,
			[s("7%", "green"), s(" "), s("▱▱▱▱", "green")],
		];
		const l2 = [
			[s("$0.38", "yellow")],
			[s("5h:", "cyan"), s(" "), s("22%", "green"), s(" "), bar(22), s(" "), s("(56m)", "gray"), s(" "), s("7d:", "blue"), s(" "), s("6%", "green"), s(" "), bar(6), s(" "), s("(6d - 14h)", "gray")],
			[s("$ D:", "orange"), s(" "), s("$184.20", "yellow")],
		];
		return { l1, l2 };
	}

	const cellsOf = (parts) => parts.reduce((n, p) => n + (p.cells ? p.cells.length : [...p.text].length), 0);

	/** One part as markup: every non-ASCII glyph pinned to one cell, bars as solid cells. */
	function part(p) {
		if (p.cells) return p.cells.map((c) => `<i class="cell" style="background:${c}"></i>`).join("");
		return [...p.text]
			.map((ch) => (ch.charCodeAt(0) > 126 ? `<b class="g">${span({ ...p, text: ch }, map)}</b>` : span({ ...p, text: ch }, map)))
			.join("");
	}

	/** Flow one line's segments into rows of `cols` cells; a segment is never split. */
	function wrap(segs, cols, gap) {
		const rows = [];
		let row = [];
		let used = 0;
		for (const seg of segs) {
			const w = cellsOf(seg.parts);
			if (row.length > 0 && used + gap + w > cols) {
				rows.push(row);
				row = [];
				used = 0;
			}
			used += (row.length > 0 ? gap : 0) + w;
			row.push(seg);
		}
		if (row.length > 0) rows.push(row);
		return rows;
	}

	let measured = 0;
	/**
	 * Advance of one cell in `el`'s font. Uses the same CSS `1ch` the rows paint
	 * (`.cell` / `.g`), not canvas `"0"`, so `cols` and flex min-content agree.
	 */
	function cellWidth(el) {
		if (!measured) {
			const probe = document.createElement("i");
			probe.className = "cell";
			probe.style.visibility = "hidden";
			el.appendChild(probe);
			measured = probe.getBoundingClientRect().width || 7.8;
			probe.remove();
		}
		return measured;
	}

	/**
	 * Markup for the status rows at a column budget. `cols` must come from the
	 * same eased width written on `#term` (or from that box after layout).
	 *
	 * @param {{parts: object[], k: number}[][]} lines - Tagged segment lines
	 * @param {number} cols - Cells that fit in the painted content box
	 * @param {number} t - Seconds into the film
	 * @returns {string} Inner HTML for `#sl`
	 */
	function rowsHtml(lines, cols, t) {
		const sep = `<span style="color:${PALETTE.gray}"> · </span>`;
		return lines
			.flatMap((segs) => wrap(segs, cols, 3))
			.map((row) =>
				`<div class="row">${row
					.map((seg, i) => {
						const o = easeInOut(prog(t, AT.segs + seg.k * AT.step, AT.segs + seg.k * AT.step + 0.22));
						return `<span class="seg" style="opacity:${o.toFixed(3)}">${i > 0 ? sep : ""}${seg.parts.map(part).join("")}</span>`;
					})
					.join("")}</div>`,
			)
			.join("");
	}

	/**
	 * Draws the terminal at time `t`: window width, status rows, the cols readout.
	 *
	 * @param {number} t - Seconds into the film
	 */
	function render(t) {
		const win = document.getElementById("term");
		const out = document.getElementById("sl");
		if (!win || !out) return;
		const width = Number(lerp(AT.wide, AT.narrow, easeInOut(prog(t, ...AT.resize))).toFixed(2));
		win.style.width = `${width}px`;
		const cell = cellWidth(out);
		const { l1, l2 } = segments();
		let k = 0;
		const tag = (parts) => ({ parts, k: k++ });
		const lines = [l1.map(tag), l2.map(tag)];
		out.innerHTML = rowsHtml(lines, 1e9, t);
		const box = out.clientWidth;
		const cols = Math.max(1, Math.floor((width - 2 * PAD) / cell));
		const overflow = [...out.children].some((row) => row.scrollWidth > box);
		if (overflow) out.innerHTML = rowsHtml(lines, cols, t);
		const readout = document.getElementById("cols");
		if (readout) readout.textContent = `${cols} cols`;
	}

	globalThis.TerminalScene = { render };
})();
