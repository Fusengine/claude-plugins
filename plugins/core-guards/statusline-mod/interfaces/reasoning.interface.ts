/** One settings file as parsed JSON, with whether its top-level `effortLevel` applies to every model. */
export interface SettingsLayer {
	settings: Record<string, unknown>;
	/** True for project and local files; the user file's top-level key is the pre-2.1.251 form. */
	appliesToEveryModel: boolean;
}

/** The environment variables that decide effort, thinking and fast mode. */
export interface ReasoningEnv {
	/** `CLAUDE_CODE_EFFORT_LEVEL` */
	effort?: string;
	/** `MAX_THINKING_TOKENS` */
	maxThinkingTokens?: string;
	/** `CLAUDE_CODE_DISABLE_FAST_MODE` */
	disableFast?: string;
}

/** What the old statusline's effort segment reads from Claude Code's stdin. */
export interface ReasoningSettings {
	/** The effort level the settings give; absent when none does. */
	effort?: string;
	thinking: boolean;
	fast: boolean;
}
