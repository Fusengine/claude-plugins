import { bar, makeCard, strong, text } from "./card";
import type { Card, ExtraCredits, Facts, Item } from "./interfaces/card.interface";
import { THEME } from "./theme";

/** Cells of the credits bar at each level; 0 drops it. */
const BAR_AT = [6, 4, 0, 0, 0] as const;
/** Utilization from which the credits read red instead of amber. */
export const EXTRA_RED = 80;

/**
 * Whether usage-based credits are being consumed: the account's `extra_usage.is_enabled`
 * is true AND `used_credits` is above zero. Enabled-but-unused, or used-but-disabled
 * (e.g. `disabled_reason: out_of_credits`), is not engaged.
 *
 * @param extra - The account's extra-usage credits
 * @returns True when overage is on and spending
 */
export const isEngaged = (extra: ExtraCredits | null | undefined): extra is ExtraCredits =>
	!!extra && extra.enabled && extra.usedUsd > 0;

/** `$75.50/$100.00`, whole dollars for the limit once the room runs out. */
function spendText(e: ExtraCredits, level: number): string {
	const limit = level >= 1 ? `$${e.limitUsd.toFixed(0)}` : `$${e.limitUsd.toFixed(2)}`;
	return `$${e.usedUsd.toFixed(2)}${level >= 1 ? "/" : " / "}${limit}`;
}

/**
 * The credit-usage card: spend over the monthly limit, percentage and bar, amber then red
 * as utilization climbs. Shown only while credits are engaged (`isEngaged`).
 *
 * @param f - Everything the cards draw from
 * @param level - Abbreviation level: the bar goes, then the label, then the spend
 * @returns The card, or `null` when switched off, not engaged or without data
 */
export function extraCard(f: Facts, level: number): Card | null {
	const { extra: flag } = f.engine.flags;
	const extra = f.engine.extra;
	if (!flag.enabled || !isEngaged(extra)) return null;
	const color = extra.percent >= EXTRA_RED ? THEME.bad : THEME.warn;
	const pct = Math.round(extra.percent);
	const items: Item[] = [];
	if (level <= 2) items.push(text(strong("Credits", level <= 1 ? THEME.text : color)));
	if (flag.spending && level <= 3) items.push(text({ text: spendText(extra, level), color }));
	if (flag.percent) items.push(text(strong(`${pct}%`, color)));
	const width = BAR_AT[level] ?? 0;
	if (flag.bar && width > 0) {
		items.push(bar(width, `credits ${pct}%`, { ratio: extra.percent / 100, fill: color }));
	}
	return makeCard("extra", 80, level, items);
}
