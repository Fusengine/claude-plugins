import { clockOnlySpans, expirySpans } from "./cache-expiry";
import { makeCard, muted, strong, text } from "./card";
import type { Card, Facts, Span } from "./interfaces/card.interface";
import { CACHE_LABEL, formatTokens } from "./labels";
import { THEME } from "./theme";

/** Hit ratio from which the next turn is cheap (green), and from which it is mixed (amber). */
export const HIT_GOOD = 0.8;
/** See `HIT_GOOD`. */
export const HIT_MIXED = 0.5;

/**
 * The color of a hit ratio: green is mostly read from cache, red mostly rewritten.
 *
 * @param ratio - 0 to 1
 * @returns A hex color
 */
export function hitColor(ratio: number): string {
	if (ratio >= HIT_GOOD) return THEME.reset5;
	return ratio >= HIT_MIXED ? THEME.warn : THEME.bad;
}

/** `Hit 98%`, then `⚡98%` when the room runs out. */
function ratioSpans(ratio: number, level: number): Span[] {
	const pct = `${Math.round(ratio * 100)}%`;
	const color = hitColor(ratio);
	return level >= 2 ? [strong(`⚡${pct}`, color)] : [strong(`${CACHE_LABEL} `), strong(pct, color)];
}

/**
 * The cache card: the last turn's prompt-cache hit ratio and, with room, the tokens read
 * from and written to the cache (`R 370K · W 2K`) and the time before it lapses
 * (`⏱ 4m12s`, amber then red, `expiré` at 0) once a main turn has ended.
 *
 * @param f - Everything the cards draw from
 * @param level - Abbreviation level: the tokens go at 1, the word at 2
 * @returns The card (the countdown alone while only the transcript's clock is known), or
 *   `null` with neither
 */
export function cacheCard(f: Facts, level: number): Card | null {
	const c = f.cache;
	if (!c) {
		return f.cacheLeft
			? makeCard("cache", 40, level, [
					text(...clockOnlySpans(f.cacheLeft, level, strong(CACHE_LABEL))),
				])
			: null;
	}
	const spans = ratioSpans(c.ratio, level);
	if (level === 0) {
		spans.push(muted(` · R ${formatTokens(c.read, false)} · W ${formatTokens(c.written, false)}`));
	}
	spans.push(...expirySpans(c.leftMs, level, c.estimated));
	return makeCard("cache", 40, level, [text(...spans)]);
}
