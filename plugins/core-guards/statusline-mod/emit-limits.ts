import type { UsageWindows } from "./interfaces/engine.interface";
import type { EngineLimits, RateWindow } from "./types";

/** One OAuth window as the mod's `RateWindow`; `undefined` when its utilization is not a number. */
function windowOf(w: UsageWindows["five_hour"]): RateWindow | undefined {
	if (!w || typeof w.utilization !== "number" || !Number.isFinite(w.utilization)) return undefined;
	return w.resets_at ? { percent: w.utilization, resetsAt: w.resets_at } : { percent: w.utilization };
}

/**
 * The 5h and 7d windows of the engine's OAuth usage cache, for sessions that have not
 * received a rate-limit header yet (before the first reply, after a reload).
 *
 * @param usage - `getUsageLimits()`'s answer
 * @returns The windows it has, or `null` when it has none
 */
export function limitsOf(usage: UsageWindows | null | undefined): EngineLimits | null {
	const fiveHour = windowOf(usage?.five_hour);
	const sevenDay = windowOf(usage?.seven_day);
	return fiveHour || sevenDay ? { fiveHour, sevenDay } : null;
}
