import { isObject } from "./is-object";
import type { ReasoningEnv, ReasoningSettings, SettingsLayer } from "./interfaces/reasoning.interface";

/** The effort levels `CLAUDE_CODE_EFFORT_LEVEL` and the settings accept (`auto` means the model's own). */
const LEVELS = new Set(["low", "medium", "high", "xhigh", "max"]);


/** A model id reduced for matching: lowercase, no `[1m]`, no date suffix. */
const canon = (id: string): string =>
	id
		.toLowerCase()
		.replace(/\[[^\]]*\]/g, "")
		.replace(/-\d{8}$/, "");

/** `Mythos 5.1` (the display form) as `claude-mythos-5-1` (the canonical form). */
const canonOfDisplay = (name: string): string =>
	canon(/^claude/i.test(name) ? name : `claude-${name.replace(/[\s.]+/g, "-")}`);

/** The effort a layer saved for the model, else (where it applies to every model) its own. */
function layerEffort(layer: SettingsLayer, model: string): string | undefined {
	const saved = isObject(layer.settings.modelSettings)
		? Object.entries(layer.settings.modelSettings).find(([k]) => canon(k) === model)
		: undefined;
	const level = isObject(saved?.[1]) ? saved[1].effortLevel : undefined;
	if (typeof level === "string" && LEVELS.has(level)) return level;
	const top = layer.settings.effortLevel;
	// The user file's top-level key is the pre-2.1.251 form, ignored by newer models: not applied.
	return layer.appliesToEveryModel && typeof top === "string" && LEVELS.has(top) ? top : undefined;
}

/** The first layer (highest precedence first) that sets `key` to a boolean. */
const flag = (layers: SettingsLayer[], key: "alwaysThinkingEnabled" | "fastMode") =>
	layers.map((l) => l.settings[key]).find((v): v is boolean => typeof v === "boolean");

/**
 * Claude Code's effort, thinking and fast mode as its documented settings give them
 * (code.claude.com/docs/en/settings-reference, env-vars). What a source cannot tell stays
 * absent: no model default, no `--effort` flag, no managed settings are guessed.
 *
 * Effort: `CLAUDE_CODE_EFFORT_LEVEL`, then per layer (local, project, user) the model's
 * `modelSettings` entry, else a top-level `effortLevel` (project and local only).
 * Thinking: on unless `MAX_THINKING_TOKENS=0` or `alwaysThinkingEnabled: false`; a positive
 * `MAX_THINKING_TOKENS` turns it on. Fast: `fastMode: true`, not disabled by
 * `CLAUDE_CODE_DISABLE_FAST_MODE`, on an Opus model (the models fast mode runs on).
 *
 * @param model - The session's model, in any spelling
 * @param layers - The settings files read, highest precedence first
 * @param env - The variables above
 * @returns What the old statusline's effort segment reads
 */
export function resolveReasoning(
	model: string,
	layers: SettingsLayer[],
	env: ReasoningEnv,
): ReasoningSettings {
	const id = /^claude-/i.test(model) ? canon(model) : canonOfDisplay(canon(model));
	const fromEnv = env.effort && LEVELS.has(env.effort) ? env.effort : undefined;
	const effort = fromEnv ?? layers.map((l) => layerEffort(l, id)).find((v) => v !== undefined);
	const budget = env.maxThinkingTokens === undefined ? Number.NaN : Number(env.maxThinkingTokens);
	const thinking = Number.isFinite(budget) ? budget > 0 : flag(layers, "alwaysThinkingEnabled") !== false;
	const fast = flag(layers, "fastMode") === true && env.disableFast !== "1" && id.includes("opus");
	return { effort, thinking, fast };
}
