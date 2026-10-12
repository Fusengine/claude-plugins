import type { ModelUsage } from "claude-code";
import type { CacheFigures, EngineFacts, Facts, RateWindow } from "./interfaces/card.interface";
import type { SessionReading } from "./interfaces/session-facts.interface";

/**
 * What a turn did with the prompt cache: read / (input + read + written) and the two counts.
 *
 * @param usage - The turn's token counts (`turn.complete`'s `usage`)
 * @returns The figures, or `null` when the turn counted no input
 */
export function cacheFigures(usage: ModelUsage | undefined): CacheFigures | null {
	if (!usage) return null;
	const read = usage.cache_read_input_tokens;
	const written = usage.cache_creation_input_tokens;
	const total = usage.input_tokens + read + written;
	return total > 0 ? { ratio: read / total, read, written } : null;
}

/** One rate-limit window by its kind, if the session reports it. */
function windowOf(
	limits: SessionReading["usage"]["rateLimits"],
	kind: string,
): RateWindow | undefined {
	const found = limits.find((l) => l.kind === kind);
	return found && { percent: found.percentUsed, resetsAt: found.resetsAt };
}

/**
 * Joins the engine's figures and the live session's into what the cards draw from.
 * The session's rate-limit windows win; the engine's OAuth cache fills in until the session
 * has them. A figure neither has stays absent: its card piece is hidden, never zeroed.
 *
 * @param engine - What the engine's emitter printed
 * @param s - What the mod read from the session
 * @returns The facts
 */
export function toFacts(engine: EngineFacts, s: SessionReading): Facts {
	const { context, rateLimits, cost } = s.usage;
	const tokens = context.tokens ?? 0;
	return {
		engine,
		model: s.model,
		effort: s.effort ?? undefined,
		cache: s.cache ?? undefined,
		contextTokens: tokens,
		contextWindow: context.window,
		contextPercent: context.percent ?? (context.window > 0 ? (tokens / context.window) * 100 : 0),
		fiveHour: windowOf(rateLimits, "five_hour") ?? engine.limits?.fiveHour,
		sevenDay: windowOf(rateLimits, "seven_day") ?? engine.limits?.sevenDay,
		costUsd: cost?.usd,
	};
}
