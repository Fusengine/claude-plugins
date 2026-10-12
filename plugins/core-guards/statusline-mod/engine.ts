import type { HookInput } from "../statusline/src/interfaces/hook-input.interface";
import { modelName } from "./labels";
import type { SessionFacts } from "./interfaces/session-facts.interface";

/**
 * The structured emitter: it runs the statusline engine's own services and prints
 * their figures as JSON, under the marketplace path every marketplace hook uses.
 */
const EMITTER_PATH =
	"/.claude/plugins/marketplaces/fusengine-plugins/plugins/core-guards/statusline-mod/emit-data.ts";

/**
 * Builds the argv that runs the engine's structured emitter.
 *
 * @param home - The user's home directory
 * @param override - `FUSE_STATUSLINE_EMITTER`: an absolute path to run instead (development)
 * @returns The argv for `$.process.run`
 */
export function engineArgv(home: string, override?: string | null): string[] {
	return ["bun", override || home + EMITTER_PATH];
}

/**
 * Builds the statusLine stdin payload from the session, as Claude Code sends it.
 *
 * @param facts - The session's figures, read by the mod
 * @returns The HookInput the statusline engine reads
 */
export function buildInput(facts: SessionFacts): HookInput {
	const { usage } = facts;
	const tokens = usage.context.tokens ?? 0;
	return {
		session_id: facts.id,
		transcript_path: "",
		cwd: facts.cwd,
		model: { id: facts.model, display_name: modelName(facts.model) || facts.model },
		workspace: { current_dir: facts.cwd, project_dir: facts.root },
		version: facts.version,
		output_style: { name: "default" },
		effort: facts.effort ? { level: facts.effort } : undefined,
		cost: usage.cost && {
			total_cost_usd: usage.cost.usd,
			total_duration_ms: facts.now - usage.startedAt,
			total_api_duration_ms: 0,
			total_lines_added: 0,
			total_lines_removed: 0,
		},
		context_window: {
			total_input_tokens: tokens,
			total_output_tokens: 0,
			context_window_size: usage.context.window,
			used_percentage: usage.context.percent ?? null,
			current_usage: { input_tokens: tokens },
		},
	};
}
