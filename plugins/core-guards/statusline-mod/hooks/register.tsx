import type { EngineInterface, Register } from "claude-code";
import { atom, read, update } from "claude-code";
import { cacheRemaining, cacheTtlMs } from "../cache-expiry";
import { isEngaged } from "../cards-extra";
import { buildInput, engineArgv } from "../engine";
import { cacheFigures, toFacts } from "../facts";
import type { SvgElement } from "../interfaces/statusline-elements.interface";
import { flow, layout } from "../layout";
import { terminalLayout } from "../layout-terminal";
import { parseData } from "../parse-data";
import { StatuslineView } from "../view";
import { TERM_INDENT, TerminalView } from "../view-terminal";

const data = atom({ plugin: "fuse-statusline", key: "data" } as const, null);
const cache = atom({ plugin: "fuse-statusline", key: "cache" } as const, null);
const effort = atom({ plugin: "fuse-statusline", key: "effort" } as const, null);
const turnEnd = atom({ plugin: "fuse-statusline", key: "turnEnd" } as const, null);
const tick = atom({ plugin: "fuse-statusline", key: "tick" } as const, null);

/** How often the cache countdown redraws (it shows minutes, and seconds only under ten). */
const TICK_MS = 5_000;
/** At most one refresh per this long from the steps of a running turn. */
const STEP_REFRESH_MS = 10_000;
/** The tick stops this long after a turn: past the longest TTL (1h) the countdown reads `expiré`. */
const TICK_UNTIL_MS = 61 * 60_000;

/** Refresh period for the engine's figures (clock, git, daily spend) between turns. */
const REFRESH_MS = 30_000;
/** Upper bound for one engine run. */
const ENGINE_TIMEOUT_MS = 10_000;
/** Width assumed when the surface reports none. */
const FALLBACK_COLUMNS = 80;
/** Rows the cards may take, whatever the room above the prompt. */
const MAX_ROWS = 3;

/**
 * The surface's `Svg`, never the terminal's: its table can carry one at runtime that
 * draws nothing, which left the bars blank and the cards in hollow outlines.
 */
const svgOf = (surface: string, ui: object): SvgElement | undefined =>
	surface !== "terminal" && "Svg" in ui ? (ui.Svg as SvgElement) : undefined;

/**
 * Reads the session, runs the engine's emitter on it and stores the engine's figures.
 * Failures are swallowed: a broken statusline must never break a hook.
 *
 * @param $ - The engine interface of the calling hook
 */
async function refresh($: EngineInterface): Promise<void> {
	try {
		const [home, emitter, id, model, cwd, root, version, usage, now, level] = await Promise.all([
			$.env.get("HOME"),
			$.env.get("FUSE_STATUSLINE_EMITTER"),
			$.session.id(),
			$.session.model(),
			$.session.cwd(),
			$.session.root(),
			$.session.version(),
			$.session.usage(),
			$.clock.now(),
			read($, effort),
		]);
		const input = buildInput({
			id,
			model,
			cwd,
			root,
			version: version.version,
			usage,
			now,
			effort: level,
		});
		const result = await $.process.run(engineArgv(home ?? "", emitter), {
			cwd,
			stdin: JSON.stringify(input),
			timeoutMs: ENGINE_TIMEOUT_MS,
		});
		const parsed = result.exitCode === 0 ? parseData(result.stdout) : null;
		if (parsed) await update($, data, () => parsed);
	} catch {
		// Keep the last good figures.
	}
}

/**
 * Draws the statusline above the prompt as cards laid out for the band's width:
 * the engine computes its own figures, the session supplies the live ones.
 *
 * @param on - Registers a hook
 */
export const register: Register = (on) => {
	/** When a main step last refreshed the engine's figures (the transcript clock follows each request). */
	let lastStepRefresh = 0;

	on("session.start", async ($, e, next) => {
		$.clock.every(REFRESH_MS, () => refresh($));
		$.clock.every(TICK_MS, async () => {
			const endedAt = await read($, turnEnd);
			const t = await $.clock.now();
			if (endedAt === null || t - endedAt > TICK_UNTIL_MS) return;
			await update($, tick, () => t);
		});
		void refresh($);
		return next(e);
	});

	on("turn.step", async function* ($, e, next) {
		const level = e.effort === undefined ? null : String(e.effort);
		if (e.agentId === undefined && level !== null && level !== (await read($, effort))) {
			await update($, effort, () => level);
		}
		const t = await $.clock.now();
		if (e.agentId === undefined && t - lastStepRefresh >= STEP_REFRESH_MS) {
			lastStepRefresh = t;
			void refresh($);
		}
		return yield* next(e);
	});

	on("turn.complete", async ($, e, next) => {
		const figures = e.agentId === undefined ? cacheFigures(e.usage) : null;
		if (figures) {
			const endedAt = await $.clock.now();
			await update($, cache, () => figures);
			await update($, turnEnd, () => endedAt);
		}
		void refresh($);
		return next(e);
	});

	on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
		const engine = await read($, data);
		if (e.props.hasSurvey || !engine) return next(e);
		const [model, usage, now, cacheNow, effortNow, endedAt, force5m, ttl, enable1h] =
			await Promise.all([
				$.session.model(),
				$.session.usage(),
				$.clock.now(),
				read($, cache),
				read($, effort),
				read($, turnEnd),
				$.env.get("FORCE_PROMPT_CACHING_5M"),
				$.env.get("CLAUDE_CODE_PROMPT_CACHE_TTL"),
				$.env.get("ENABLE_PROMPT_CACHING_1H"),
				read($, tick),
			]);
		const subscription = usage.rateLimits.length > 0 || engine.limits !== null;
		const lifetime = cacheTtlMs({ force5m, ttl, enable1h }, subscription, isEngaged(engine.extra));
		const remaining = cacheRemaining(engine.cacheClock, endedAt, now, lifetime);
		const withExpiry = cacheNow && remaining ? { ...cacheNow, ...remaining } : cacheNow;
		const cacheLeft = !cacheNow && remaining && !remaining.estimated ? remaining : undefined;
		const facts = {
			...toFacts(engine, { model, usage, effort: effortNow, cache: withExpiry }),
			cacheLeft,
		};
		const columns = e.props.bodyColumns || e.viewport?.columns || FALLBACK_COLUMNS;
		const ui = $.ui.resolve(e);
		const Svg = svgOf(e.surface, ui);
		if (e.surface === "terminal" && facts.engine.terminal) {
			const drawn = terminalLayout(facts, columns - TERM_INDENT, Math.min(MAX_ROWS, e.props.maxRows));
			return drawn.rows.length > 0 ? TerminalView(ui, drawn) : next(e);
		}
		const rows = Svg
			? flow(facts, now)
			: layout(facts, now, columns, Math.min(MAX_ROWS, e.props.maxRows));
		if (rows.length === 0) return next(e);
		return StatuslineView(ui, rows, Svg);
	});
};
