import type { Elements, RenderSurface } from "claude-code";

/** The element constructors the statusline view draws with, whichever surface renders it. */
export type StatuslineElements = Pick<Elements[RenderSurface], "Box" | "Text">;

/** The desktop's vector leaf; the terminal's table has none. */
export type SvgElement = Elements["desktop"]["Svg"];
