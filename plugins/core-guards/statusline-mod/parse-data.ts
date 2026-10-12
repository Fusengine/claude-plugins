import { isObject } from "./is-object";
import type { CacheClock, EngineFacts, EngineLimits, RateWindow, TerminalLook } from "./types";


/** A well-formed window, else `undefined`. */
function cleanWindow(w: unknown): RateWindow | undefined {
	if (!isObject(w) || typeof w.percent !== "number" || !Number.isFinite(w.percent)) return undefined;
	return typeof w.resetsAt === "string"
		? { percent: w.percent, resetsAt: w.resetsAt }
		: { percent: w.percent };
}

/** The usage windows, keeping only well-formed ones; an older emitter has none. */
function cleanLimits(v: unknown): EngineLimits | null {
	if (!isObject(v)) return null;
	const fiveHour = cleanWindow(v.fiveHour);
	const sevenDay = cleanWindow(v.sevenDay);
	return fiveHour || sevenDay ? { fiveHour, sevenDay } : null;
}

/** The transcript's cache clock when well-formed, else `null`. */
function cleanClock(v: unknown): CacheClock | null {
	if (!isObject(v) || typeof v.lastRequestAt !== "number" || !Number.isFinite(v.lastRequestAt)) {
		return null;
	}
	return { lastRequestAt: v.lastRequestAt, ttl: v.ttl === "5m" || v.ttl === "1h" ? v.ttl : null };
}

/** The engine's segments, keeping only well-formed ones; an older emitter has none. */
function cleanTerminal(v: unknown): TerminalLook | null {
	if (!isObject(v) || typeof v.separator !== "string" || !Array.isArray(v.segments)) return null;
	const segments = v.segments.filter(
		(s): s is TerminalLook["segments"][number] =>
			isObject(s) &&
			typeof s.name === "string" &&
			typeof s.priority === "number" &&
			(s.line === 1 || s.line === 2) &&
			typeof s.ansi === "string",
	);
	return segments.length > 0 ? { segments, separator: v.separator } : null;
}

/**
 * Parses the emitter's stdout. The emitter is the engine's own script, but its
 * output crosses a process boundary, so the shape is checked before it is stored.
 *
 * @param stdout - What `emit-data.ts` printed
 * @returns The engine facts, or `null` when the output is not them
 */
export function parseData(stdout: string): EngineFacts | null {
	try {
		const v: unknown = JSON.parse(stdout);
		if (!isObject(v)) return null;
		const { flags, time, path } = v;
		const ok =
			isObject(flags) &&
			isObject(flags.time) &&
			isObject(flags.directory) &&
			isObject(flags.model) &&
			isObject(flags.context) &&
			isObject(flags.limits) &&
			isObject(flags.cost) &&
			isObject(flags.extra) &&
			(v.extra === null || isObject(v.extra)) &&
			isObject(time) &&
			typeof time.date === "string" &&
			typeof time.clock === "string" &&
			isObject(path) &&
			typeof path.styled === "string" &&
			typeof path.base === "string" &&
			(v.git === null || isObject(v.git)) &&
			(v.dailyUsd === null || typeof v.dailyUsd === "number");
		if (!ok) return null;
		return { ...(v as EngineFacts), limits: cleanLimits(v.limits), terminal: cleanTerminal(v.terminal),
			cacheClock: cleanClock(v.cacheClock),
		};
	} catch {
		return null;
	}
}
