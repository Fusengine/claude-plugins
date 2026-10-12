import type { SessionUsage } from "claude-code";
import type { Row } from "./interfaces/card.interface";
import type { EngineFacts, ExtraCredits, Facts } from "./types";

/** `$.clock.now()` of every test: 2026-10-08T11:26:00Z. */
export const NOW = Date.parse("2026-10-08T11:26:00Z");

/** Every switch on, as the owner's `config.json` reads once `limits` is enabled. */
export const ENGINE: EngineFacts = {
	flags: {
		time: { enabled: true, date: true, clock: true },
		directory: {
			enabled: true,
			git: true,
			branch: true,
			dirty: true,
			staged: true,
			unstaged: true,
		},
		model: { enabled: true, tokens: true, maxTokens: true, decimals: true },
		effort: true,
		context: { enabled: true, bar: true },
		limits: {
			five: { show: true, reset: true },
			seven: { show: true, reset: true },
			bar: true,
		},
		dailySpend: true,
		cost: { enabled: true, decimals: 2 },
		extra: { enabled: true, percent: true, spending: true, bar: true },
	},
	time: { date: "08.10.26", clock: "11:26" },
	path: { styled: "~/../elegancia-danceshoes", base: "elegancia-danceshoes" },
	git: { branch: "main", dirty: true, staged: 0, unstaged: 73 },
	dailyUsd: 2552.96,
	extra: null,
	limits: null,
	terminal: null,
	cacheClock: null,
};

const esc = (code: string, text: string): string => `\x1b[${code}m${text}\x1b[0m`;

/** The old engine's segments as it prints them for the owner's config (two-line mode). */
export const TERMINAL = {
	separator: ` ${esc("38;5;240", "·")} `,
	segments: [
		{ name: "time", priority: 10, line: 1, ansi: esc("0;36", "08.10.26 - 12:27") },
		{ name: "claude", priority: 15, line: 1, ansi: `${esc("0;34", "◆")} 2.1.294` },
		{ name: "directory", priority: 20, line: 1, ansi: `${esc("0;32", "⌂")} ~/../elegancia-danceshoes` },
		{ name: "model", priority: 30, line: 1, ansi: `${esc("38;5;135", "⚙")} Mythos 5.1 ${esc("0;33", "[0.0K/1M]")}` },
		{ name: "effort", priority: 31, line: 1, ansi: `${esc("38;5;208", "◐")} medium` },
		{ name: "cost", priority: 40, line: 2, ansi: esc("0;32", "$0.00") },
		{ name: "limits", priority: 55, line: 2, ansi: `${esc("0;36", "5h:")} ${esc("0;32", "19%")} ${esc("0;32", "█░░░")} ${esc("38;5;240", "(1h - 32m)")}` },
		{ name: "dailySpend", priority: 80, line: 2, ansi: `${esc("38;5;208", "$ D:")} ${esc("0;33", "$2754.00")}` },
	],
} as const;

/** The target facts with the old engine's segments, as the terminal draws them. */
export const withTerminal = (f: Facts): Facts => ({
	...f,
	engine: { ...f.engine, terminal: { separator: TERMINAL.separator, segments: [...TERMINAL.segments] } },
});

/** Overage engaged: extra usage enabled and $75.50 of the $100 monthly limit spent. */
export const ENGAGED: ExtraCredits = { enabled: true, usedUsd: 75.5, limitUsd: 100, percent: 75.5 };

/** The target facts with credits engaged. */
export const withCredits = (extra: ExtraCredits | null): Facts => ({
	...FACTS,
	engine: { ...ENGINE, extra },
});

/** The owner's target screenshot as facts: 10% of 5h (2h33m left), 3% of 7d (6d 16h left). */
export const FACTS: Facts = {
	engine: ENGINE,
	model: "claude-opus-5-5",
	effort: "medium",
	cache: { ratio: 0.99, read: 370_000, written: 2_000 },
	contextTokens: 0,
	contextWindow: 1_000_000,
	contextPercent: 0,
	fiveHour: { percent: 10, resetsAt: new Date(NOW + (2 * 60 + 33) * 60_000).toISOString() },
	sevenDay: { percent: 3, resetsAt: new Date(NOW + (6 * 24 + 16) * 3_600_000).toISOString() },
	costUsd: 58,
};

/** The session's usage as the Claude Code API reports it, matching `FACTS`. */
export const USAGE: SessionUsage = {
	startedAt: NOW - 3_600_000,
	context: { tokens: 0, window: 1_000_000, percent: 0 },
	rateLimits: [
		{ kind: "five_hour", percentUsed: 10, resetsAt: FACTS.fiveHour?.resetsAt },
		{ kind: "seven_day", percentUsed: 3, resetsAt: FACTS.sevenDay?.resetsAt },
	],
	cost: { usd: 58 },
};

/**
 * A row as the plain text the person reads: its cards' text, bars as `█`.
 *
 * @param row - A laid-out row
 * @returns One line
 */
export const rowText = (row: Row): string =>
	row
		.map((card) =>
			card.items
				.map((i) => (i.kind === "bar" ? "█".repeat(i.width) : i.spans.map((s) => s.text).join("")))
				.join(" "),
		)
		.join(" | ");

/** Cells a row takes: its cards and the gaps between them. */
export const rowWidth = (row: Row, gap: number): number =>
	row.reduce((n, c) => n + c.width, 0) + gap * Math.max(0, row.length - 1);
