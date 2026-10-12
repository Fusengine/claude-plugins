import { cacheCard } from "./cards-cache";
import { envCard } from "./cards-env";
import { extraCard } from "./cards-extra";
import { limitsCard } from "./cards-limits";
import { modelCard } from "./cards-model";
import type { Card, Facts } from "./interfaces/card.interface";

/** The most abbreviated level a card has. */
export const MAX_LEVEL = 4;

/**
 * Every card the facts give, at one abbreviation level, in reading order:
 * environment, cache, model, usage.
 *
 * @param f - Everything the cards draw from
 * @param level - 0 (everything) to `MAX_LEVEL`
 * @param now - `$.clock.now()`
 * @param overlay - Desktop: the model card writes its tokens over a thick pill bar
 * @returns The cards that have data and are switched on
 */
export function cardsAt(f: Facts, level: number, now: number, overlay = false): Card[] {
	return [
		envCard(f, level),
		cacheCard(f, level),
		modelCard(f, level, overlay),
		limitsCard(f, level, now),
		extraCard(f, level),
	].filter((c): c is Card => c !== null);
}
