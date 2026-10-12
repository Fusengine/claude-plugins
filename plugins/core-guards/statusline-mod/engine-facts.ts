import type { EngineConfig, EngineGathered } from "./interfaces/engine.interface";
import type { EngineFacts, Flags } from "./types";

const pad2 = (n: number): string => n.toString().padStart(2, "0");

/**
 * Flattens the engine's config into the switches the cards honour. Limits come
 * from `limits` when it is on, else from the engine's `fiveHour` / `weekly` segments.
 *
 * @param c - The resolved engine config
 * @returns What shows, nothing about how
 */
export function flagsOf(c: EngineConfig): Flags {
	const l = c.limits;
	const viaLimits = l?.enabled === true;
	return {
		time: { enabled: c.time.enabled, date: c.time.showDate, clock: c.time.showTime },
		directory: {
			enabled: c.directory.enabled,
			git: c.directory.showGit,
			branch: c.directory.showBranch,
			dirty: c.directory.showDirtyIndicator,
			staged: c.directory.showStagedCount,
			unstaged: c.directory.showUnstagedCount,
		},
		model: {
			enabled: c.model.enabled,
			tokens: c.model.showTokens,
			maxTokens: c.model.showMaxTokens,
			decimals: c.model.showDecimals,
		},
		effort: c.effort.enabled && c.effort.showLevel,
		context: { enabled: c.context.enabled, bar: c.context.progressBar.enabled },
		limits: {
			five: {
				show: viaLimits ? l?.show5h !== false : c.fiveHour.enabled,
				reset: viaLimits ? l?.showResetTime !== false : c.fiveHour.showTimeLeft,
			},
			seven: {
				show: viaLimits ? l?.show7d !== false : c.weekly.enabled,
				reset: viaLimits ? l?.showResetTime !== false : c.weekly.showTimeLeft,
			},
			bar: viaLimits
				? (l?.progressBar?.enabled ?? true)
				: c.fiveHour.progressBar.enabled || c.weekly.progressBar.enabled,
		},
		dailySpend: c.dailySpend.enabled,
		cost: { enabled: c.cost.enabled, decimals: c.cost.decimals },
		extra: {
			enabled: c.extraUsage?.enabled ?? false,
			percent: c.extraUsage?.showPercentage !== false,
			spending: c.extraUsage?.showSpending !== false,
			bar: c.extraUsage?.progressBar?.enabled ?? true,
		},
	};
}

/**
 * The engine's side of the figures, as the emitter prints them.
 *
 * @param config - The resolved engine config
 * @param got - What the engine's services returned
 * @returns The facts the cards need from the engine
 */
export function buildEngineFacts(config: EngineConfig, got: EngineGathered): EngineFacts {
	const { now, git } = got;
	return {
		flags: flagsOf(config),
		time: {
			date: `${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${pad2(now.getFullYear() % 100)}`,
			clock: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
		},
		path: got.path,
		git: git.branch
			? { branch: git.branch, dirty: git.isDirty, staged: git.staged, unstaged: git.unstaged }
			: null,
		dailyUsd: got.dailyUsd ?? null,
		extra: got.extra ?? null,
		limits: got.limits ?? null,
		terminal: got.terminal ?? null,
		cacheClock: got.cacheClock ?? null,
	};
}
