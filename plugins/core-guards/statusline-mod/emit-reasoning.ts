import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { HookInput } from "../statusline/src/interfaces";
import type { SettingsLayer } from "./interfaces/reasoning.interface";
import { resolveReasoning } from "./reasoning";

/** A settings file as an object, or `null` when it is missing or not JSON. */
function load(path: string): Record<string, unknown> | null {
	try {
		const v: unknown = JSON.parse(readFileSync(path, "utf-8"));
		return typeof v === "object" && v !== null && !Array.isArray(v)
			? (v as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

/**
 * Fills the payload's `effort`, `thinking` and `fast_mode` from Claude Code's own settings
 * (a mod's API has no such flags), as the old statusline's effort segment reads them from
 * stdin. An `effort` already in the payload (seen live by `turn.step`, so a mid-session
 * `/effort` counts) is kept. Files read, highest precedence first: the project's
 * `.claude/settings.local.json` and `.claude/settings.json`, then `~/.claude/settings.json`;
 * managed settings and `--settings` are not readable here.
 *
 * @param input - The statusLine payload built from the session; changed in place
 */
export function applyReasoning(input: HookInput): void {
	const project = join(input.workspace.project_dir || input.cwd, ".claude");
	const files: [string, boolean][] = [
		[join(project, "settings.local.json"), true],
		[join(project, "settings.json"), true],
		[join(homedir(), ".claude", "settings.json"), false],
	];
	const layers: SettingsLayer[] = files.flatMap(([path, appliesToEveryModel]) => {
		const settings = load(path);
		return settings ? [{ settings, appliesToEveryModel }] : [];
	});
	const r = resolveReasoning(input.model.id, layers, {
		effort: process.env.CLAUDE_CODE_EFFORT_LEVEL,
		maxThinkingTokens: process.env.MAX_THINKING_TOKENS,
		disableFast: process.env.CLAUDE_CODE_DISABLE_FAST_MODE,
	});
	const level = input.effort?.level ?? r.effort;
	input.effort = level ? { level } : undefined;
	input.thinking = { enabled: r.thinking };
	input.fast_mode = r.fast;
}
