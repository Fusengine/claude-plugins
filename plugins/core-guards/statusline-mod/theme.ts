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
