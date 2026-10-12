import type { SessionUsage } from "claude-code";
import type { CacheFigures } from "../types";

/** What the mod reads from the session to feed the statusline engine. */
export interface SessionFacts {
	id: string;
	model: string;
	cwd: string;
	root: string;
	version: string;
	usage: SessionUsage;
	now: number;
	/** The effort seen on the last main-loop request, if one ran. */
	effort?: string | null;
}

/** What the mod reads live from the session to draw the cards. */
export interface SessionReading {
	/** `$.session.model()`. */
	model: string;
	/** The effort seen on the last main-loop request, if one ran. */
	effort: string | null;
	/** The cache figures of the last main-loop turn, if one ran. */
	cache: CacheFigures | null;
	usage: SessionUsage;
}
