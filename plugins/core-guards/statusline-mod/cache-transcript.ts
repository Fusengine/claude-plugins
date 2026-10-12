import { isObject } from "./is-object";
import type { CacheClock } from "./types";

/** A token count from the API's `cache_creation` breakdown, 0 when absent or not a number. */
const count = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** The TTL a response's `cache_creation` breakdown shows it wrote with; `null` when it wrote none. */
function ttlOf(usage: unknown): CacheClock["ttl"] {
	const split = isObject(usage) && isObject(usage.cache_creation) ? usage.cache_creation : null;
	if (!split) return null;
	if (count(split.ephemeral_1h_input_tokens) > 0) return "1h";
	return count(split.ephemeral_5m_input_tokens) > 0 ? "5m" : null;
}

/**
 * What the session's transcript says about the prompt cache: when the last main-conversation
 * response was received (every request, read or write, refreshes the TTL) and the TTL the
 * most recent response that wrote to the cache used. Sidechain (sub-agent) responses are
 * ignored. Lines that do not parse (the tail's cut first line, a line being written) are
 * skipped. Only the extracted fields are returned; nothing of the content is kept.
 *
 * @param tail - The end of the transcript JSONL
 * @returns The clock, or `null` when the tail holds no main-conversation response
 */
export function parseCacheTail(tail: string): CacheClock | null {
	let lastRequestAt: number | null = null;
	let ttl: CacheClock["ttl"] = null;
	for (const line of tail.split("\n")) {
		let entry: unknown;
		try {
			entry = JSON.parse(line);
		} catch {
			continue;
		}
		if (!isObject(entry) || entry.type !== "assistant" || entry.isSidechain === true) continue;
		const at = typeof entry.timestamp === "string" ? Date.parse(entry.timestamp) : Number.NaN;
		if (!Number.isFinite(at)) continue;
		lastRequestAt = Math.max(lastRequestAt ?? at, at);
		const written = ttlOf(isObject(entry.message) ? entry.message.usage : null);
		if (written) ttl = written;
	}
	return lastRequestAt === null ? null : { lastRequestAt, ttl };
}
