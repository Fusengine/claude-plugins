import { describe, expect, test } from "claude-code/testing";
import { world } from "./band-world";
import { NOW } from "./test-data";

const turnEnd = { plugin: "fuse-statusline", key: "turnEnd" } as const;
const usage = {
	model: "claude-opus-5-5",
	input_tokens: 30,
	output_tokens: 5,
	cache_read_input_tokens: 370,
	cache_creation_input_tokens: 0,
};
const turn = { answer: "", durationMs: 1, isAborted: false, turnId: "t", reason: "answer", usage } as const;

describe("the cache timer is armed by the main loop only", () => {
	test("a sub-agent's turn leaves it alone, the main turn's end arms it", async ($, on) => {
		world(on);
		on("turn.complete", () => ({ text: "" }));
		const armed: unknown[] = [];
		on("state.set", (_$, e, next) => {
			if (e.plugin === turnEnd.plugin && e.key === turnEnd.key) armed.push(e.value);
			return next(e);
		});
		await $.turn.complete({ ...turn, agentId: "sub-1" });
		expect(armed).toEqual([]);
		await $.turn.complete(turn);
		expect(armed).toEqual([NOW]);
	});
});
