import type { TtlEnv } from "./interfaces/cache.interface";
import { THEME } from "./theme";
import type { CacheClock, CacheLeft, Span } from "./types";

const MIN = 60_000;
/** Time left from which the countdown reads amber, then red. */
const AMBER_MS = 2 * MIN;
const RED_MS = 30_000;

/** Prompt-cache TTLs Claude Code requests. */
export const TTL_MS = { "5m": 5 * MIN, "1h": 60 * MIN } as const;

/**
 * The main conversation's cache TTL, in Claude Code's own order of precedence
 * (code.claude.com/docs/en/prompt-caching): `FORCE_PROMPT_CACHING_5M`, then
 * `CLAUDE_CODE_PROMPT_CACHE_TTL`, then (unreadable by a mod) the `promptCacheTtl` setting,
 * then `ENABLE_PROMPT_CACHING_1H`, then the default: one hour on a subscription within its
 * plan usage, five minutes on an API key or once usage credits are being spent.
 *
 * @param env - The variables above
 * @param subscription - Whether the account has rate-limit windows (a subscription)
 * @param creditsSpent - Whether usage credits are being spent (the plan's usage is over)
 * @returns The TTL in milliseconds
 */
export function cacheTtlMs(env: TtlEnv, subscription: boolean, creditsSpent: boolean): number {
	if (env.force5m === "1") return TTL_MS["5m"];
	if (env.ttl === "5m" || env.ttl === "1h") return TTL_MS[env.ttl];
	if (env.enable1h === "1") return TTL_MS["1h"];
	return subscription && !creditsSpent ? TTL_MS["1h"] : TTL_MS["5m"];
}

/**
 * Time left until the cache lapses.
 *
 * @param turnEnd - `$.clock.now()` when the last main turn ended
 * @param now - `$.clock.now()`
 * @param ttl - From `cacheTtlMs`
 * @returns Milliseconds, 0 once lapsed
 */
export const cacheLeftMs = (turnEnd: number, now: number, ttl: number): number =>
	Math.max(0, turnEnd + ttl - now);

/**
 * The countdown as text: `4m12s` under ten minutes, `58m` above, `45s` under one, `expiré` at 0.
 *
 * A `~` leads an estimate (no transcript clock), never a real reading.
 *
 * @param leftMs - From `cacheLeftMs`
 * @param estimated - Whether the time is an estimate
 * @returns The text
 */
export function expiryText(leftMs: number, estimated = false): string {
	const tilde = estimated ? "~" : "";
	if (leftMs <= 0) return `${tilde}expiré`;
	const s = Math.ceil(leftMs / 1000);
	const m = Math.floor(s / 60);
	if (m >= 10) return `${tilde}${m}m`;
	return m > 0 ? `${tilde}${m}m${(s % 60).toString().padStart(2, "0")}s` : `${tilde}${s}s`;
}

/**
 * When the cache lapses: from the transcript's clock (the last main request plus the TTL it
 * wrote with) when both are known, else estimated from the last main turn's end and the TTL
 * `cacheTtlMs` infers.
 *
 * @param clock - The transcript's clock, if the emitter read it
 * @param turnEnd - `$.clock.now()` when the last main turn ended
 * @param now - `$.clock.now()`
 * @param estimateTtl - The inferred TTL in milliseconds
 * @returns The time left and whether it is an estimate; `null` with neither source
 */
export function cacheRemaining(
	clock: CacheClock | null,
	turnEnd: number | null,
	now: number,
	estimateTtl: number,
): { leftMs: number; estimated: boolean } | null {
	if (clock?.ttl) {
		return { leftMs: cacheLeftMs(clock.lastRequestAt, now, TTL_MS[clock.ttl]), estimated: false };
	}
	return turnEnd === null
		? null
		: { leftMs: cacheLeftMs(turnEnd, now, estimateTtl), estimated: true };
}

/**
 * The countdown as spans: ` · ⏱ 4m12s` with room, ` 4m12s` when the cache text is compact.
 *
 * @param leftMs - From `cacheLeftMs`; absent before a main turn has ended
 * @param level - The cache text's abbreviation level
 * @param estimated - Whether the time is an estimate (drawn with a `~`)
 * @returns The spans, or `[]` without a countdown
 */
export function expirySpans(leftMs: number | undefined, level: number, estimated = false): Span[] {
	if (leftMs === undefined) return [];
	const color = expiryColor(leftMs);
	const text = expiryText(leftMs, estimated);
	return level >= 2
		? [{ text: ` ${text}`, color }]
		: [{ text: " · ", color: THEME.muted }, { text: `⏱ ${text}`, color }];
}

/**
 * The cache segment when only the transcript's clock is known (after a resume or reload,
 * before a turn has reported ratio and tokens): the word and the countdown, no figure
 * invented.
 *
 * @param left - The countdown
 * @param level - The cache text's abbreviation level
 * @param word - The label span, in the caller's style
 * @returns `Hit · ⏱ 59m`, or `⚡ 59m` when the room runs out
 */
export function clockOnlySpans(left: CacheLeft, level: number, word: Span): Span[] {
	const lead: Span = level >= 2 ? { text: "⚡", color: THEME.muted } : word;
	return [lead, ...expirySpans(left.leftMs, level, left.estimated)];
}

/** Muted while there is time, amber under two minutes, red under thirty seconds and once lapsed. */
export function expiryColor(leftMs: number): string {
	if (leftMs <= RED_MS) return THEME.bad;
	return leftMs <= AMBER_MS ? THEME.warn : THEME.muted;
}
