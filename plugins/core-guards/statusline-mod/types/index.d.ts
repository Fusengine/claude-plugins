/** A run of text in one style; `color` is a name or hex the host accepts. */
export type Span = {
	text: string;
	color?: string;
	bold?: boolean;
	dim?: boolean;
};

/**
 * What the owner's `config.json` switches on, flattened by `statusline-mod/engine-facts.ts`.
 * A disabled flag hides its piece of a card (and a card with no piece left).
 */
export type Flags = {
	time: { enabled: boolean; date: boolean; clock: boolean };
	directory: {
		enabled: boolean;
		git: boolean;
		branch: boolean;
		dirty: boolean;
		staged: boolean;
		unstaged: boolean;
	};
	model: { enabled: boolean; tokens: boolean; maxTokens: boolean; decimals: boolean };
	effort: boolean;
	context: { enabled: boolean; bar: boolean };
	limits: {
		five: { show: boolean; reset: boolean };
		seven: { show: boolean; reset: boolean };
		bar: boolean;
	};
	dailySpend: boolean;
	cost: { enabled: boolean; decimals: number };
	/** The engine's `extraUsage` segment: the card, its percentage, its spending, its bar. */
	extra: { enabled: boolean; percent: boolean; spending: boolean; bar: boolean };
};

/**
 * Overage billing from the OAuth usage endpoint's `extra_usage` (the engine's own fetch),
 * in dollars: `used_credits` and `monthly_limit` are cents, `utilization` a percentage.
 */
export type ExtraCredits = {
	/** `extra_usage.is_enabled`. */
	enabled: boolean;
	usedUsd: number;
	limitUsd: number;
	percent: number;
};

/** The time the prompt cache still lives and whether it is an estimate (drawn with a `~`). */
export type CacheLeft = { leftMs: number; estimated: boolean };

/** One rate-limit window: percent used (0 to 100) and the ISO time it resets. */
export type RateWindow = { percent: number; resetsAt?: string };

/** The 5h and 7d windows from the engine's OAuth usage cache (the fallback for the session's). */
export type EngineLimits = { fiveHour?: RateWindow; sevenDay?: RateWindow };

/** One segment the old statusline engine rendered: its ANSI text and where it sits. */
export type TerminalSegment = {
	name: string;
	/** The engine's ordering key: lower comes first. */
	priority: number;
	/** The line the engine puts it on (`twoLineMode` splits at `lineSplitPriority`). */
	line: 1 | 2;
	/** The segment exactly as the engine prints it, ANSI colors included. */
	ansi: string;
};

/** The terminal's look: the engine's own segments and its (ANSI) separator. */
export type TerminalLook = { segments: TerminalSegment[]; separator: string };

/**
 * The prompt cache's real clock, read from the session's transcript: when the last
 * main-conversation response arrived (each request refreshes the TTL) and the TTL the most
 * recent cache write used (`null` when none shows).
 */
export type CacheClock = { lastRequestAt: number; ttl: "5m" | "1h" | null };

/** What only the statusline engine (and its files) knows: flags, clock, git, daily spend. */
export type EngineFacts = {
	flags: Flags;
	/** `DD.MM.YY` and `HH:MM`, as the engine's time segment draws them. */
	time: { date: string; clock: string };
	/** The working directory as the engine's `pathStyle` draws it, and its last directory. */
	path: { styled: string; base: string };
	git: { branch: string; dirty: boolean; staged: number; unstaged: number } | null;
	/** Today's spend over every session, from the engine's tracker; `null` when unknown. */
	dailyUsd: number | null;
	/** The account's extra-usage credits; `null` when the endpoint gave none. */
	extra: ExtraCredits | null;
	/** The usage windows from the engine's OAuth cache; `null` when it has none. */
	limits: EngineLimits | null;
	/** The engine's rendered segments for the terminal; `null` from an older emitter. */
	terminal: TerminalLook | null;
	/** The cache's real clock from the transcript; `null` when it cannot be read. */
	cacheClock: CacheClock | null;
};

/**
 * What the last turn did with the prompt cache (`turn.complete`'s `usage`): the hit
 * ratio (0 to 1) and the tokens read from and written to the cache. `leftMs` is the time
 * the cache still lives: the TTL less the time since the last main turn ended (see
 * `cache-expiry.ts` for how the TTL is chosen); absent until a main turn has ended.
 */
export type CacheFigures = {
	ratio: number;
	read: number;
	written: number;
	leftMs?: number;
	/** True when `leftMs` is an estimate (no transcript clock), drawn with a `~`. */
	estimated?: boolean;
};

/** Everything a card is drawn from: the engine's facts and the live session's. */
export type Facts = {
	engine: EngineFacts;
	/** `$.session.model()`, raw. */
	model: string;
	/** Effort level seen on the last main-loop request; absent until one ran. */
	effort?: string;
	/** Prompt-cache figures of the last main-loop turn; absent until one ran. */
	cache?: CacheFigures;
	/** The countdown alone, from the transcript's clock, while no turn has reported `cache` yet. */
	cacheLeft?: CacheLeft;
	contextTokens: number;
	contextWindow: number;
	contextPercent: number;
	fiveHour?: RateWindow;
	sevenDay?: RateWindow;
	/** The session's cost in USD; absent where the host keeps none. */
	costUsd?: number;
};

declare module "claude-code" {
	interface PluginState {
		"fuse-statusline": {
			data: EngineFacts | null;
			cache: CacheFigures | null;
			effort: string | null;
			/** `$.clock.now()` when the last main-loop turn ended; the cache's clock starts there. */
			turnEnd: number | null;
			/** `$.clock.now()` at the last tick: written on a timer so the countdown redraws. */
			tick: number | null;
		};
	}
}
