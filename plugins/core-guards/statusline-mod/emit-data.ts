#!/usr/bin/env bun
/**
 * Entry point of the statusline engine's side, run by the mod through
 * `$.process.run` (a hooks module has no fs, no network, no git).
 *
 * It repeats the engine's orchestration (`statusline/src/index.ts` main: config,
 * git, daily tracker) and prints the figures only the engine knows as JSON
 * (`buildEngineFacts`); the session's own figures never leave the mod.
 */
import { basename } from "node:path";
import { ConfigManager } from "../statusline/src/config/manager";
import type { HookInput, OAuthUsageResponse } from "../statusline/src/interfaces";
import { trackDailySpend } from "../statusline/src/services";
import { getUsageLimits } from "../statusline/src/services/oauth.service";
import { formatPath, getGitInfo } from "../statusline/src/utils";
import { isEngaged } from "./cards-extra";
import { cacheClock } from "./emit-cache";
import { limitsOf } from "./emit-limits";
import { applyReasoning } from "./emit-reasoning";
import { terminalLook } from "./emit-terminal";
import { buildEngineFacts } from "./engine-facts";
import type { ExtraCredits } from "./types";

/** The API counts credits in cents. */
const CENTS = 100;

/** A finite cost, or `undefined`: the stdin payload is not type-safe. */
const finite = (v: unknown): number | undefined =>
	typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** The engine's OAuth usage answer, fetched once per run; `null` when it has none. */
async function usageOnce(): Promise<OAuthUsageResponse | null> {
	try {
		return await getUsageLimits();
	} catch {
		return null;
	}
}

/** The account's extra-usage credits from the usage answer (cents to dollars). */
function extraCredits(usage: OAuthUsageResponse | null): ExtraCredits | null {
	const extra = usage?.extra_usage;
	if (!extra) return null;
	return {
		enabled: extra.is_enabled === true,
		usedUsd: extra.used_credits / CENTS,
		limitUsd: extra.monthly_limit / CENTS,
		percent: extra.utilization,
	};
}

async function main(): Promise<void> {
	const input: HookInput = await Bun.stdin.json();
	applyReasoning(input);
	const config = await new ConfigManager().load();
	const cost = finite(input.cost?.total_cost_usd);
	const daily =
		config.dailySpend.enabled && cost !== undefined
			? trackDailySpend(input.session_id, cost, config.dailySpend.budget)
			: undefined;
	const usage = await usageOnce();
	const git = await getGitInfo();
	const extra = extraCredits(usage);
	const facts = buildEngineFacts(config, {
		now: new Date(),
		path: {
			styled: formatPath(input.workspace.current_dir, config.directory.pathStyle),
			base: basename(input.workspace.current_dir),
		},
		git,
		dailyUsd: daily?.cost,
		extra: config.extraUsage?.enabled ? extra : null,
		limits: limitsOf(usage),
		cacheClock: cacheClock(input.session_id, [input.cwd, input.workspace.project_dir]),
		terminal: await terminalLook(input, config, git, daily, isEngaged(extra)),
	});
	console.log(JSON.stringify(facts));
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
