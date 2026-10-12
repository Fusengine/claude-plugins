import type { TestBody } from "claude-code/testing";
import type { EngineFacts } from "./types";
import { ENGINE, NOW, USAGE } from "./test-data";

/** Props of an `AbovePrompt` band, minus `bodyColumns`. */
export const BAND = {
	hasSurvey: false,
	isWorking: false,
	maxRows: 12,
	scroll: { offset: 0, bodyRows: 11 },
	view: {},
} as const;

/** What the engine draws when the mod leaves the band alone. */
export const ENGINE_BAND = { type: "Text" as const, children: ["engine"] };

type On = Parameters<TestBody>[1];
/** The `$` a test body receives. */
export type Mounter = Parameters<TestBody>[0];

/**
 * The world beneath the mod in a test: stored engine facts, clock, model and the session's usage.
 *
 * @param on - The test's hook registrar
 * @param engine - The engine facts the mod finds in its state
 * @param usage - The session's usage
 */
export function world(on: On, engine: EngineFacts = ENGINE, usage = USAGE): void {
	on("state.get", (_$, e, next) =>
		e.plugin === "fuse-statusline" && e.key === "data"
			? { value: { value: engine, version: 1 } }
			: next(e),
	);
	on("clock.now", () => ({ value: NOW }));
	on("env.get", () => ({ value: undefined }));
	on("session.model", () => ({ value: "claude-opus-5-5" }));
	on("session.usage", () => ({ value: usage }));
	on("ui.render", () => ENGINE_BAND);
}
