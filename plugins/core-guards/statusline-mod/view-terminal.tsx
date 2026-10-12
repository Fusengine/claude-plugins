import type { TermLayout } from "./interfaces/terminal.interface";
import type { StatuslineElements } from "./interfaces/statusline-elements.interface";
import type { Span } from "./types";

/** Left inset of the band, in cells: the same inset Claude Code gives its own status line. */
export const TERM_INDENT = 2;

/**
 * Draws the terminal's statusline as the old one: plain colored text, one `Text` per row,
 * segments joined by the engine's separator, inset by `TERM_INDENT`. No background, no border.
 *
 * @param ui - The surface's element table, from `$.ui.resolve(e)`
 * @param layout - The rows from `terminalLayout`
 * @returns The band's tree
 */
export function TerminalView(ui: StatuslineElements, layout: TermLayout) {
	const { Box, Text } = ui;
	const run = (s: Span, key: string) => (
		<Text key={key} color={s.color} bold={s.bold} dimColor={s.dim}>
			{s.text}
		</Text>
	);
	return (
		<Box flexDirection="column" paddingLeft={TERM_INDENT}>
			{layout.rows.map((row, r) => (
				<Text key={`r${r}`}>
					{row.flatMap((seg, i) => [
						...(i > 0 ? layout.separator.map((s, k) => run(s, `r${r}-s${i}-${k}`)) : []),
						...seg.spans.map((s, k) => run(s, `r${r}-${seg.id}-${k}`)),
					])}
				</Text>
			))}
		</Box>
	);
}
