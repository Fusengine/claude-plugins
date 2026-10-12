import { describe, expect, test } from "claude-code/testing";
import { cacheLeftMs, cacheTtlMs, expiryColor, expirySpans, expiryText, TTL_MS } from "./cache-expiry";
import { cacheCard } from "./cards-cache";
import { cacheSpans } from "./segments-terminal";
import { FACTS, rowText, withTerminal } from "./test-data";
import { THEME } from "./theme";

const MIN = 60_000;
const withLeft = (leftMs: number) => ({ ...FACTS, cache: { ...FACTS.cache!, leftMs } });

describe("cache TTL: Claude Code's own order of precedence", () => {
	test("FORCE_PROMPT_CACHING_5M beats everything", () => {
		const env = { force5m: "1", ttl: "1h", enable1h: "1" };
		expect(cacheTtlMs(env, true, false)).toBe(TTL_MS["5m"]);
	});

	test("CLAUDE_CODE_PROMPT_CACHE_TTL next, only 5m or 1h count", () => {
		expect(cacheTtlMs({ ttl: "1h" }, false, true)).toBe(TTL_MS["1h"]);
		expect(cacheTtlMs({ ttl: "5m" }, true, false)).toBe(TTL_MS["5m"]);
		expect(cacheTtlMs({ ttl: "2h" }, false, false)).toBe(TTL_MS["5m"]);
	});

	test("ENABLE_PROMPT_CACHING_1H, then the default: 1h on a subscription within plan usage", () => {
		expect(cacheTtlMs({ enable1h: "1" }, false, true)).toBe(TTL_MS["1h"]);
		expect(cacheTtlMs({}, true, false)).toBe(TTL_MS["1h"]);
		expect(cacheTtlMs({}, true, true)).toBe(TTL_MS["5m"]);
		expect(cacheTtlMs({}, false, false)).toBe(TTL_MS["5m"]);
	});
});

describe("countdown", () => {
	test("TTL less the time since the main turn ended, never below 0", () => {
		expect(cacheLeftMs(1_000, 1_000 + MIN, 5 * MIN)).toBe(4 * MIN);
		expect(cacheLeftMs(1_000, 1_000 + 9 * MIN, 5 * MIN)).toBe(0);
	});

	test("text: 4m12s under ten minutes, 58m above, 45s under one, expiré at 0", () => {
		expect(expiryText(4 * MIN + 12_000)).toBe("4m12s");
		expect(expiryText(58 * MIN)).toBe("58m");
		expect(expiryText(45_000)).toBe("45s");
		expect(expiryText(0)).toBe("expiré");
	});

	test("color: muted, amber under two minutes, red under thirty seconds and when lapsed", () => {
		expect(expiryColor(3 * MIN)).toBe(THEME.muted);
		expect(expiryColor(90_000)).toBe(THEME.warn);
		expect(expiryColor(20_000)).toBe(THEME.bad);
		expect(expiryColor(0)).toBe(THEME.bad);
	});

	test("no turn ended yet: no countdown", () => {
		expect(expirySpans(undefined, 0)).toEqual([]);
	});
});

describe("both designs show it", () => {
	test("desktop card: `Hit 99% · R 370K · W 2K · ⏱ 4m12s`, red `expiré` at 0", () => {
		const card = (left: number) => cacheCard(withLeft(left), 0);
		expect(rowText([card(4 * MIN + 12_000)!])).toBe("Hit 99% · R 370K · W 2K · ⏱ 4m12s");
		expect(rowText([card(0)!])).toContain("⏱ expiré");
	});

	test("desktop card at the compact level keeps the countdown short", () => {
		expect(rowText([cacheCard(withLeft(4 * MIN), 2)!])).toBe("⚡99% 4m00s");
	});

	test("terminal segment: same text, colored by the time left", () => {
		const spans = cacheSpans(withTerminal(withLeft(90_000)), 0);
		expect(spans.map((s) => s.text).join("")).toBe("Hit 99% · R 370K · W 2K · ⏱ 1m30s");
		expect(spans.at(-1)?.color).toBe(THEME.warn);
	});
});
