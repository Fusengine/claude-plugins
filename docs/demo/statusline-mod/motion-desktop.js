/**
 * Desktop scene of the statusline-mod demo: the four navy cards of the Claude Desktop
 * band, built span for span like the mod's cards-*.ts at the reference's level (pill of
 * 22 cells, limits bar of 8), every bar drawn by the mod's own `svgSource`.
 * Classic script: exposes `globalThis.DesktopScene.render(t)`.
 */
(() => {
	const { prog, easeInOut, lerp, span, enter } = globalThis.MU;
	const SL = globalThis.SL;
	const T = SL.THEME;
	const MIN = 60_000;
	const HOUR = 60 * MIN;
	const DAY = 24 * HOUR;

	/** Scene clock: cards land, bars grow, then the session advances. */
	const AT = { cards: 3.0, stagger: 0.14, grow: [3.55, 4.3], advance: [5.0, 8.9] };

	const strong = (text, color = T.text) => ({ text, color, bold: true });
	const muted = (text) => ({ text, color: T.muted });
	const plain = (text, color = T.text) => ({ text, color });
	const txt = (...spans) => ({ kind: "text", spans });

	/**
	 * The session's figures at time `t`: the reference snapshot (13:07, 92.9K/1M, cache
	 * 49%, 5h 24%, 7d 6%) while the cards land, then a short time-lapse of the session.
	 */
	function factsAt(t) {
		const p = easeInOut(prog(t, ...AT.advance));
		const minutes = Math.round(p * 4);
		const g = easeInOut(prog(t, ...AT.grow));
		return {
			clock: `08.10.26 - 13:${String(7 + minutes).padStart(2, "0")}`,
			tokens: Math.round(lerp(92_900, 418_200, p) / 100) * 100,
			ratio: lerp(0.49, 0.96, p),
			read: lerp(45_000, 371_000, p),
			written: lerp(47_000, 52_000, p),
			leftMs: 59.5 * MIN - minutes * MIN,
			five: lerp(24, 37, p) * g,
			seven: lerp(6, 7, p) * g,
			fiveLeft: 52.5 * MIN - minutes * MIN,
			sevenLeft: 6 * DAY + 14.5 * HOUR - minutes * MIN,
			daily: lerp(184.2, 185.65, p),
			cost: lerp(0.39, 1.84, p),
		};
	}

	/** The four cards' items, in the mod's order and colors. */
	function cards(f) {
		const pct = (f.tokens / 1_000_000) * 100;
		const tokens = `${SL.formatTokens(f.tokens, true)}/${SL.formatTokens(1_000_000, true)}`;
		const env = [txt(strong(f.clock)), txt(strong("~/../claude-plugins")), txt(strong("main*"), strong(" ~22"))];
		const cache = [
			txt(
				strong("Cache "),
				strong(`${Math.round(f.ratio * 100)}%`, SL.hitColor(f.ratio)),
				muted(` · R ${SL.formatTokens(f.read, false)} · W ${SL.formatTokens(f.written, false)}`),
				muted(" · "),
				plain(`⏱ ${SL.expiryText(f.leftMs)}`, SL.expiryColor(f.leftMs)),
			),
		];
		const pill = {
			kind: "bar",
			width: 22,
			label: `context ${Math.round(pct)}%`,
			rows: [{ ratio: pct / 100, fill: SL.contextColor(Math.round(pct)) }],
			overlay: tokens,
		};
		const model = [txt(strong(SL.modelLabel("claude-opus-5-5")), strong(" Medium")), pill];
		const limits = [
			txt(strong(`5h: ${Math.round(f.five)}%`), strong(" - "), plain(SL.formatLeft(f.fiveLeft), T.reset5)),
			txt(strong(`7d: ${Math.round(f.seven)}%`), strong(" "), plain(SL.formatLeft(f.sevenLeft), T.reset7)),
			{
				kind: "bar",
				width: 8,
				label: "usage",
				rows: [
					{ ratio: f.five / 100, fill: T.fiveFill },
					{ ratio: f.seven / 100, fill: T.sevenFill },
				],
			},
			txt(plain(`D: ${SL.money(f.daily, 2)}`), muted(" | "), plain(SL.money(f.cost, 2))),
		];
		return [env, cache, model, limits];
	}

	/** One item: spans, or the mod's own SVG for a bar. */
	const item = (it) =>
		it.kind === "bar"
			? `<span class="sl-bar">${SL.svgSource(it)}</span>`
			: `<span class="sl-text">${it.spans.map((s) => span(s)).join("")}</span>`;

	/**
	 * Draws the band at time `t` into `#band`.
	 *
	 * @param {number} t - Seconds into the film
	 */
	function render(t) {
		const band = document.getElementById("band");
		if (!band) return;
		band.innerHTML = cards(factsAt(t))
			.map((items, i) => {
				const p = prog(t, AT.cards + i * AT.stagger, AT.cards + i * AT.stagger + 0.42);
				return `<div class="sl-card" style="${enter(p, 0, 8)}">${items.map(item).join("")}</div>`;
			})
			.join("");
	}

	globalThis.DesktopScene = { render };
})();
