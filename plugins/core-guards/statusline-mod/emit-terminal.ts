import type { StatuslineConfig } from "../statusline/src/config/schema";
import type { DailySpend, GitInfo, HookInput, SegmentContext } from "../statusline/src/interfaces";
import { createDefaultSegments } from "../statusline/src/segments";
import {
	getContextFromInput,
	trackFiveHourUsage,
	trackWeeklyUsage,
} from "../statusline/src/services";
import { colors } from "../statusline/src/utils";
import type { TerminalLook, TerminalSegment } from "./types";

/** Segments the mod cannot feed: the session API has no line counts, so `±` would read `+0/-0`. */
const SKIPPED = new Set(["edits"]);

/** The engine's extra-credits segment, which shows whenever enabled; the mod wants it engaged only. */
const CREDITS = "extraUsage";

/** The line the engine's `twoLineMode` puts a segment on. */
const lineOf = (priority: number, config: StatuslineConfig): 1 | 2 =>
	config.global.twoLineMode && priority > (config.global.lineSplitPriority ?? 45) ? 2 : 1;

/**
 * Renders the old statusline engine's own segments for the terminal: same glyphs, colors,
 * bars and order, honouring `config.json`. Each segment is kept apart (not joined) so the
 * mod can wrap them whole to the band's width.
 *
 * @param input - The statusLine payload built from the session
 * @param config - The engine's resolved config
 * @param git - The engine's git figures
 * @param daily - The engine's daily-spend tracker result
 * @param creditsEngaged - Whether extra credits are on and being spent
 * @returns The segments and the separator, or `null` when nothing rendered
 */
export async function terminalLook(
	input: HookInput,
	config: StatuslineConfig,
	git: GitInfo,
	daily: DailySpend | undefined,
	creditsEngaged: boolean,
): Promise<TerminalLook | null> {
	const context = getContextFromInput(
		input,
		config.context.estimateOverhead,
		config.context.overheadTokens,
	);
	const raw = input.cost?.total_cost_usd;
	const cost = typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
	const ctx: SegmentContext = {
		input,
		context,
		fiveHourUsage: trackFiveHourUsage(
			input.session_id,
			context.tokens,
			input.model.id,
			config.fiveHour.subscriptionPlan,
		),
		weeklyUsage:
			config.weekly.enabled && cost !== undefined
				? trackWeeklyUsage(input.session_id, context.tokens, cost)
				: undefined,
		dailySpend: daily,
		git,
		nodeVersion: process.version || "N/A",
	};
	const segments: TerminalSegment[] = [];
	for (const s of createDefaultSegments().sort((a, b) => a.priority - b.priority)) {
		if (SKIPPED.has(s.name) || !s.isEnabled(config)) continue;
		if (s.name === CREDITS && !creditsEngaged) continue;
		const ansi = await s.render(ctx, config);
		if (ansi?.trim()) {
			segments.push({ name: s.name, priority: s.priority, line: lineOf(s.priority, config), ansi });
		}
	}
	if (segments.length === 0) return null;
	const sep = colors.gray(config.global.separator);
	return { segments, separator: config.global.compactMode ? sep : ` ${sep} ` };
}
