const MS = { minute: 60_000, hour: 3_600_000, day: 86_400_000 } as const;

/**
 * The model as the card names it: family in capitals, version with dots.
 * `claude-opus-5-5` and `Opus 5.5[1m]` both give `OPUS 5.5`.
 *
 * @param raw - `$.session.model()`
 * @returns The label; empty when the model is unknown
 */
export function modelLabel(raw: string): string {
	const parts = raw
		.replace(/\[[^\]]*\]/g, "")
		.replace(/-\d{8}$/, "")
		.replace(/^claude[-\s]?/i, "")
		.split(/[-\s.]+/)
		.filter(Boolean);
	const words = parts.filter((p) => !/^\d+$/.test(p)).map((p) => p.toUpperCase());
	const version = parts.filter((p) => /^\d+$/.test(p)).join(".");
	return [...words, version].filter(Boolean).join(" ");
}

/** `medium` to `Medium`. */
export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The model as the old statusline names it: `claude-mythos-5-1` gives `Mythos 5.1`.
 *
 * @param raw - `$.session.model()`
 * @returns The display name; empty when the model is unknown
 */
export const modelName = (raw: string): string =>
	modelLabel(raw)
		.split(" ")
		.map((w) => (/^\d/.test(w) ? w : capitalize(w.toLowerCase())))
		.join(" ");

/**
 * Tokens as `0.0K`, `590.0K`, `1M`, `1.5M`.
 *
 * @param n - Token count
 * @param decimals - One decimal on thousands, else rounded
 * @returns The figure with its unit
 */
export function formatTokens(n: number, decimals: boolean): string {
	if (n >= 1_000_000) {
		const m = n / 1_000_000;
		return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
	}
	const k = n / 1000;
	return decimals ? `${k.toFixed(1)}K` : `${Math.round(k)}K`;
}

/**
 * Time left as `2h33m`, `6d 16h`, `45m`.
 *
 * @param ms - Milliseconds until the reset
 * @returns The duration, at most two units
 */
export function formatLeft(ms: number): string {
	if (ms <= 0) return "0m";
	const d = Math.floor(ms / MS.day);
	const h = Math.floor((ms % MS.day) / MS.hour);
	const m = Math.floor((ms % MS.hour) / MS.minute);
	if (d > 0) return `${d}d ${h}h`;
	if (h > 0) return `${h}h${m.toString().padStart(2, "0")}m`;
	return `${m}m`;
}

/** The word before the prompt-cache hit ratio, on every surface: `Hit 99%` (owner request, 1.0.13). */
export const CACHE_LABEL = "Hit";

/** An amount as the card writes it: `58.00 $`. */
export const money = (usd: number, decimals: number): string => `${usd.toFixed(decimals)} $`;
