import { bar, makeCard, muted, strong, text } from "./card";
import type { BarRow, Card, Facts, Item, RateWindow, Span } from "./interfaces/card.interface";
import { formatLeft, money } from "./labels";
import { THEME } from "./theme";

/** Cells of the limits bar at each level; 0 drops it (30% narrower since 1.0.14, owner request). */
const BAR_AT = [8, 6, 4, 0, 0] as const;

/**
 * One window: `5h: 10% - 2h33m` (the dash is the 5h window's), reset in its own color.
 */
function windowSpans(label: string, w: RateWindow, left: string, accent: string): Span[] {
	const dash = label === "5h" ? " - " : " ";
	const spans = [strong(`${label}: ${Math.round(w.percent)}%`)];
	if (left) spans.push(strong(dash, THEME.text), { text: left, color: accent });
	return spans;
}

/** Time to the window's reset, empty when unknown, off or no room. */
function leftOf(w: RateWindow, show: boolean, level: number, now: number): string {
	if (!show || level > 1 || !w.resetsAt) return "";
	const ms = Date.parse(w.resetsAt) - now;
	return Number.isFinite(ms) ? formatLeft(ms) : "";
}

/** Daily spend, then the session's cost: `D: 2552.96 $ | 58.00 $`. */
function moneySpans(f: Facts, level: number): Span[] {
	const { flags, dailyUsd } = f.engine;
	const { decimals } = flags.cost;
	const white = (t: string): Span => ({ text: t, color: THEME.text });
	const daily =
		flags.dailySpend && dailyUsd !== null ? white(`D: ${money(dailyUsd, decimals)}`) : null;
	const cost =
		flags.cost.enabled && f.costUsd !== undefined && level <= 2
			? white(money(f.costUsd, decimals))
			: null;
	if (level >= 4) return [];
	if (daily && cost) return [daily, muted(" | "), cost];
	return [daily ?? cost].filter((s): s is Span => s !== null);
}

/**
 * The usage card: 5h and 7d windows with their resets, one stacked bar, daily spend and cost.
 *
 * @param f - Everything the cards draw from
 * @param level - Abbreviation level: resets go, then the bar and the cost, then the spend
 * @param now - `$.clock.now()`, to count down to the resets
 * @returns The card, or `null` when nothing in it has data
 */
export function limitsCard(f: Facts, level: number, now: number): Card | null {
	const { five, seven, bar: showBar } = f.engine.flags.limits;
	const items: Item[] = [];
	const rows: BarRow[] = [];
	if (five.show && f.fiveHour) {
		const left = leftOf(f.fiveHour, five.reset, level, now);
		items.push(text(...windowSpans("5h", f.fiveHour, left, THEME.reset5)));
		rows.push({ ratio: f.fiveHour.percent / 100, fill: THEME.fiveFill });
	}
	if (seven.show && f.sevenDay) {
		const left = leftOf(f.sevenDay, seven.reset, level, now);
		items.push(text(...windowSpans("7d", f.sevenDay, left, THEME.reset7)));
		rows.push({ ratio: f.sevenDay.percent / 100, fill: THEME.sevenFill });
	}
	const width = BAR_AT[level] ?? 0;
	if (showBar && rows.length > 0 && width > 0) {
		items.push(
			bar(width, `usage ${rows.map((r) => Math.round(r.ratio * 100)).join("% ")}%`, ...rows),
		);
	}
	const spend = moneySpans(f, level);
	if (spend.length > 0) items.push(text(...spend));
	return makeCard("limits", 90, level, items);
}
