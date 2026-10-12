import type { Span } from "./types";

const NAMES = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"] as const;
/** The xterm cube's channel levels. */
const LEVELS = [0, 95, 135, 175, 215, 255] as const;

const hex = (r: number, g: number, b: number): string =>
	`#${[r, g, b].map((c) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, "0")).join("")}`;

/** The color of xterm-256 index `n`: the 16 named, the 6x6x6 cube, then 24 greys. */
function xterm(n: number): string {
	if (n < 8) return NAMES[n] ?? "white";
	if (n < 16) return `${NAMES[n - 8] ?? "white"}Bright`;
	if (n < 232) {
		const i = n - 16;
		const at = (k: number): number => LEVELS[k % 6] ?? 0;
		return hex(at(Math.floor(i / 36)), at(Math.floor(i / 6)), at(i));
	}
	const g = 8 + (n - 232) * 10;
	return hex(g, g, g);
}

type Style = { color?: string; bold?: boolean; dim?: boolean };

/** Applies one SGR parameter list to a style; a `38` / `48` consumes its own operands. */
function apply(style: Style, codes: number[]): Style {
	let next = style;
	for (let i = 0; i < codes.length; i++) {
		const c = codes[i] ?? 0;
		if (c === 0) next = {};
		else if (c === 1) next = { ...next, bold: true };
		else if (c === 2) next = { ...next, dim: true };
		else if (c === 22) next = { ...next, bold: false, dim: false };
		else if (c >= 30 && c <= 37) next = { ...next, color: NAMES[c - 30] };
		else if (c >= 90 && c <= 97) next = { ...next, color: `${NAMES[c - 90]}Bright` };
		else if (c === 39) next = { ...next, color: undefined };
		else if (c === 38 || c === 48) {
			const mode = codes[i + 1];
			const used = mode === 5 ? 2 : mode === 2 ? 4 : 0;
			if (c === 38 && mode === 5) next = { ...next, color: xterm(codes[i + 2] ?? 0) };
			if (c === 38 && mode === 2) {
				next = { ...next, color: hex(codes[i + 2] ?? 0, codes[i + 3] ?? 0, codes[i + 4] ?? 0) };
			}
			i += used;
		}
	}
	return next;
}

/**
 * Decodes an ANSI-colored line into styled spans: foreground colors (named, 256, truecolor),
 * bold and dim. Backgrounds are read past and dropped; OSC escapes (the directory's file
 * link) are removed, other escapes are ignored.
 *
 * @param raw - Text with SGR escapes, as the old statusline prints it
 * @returns One span per run of identical style
 */
export function decode(raw: string): Span[] {
	const line = raw.replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "");
	const spans: Span[] = [];
	let style: Style = {};
	let last = 0;
	const push = (text: string): void => {
		if (text) spans.push({ text, color: style.color, bold: style.bold, dim: style.dim });
	};
	for (const m of line.matchAll(/\x1b\[([\d;]*)m/g)) {
		push(line.slice(last, m.index));
		const codes = m[1] === "" ? [0] : (m[1] ?? "").split(";").map(Number);
		style = apply(style, codes);
		last = (m.index ?? 0) + m[0].length;
	}
	push(line.slice(last));
	return spans;
}
