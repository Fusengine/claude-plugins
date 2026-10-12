/**
 * Browser entry for the statusline-mod demo: re-exports the mod's REAL drawing and
 * formatting functions so the animation never redraws a bar or a color by hand.
 * Bundled by motion-render.js into `motion-bundle.js` (IIFE, `globalThis.SL`).
 */
import { svgSize, svgSource } from "../../../plugins/core-guards/statusline-mod/bar-svg";
import { expiryColor, expiryText } from "../../../plugins/core-guards/statusline-mod/cache-expiry";
import { hitColor } from "../../../plugins/core-guards/statusline-mod/cards-cache";
import {
	formatLeft,
	formatTokens,
	modelLabel,
	money,
} from "../../../plugins/core-guards/statusline-mod/labels";
import { cacheSpans } from "../../../plugins/core-guards/statusline-mod/segments-terminal";
import { contextColor, THEME } from "../../../plugins/core-guards/statusline-mod/theme";

globalThis.SL = {
	THEME,
	contextColor,
	hitColor,
	expiryColor,
	expiryText,
	formatLeft,
	formatTokens,
	modelLabel,
	money,
	svgSize,
	svgSource,
	cacheSpans,
};
