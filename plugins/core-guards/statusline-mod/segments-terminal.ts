import { clockOnlySpans, expirySpans } from "./cache-expiry";
import { hitColor } from "./cards-cache";
import { cells } from "./format";
import type { Facts } from "./interfaces/card.interface";
import type { TermSegment } from "./interfaces/terminal.interface";
import { CACHE_LABEL, formatTokens } from "./labels";
import { decode } from "./sgr";
import type { Span } from "./types";

/** Where the cache segment sits among the engine's: after the effort (31), before the bars. */
const CACHE_PRIORITY = 35;

/** Cells of a run of spans. */
export const widthOf = (spans: Span[]): number => spans.reduce((n, s) => n + cells(s.text), 0);

/**
 * The cache segment in the old statusline's look: a gray label, the hit ratio green, amber or
 * red, the tokens read and written in gray, then the time before the cache lapses.
 * Shorter as the level rises.
 *
 * @param f - Everything the cards draw from
 * @param level - 0 (tokens), 1 (ratio only), 2 and up (`⚡99%`)
 * @returns The spans, or `[]` until a turn has reported its cache figures
 */
export function cacheSpans(f: Facts, level: number): Span[] {
	const c = f.cache;
	if (!c)
		return f.cacheLeft
			? clockOnlySpans(f.cacheLeft, level, { text: CACHE_LABEL, color: "gray" })
			: [];
	const pct: Span = { text: `${Math.round(c.ratio * 100)}%`, color: hitColor(c.ratio) };
	const expiry = expirySpans(c.leftMs, level, c.estimated);
	if (level >= 2) return [{ text: "⚡", color: pct.color }, pct, ...expiry];
	const spans: Span[] = [{ text: `${CACHE_LABEL} `, color: "gray" }, pct];
	if (level === 0) {
		const [r, w] = [formatTokens(c.read, false), formatTokens(c.written, false)];
		spans.push({ text: ` · R ${r} · W ${w}`, color: "gray" });
	}
	return [...spans, ...expiry];
}

/**
 * Every segment the terminal can draw, in the engine's order: the engine's own (decoded from
 * their ANSI) and the mod's cache segment.
 *
 * @param f - Everything the cards draw from
 * @param level - The cache segment's abbreviation level
 * @returns The segments sorted by priority; `[]` when the engine reported none
 */
export function termSegments(f: Facts, level: number): TermSegment[] {
	const look = f.engine.terminal;
	if (!look) return [];
	const own = look.segments.map((s): TermSegment => {
		const spans = decode(s.ansi);
		return { id: s.name, priority: s.priority, line: s.line, spans, width: widthOf(spans) };
	});
	const cache = cacheSpans(f, level);
	if (cache.length > 0) {
		const line = own.filter((s) => s.priority < CACHE_PRIORITY).at(-1)?.line ?? 1;
		own.push({ id: "cache", priority: CACHE_PRIORITY, line, spans: cache, width: widthOf(cache) });
	}
	return own.sort((a, b) => a.priority - b.priority);
}
