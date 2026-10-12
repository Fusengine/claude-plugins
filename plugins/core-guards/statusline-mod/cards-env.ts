import { makeCard, strong, text } from "./card";
import { ellipsize } from "./format";
import type { Card, Facts, Item, Span } from "./interfaces/card.interface";
import { THEME } from "./theme";

/** Cells the directory may take at each level (level 0 and 1 show it whole). */
const PATH_MAX = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, 16, 10, 8] as const;
/** Cells the branch may take at each level. */
const BRANCH_MAX = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, 14, 8] as const;

/** The date and the time, then the time alone, then neither. */
function clockText(f: Facts, level: number): string {
	const { time, flags } = f.engine;
	if (!flags.time.enabled || level >= 2) return "";
	const date = flags.time.date ? time.date : "";
	const clock = flags.time.clock ? time.clock : "";
	return (level === 0 ? [date, clock] : [clock || date]).filter((s) => s !== "").join(" - ");
}

/** The directory: as the engine's `pathStyle` draws it, then its last directory, cut. */
function pathText(f: Facts, level: number): string {
	if (!f.engine.flags.directory.enabled) return "";
	const { styled, base } = f.engine.path;
	return level === 0 ? styled : ellipsize(base, PATH_MAX[level] ?? 8);
}

/** The branch with its dirty mark and the staged / unstaged counts, as far as the level allows. */
function gitSpans(f: Facts, level: number): Span[] {
	const { git, flags } = f.engine;
	const d = flags.directory;
	if (!d.enabled || !d.git || !git || level >= 4) return [];
	const spans: Span[] = [];
	if (d.branch) {
		const branch = git.branch + (d.dirty && git.dirty ? "*" : "");
		spans.push(strong(ellipsize(branch, BRANCH_MAX[level] ?? 8)));
	}
	if (level <= 1) {
		if (d.staged && git.staged > 0) spans.push(strong(` +${git.staged}`, THEME.staged));
		if (d.unstaged && git.unstaged > 0) spans.push(strong(` ~${git.unstaged}`));
	}
	return spans;
}

/**
 * The first card: date and time, directory, branch with its counts.
 *
 * @param f - Everything the cards draw from
 * @param level - Abbreviation level: the time goes first, then the counts, then the git part
 * @returns The card, or `null` when every piece is switched off
 */
export function envCard(f: Facts, level: number): Card | null {
	const items: Item[] = [];
	const clock = clockText(f, level);
	if (clock) items.push(text(strong(clock)));
	const path = pathText(f, level);
	if (path) items.push(text(strong(path)));
	const git = gitSpans(f, level);
	if (git.length > 0) items.push(text(...git));
	return makeCard("env", 70, level, items);
}
