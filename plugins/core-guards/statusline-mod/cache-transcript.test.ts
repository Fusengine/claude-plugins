import { describe, expect, test } from "claude-code/testing";
import { cacheRemaining, expirySpans, expiryText, TTL_MS } from "./cache-expiry";
import { parseCacheTail } from "./cache-transcript";
import { cacheCard } from "./cards-cache";
import { cacheSpans } from "./segments-terminal";
import { FACTS, rowText, withTerminal } from "./test-data";

const MIN = 60_000;
const T0 = Date.parse("2026-10-08T14:00:00.000Z");

/** One transcript line: an assistant response with the API's cache-write split. */
const reply = (
	iso: string,
	split: { ephemeral_5m_input_tokens: number; ephemeral_1h_input_tokens: number } | null,
	extra: Record<string, unknown> = {},
): string =>
	JSON.stringify({
		type: "assistant",
		timestamp: iso,
		message: { usage: split ? { cache_creation: split } : {} },
		...extra,
	});
const lines = (...l: string[]): string => `${l.join("\n")}\n`;
const ONE_H = { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 5292 };
const FIVE_M = { ephemeral_5m_input_tokens: 800, ephemeral_1h_input_tokens: 0 };
const READ_ONLY = { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 };

describe("transcript tail: the cache's real clock", () => {
	test("last main response's time, TTL of the last write (1h)", () => {
		const tail = lines(
			reply("2026-10-08T14:00:00.000Z", FIVE_M),
			reply("2026-10-08T14:05:00.000Z", ONE_H),
			reply("2026-10-08T14:09:00.000Z", READ_ONLY),
		);
		expect(parseCacheTail(tail)).toEqual({ lastRequestAt: T0 + 9 * MIN, ttl: "1h" });
	});

	test("a 5m write gives 5m", () => {
		expect(parseCacheTail(lines(reply("2026-10-08T14:01:00.000Z", FIVE_M)))).toEqual({
			lastRequestAt: T0 + MIN,
			ttl: "5m",
		});
	});

	test("no split anywhere: the time is known, the TTL is null", () => {
		const tail = lines(reply("2026-10-08T14:02:00.000Z", null), reply("2026-10-08T14:03:00.000Z", READ_ONLY));
		expect(parseCacheTail(tail)).toEqual({ lastRequestAt: T0 + 3 * MIN, ttl: null });
	});

	test("sidechain (sub-agent) responses are ignored, as are other entry types", () => {
		const tail = lines(
			reply("2026-10-08T14:00:00.000Z", FIVE_M),
			reply("2026-10-08T14:30:00.000Z", ONE_H, { isSidechain: true }),
			JSON.stringify({ type: "user", timestamp: "2026-10-08T14:40:00.000Z" }),
		);
		expect(parseCacheTail(tail)).toEqual({ lastRequestAt: T0, ttl: "5m" });
	});

	test("a tail cut mid-line at both ends still reads the whole lines between", () => {
		const whole = reply("2026-10-08T14:04:00.000Z", ONE_H);
		const tail = `${reply("2026-10-08T14:00:00.000Z", FIVE_M).slice(40)}\n${whole}\n${reply("2026-10-08T14:08:00.000Z", FIVE_M).slice(0, 60)}`;
		expect(parseCacheTail(tail)).toEqual({ lastRequestAt: T0 + 4 * MIN, ttl: "1h" });
	});

	test("nothing from the main conversation: null", () => {
		expect(parseCacheTail("")).toBeNull();
		expect(parseCacheTail(lines(reply("2026-10-08T14:00:00.000Z", ONE_H, { isSidechain: true })))).toBeNull();
	});
});

describe("after a resume: the transcript's clock alone, no figure invented", () => {
	const resumed = { ...withTerminal(FACTS), cache: undefined, cacheLeft: { leftMs: 59 * MIN, estimated: false } };

	test("desktop card: `Hit · ⏱ 59m`, no percentage, no R/W", () => {
		const card = cacheCard(resumed, 0);
		expect(card && rowText([card])).toBe("Hit · ⏱ 59m");
	});

	test("terminal segment: the same, and the word gives way to ⚡ when the room runs out", () => {
		const text = (level: number) => cacheSpans(resumed, level).map((s) => s.text).join("");
		expect(text(0)).toBe("Hit · ⏱ 59m");
		expect(text(2)).toBe("⚡ 59m");
	});

	test("neither a turn nor a clock: nothing", () => {
		expect(cacheCard({ ...FACTS, cache: undefined }, 0)).toBeNull();
		expect(cacheSpans({ ...FACTS, cache: undefined }, 0)).toEqual([]);
	});
});

describe("real or estimated: which one is drawn", () => {
	const clock = { lastRequestAt: T0, ttl: "1h" } as const;

	test("the transcript's clock wins and is real: last request plus its TTL", () => {
		expect(cacheRemaining(clock, T0 - 99 * MIN, T0 + MIN, TTL_MS["5m"])).toEqual({
			leftMs: 59 * MIN,
			estimated: false,
		});
	});

	test("no TTL in the transcript, or no clock: the turn-end estimate", () => {
		const est = { leftMs: 4 * MIN, estimated: true };
		expect(cacheRemaining({ lastRequestAt: T0, ttl: null }, T0, T0 + MIN, TTL_MS["5m"])).toEqual(est);
		expect(cacheRemaining(null, T0, T0 + MIN, TTL_MS["5m"])).toEqual(est);
	});

	test("neither source: nothing", () => {
		expect(cacheRemaining(null, null, T0, TTL_MS["5m"])).toBeNull();
	});

	test("text: no tilde when real, a tilde when estimated, `~expiré` at 0", () => {
		expect(expiryText(59 * MIN)).toBe("59m");
		expect(expiryText(59 * MIN, true)).toBe("~59m");
		expect(expiryText(0)).toBe("expiré");
		expect(expiryText(0, true)).toBe("~expiré");
		expect(expirySpans(4 * MIN + 12_000, 0, true).map((s) => s.text).join("")).toBe(" · ⏱ ~4m12s");
		expect(expirySpans(4 * MIN + 12_000, 0).map((s) => s.text).join("")).toBe(" · ⏱ 4m12s");
	});
});
