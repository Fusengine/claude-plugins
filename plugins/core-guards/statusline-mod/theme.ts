/** The card look: dark navy chips, white primary text, muted secondary, one accent per value. */
export const THEME = {
	card: "#07182b",
	text: "#ffffff",
	muted: "#8da2bb",
	warn: "#f5c242",
	bad: "#ff5c5c",
	reset5: "#7ed321",
	reset7: "#f08a9a",
	staged: "#7ed321",
	/** Empty part of every bar. */
	track: "#0b3a78",
	ctxFill: "#22c55e",
	fiveFill: "#2f6bff",
	sevenFill: "#e6a117",
} as const;

/**
 * The color of a context fill: green, then amber, then red as the window fills.
 *
 * @param percent - Context used, 0 to 100
 * @returns A hex color
 */
export function contextColor(percent: number): string {
	if (percent >= 80) return THEME.bad;
	if (percent >= 60) return THEME.warn;
	return THEME.ctxFill;
}

/** Usage from which a limit bar turns green: below it, blue. */
const LIMIT_GREEN_FROM = 30;
/** The engine's own `COLOR_THRESHOLDS` (warning, critical) for orange and red. */
const LIMIT_ORANGE_FROM = 70;
const LIMIT_RED_FROM = 90;

/**
 * The color of a limit bar's fill: blue, then green, then orange, then red as usage rises.
 * Orange and red start where the engine's progressive color does (70 and 90).
 *
 * @param percent - Usage of the window, 0 to 100
 * @returns A hex color
 */
export function limitColor(percent: number): string {
	if (percent >= LIMIT_RED_FROM) return THEME.bad;
	if (percent >= LIMIT_ORANGE_FROM) return THEME.sevenFill;
	if (percent >= LIMIT_GREEN_FROM) return THEME.ctxFill;
	return THEME.fiveFill;
}
