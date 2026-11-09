import { describe, expect, test } from "bun:test";
import type { OAuthUsageResponse } from "../interfaces/oauth-usage.interface";
import { formatUsage } from "./oauth-formatter";

describe("formatUsage", () => {
	test("five_hour null: no throw, weekly kept, 5h absent", () => {
		const usage: OAuthUsageResponse = {
			five_hour: null,
			seven_day: { utilization: 42, resets_at: null },
			seven_day_opus: { utilization: 0, resets_at: null },
		};
		const formatted = formatUsage(usage);
		expect(formatted.fiveHour).toBeUndefined();
		expect(formatted.sevenDay.percentage).toBe(42);
	});
});
