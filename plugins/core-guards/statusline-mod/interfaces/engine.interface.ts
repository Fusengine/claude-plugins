import type { CacheClock, EngineLimits, ExtraCredits, TerminalLook } from "../types";

/** Inputs the emitter gathers from the engine's services. */
export interface EngineGathered {
	now: Date;
	/** `formatPath(cwd, pathStyle)` and the last directory of `cwd`. */
	path: { styled: string; base: string };
	git: { branch: string | null; isDirty: boolean; staged: number; unstaged: number };
	dailyUsd?: number;
	extra?: ExtraCredits | null;
	limits?: EngineLimits | null;
	terminal?: TerminalLook | null;
	cacheClock?: CacheClock | null;
}

/**
 * The windows of the engine's OAuth usage response (`getUsageLimits()`), structurally:
 * `utilization` is a percentage (0 to 100) and `resets_at` an ISO timestamp.
 */
export interface UsageWindows {
	five_hour?: { utilization: number; resets_at: string | null } | null;
	seven_day?: { utilization: number; resets_at: string | null } | null;
}

/** A progress bar's switch in the engine's config. */
interface BarSwitch {
	enabled: boolean;
}

/**
 * What the mod reads from the engine's resolved config (`StatuslineConfig`
 * satisfies it): a structural subset, so the mod's pure code never imports the
 * engine's values (a mod's tests load only its own folder).
 */
export interface EngineConfig {
	time: { enabled: boolean; showDate: boolean; showTime: boolean };
	directory: {
		enabled: boolean;
		showGit: boolean;
		showBranch: boolean;
		showDirtyIndicator: boolean;
		showStagedCount: boolean;
		showUnstagedCount: boolean;
	};
	model: { enabled: boolean; showTokens: boolean; showMaxTokens: boolean; showDecimals: boolean };
	effort: { enabled: boolean; showLevel: boolean };
	context: { enabled: boolean; progressBar: BarSwitch };
	cost: { enabled: boolean; decimals: number };
	fiveHour: { enabled: boolean; showTimeLeft: boolean; progressBar: BarSwitch };
	weekly: { enabled: boolean; showTimeLeft: boolean; progressBar: BarSwitch };
	limits?: {
		enabled: boolean;
		show5h?: boolean;
		show7d?: boolean;
		showResetTime?: boolean;
		progressBar?: BarSwitch;
	};
	dailySpend: { enabled: boolean };
	extraUsage?: {
		enabled: boolean;
		showPercentage?: boolean;
		showSpending?: boolean;
		progressBar?: BarSwitch;
	};
}
