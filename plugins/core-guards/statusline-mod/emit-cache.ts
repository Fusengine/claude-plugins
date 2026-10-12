import { closeSync, fstatSync, openSync, readSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseCacheTail } from "./cache-transcript";
import type { CacheClock } from "./types";

/** How much of the transcript's end is read: it can run to tens of megabytes. */
const TAIL_BYTES = 256 * 1024;

/**
 * The transcript's path by Claude Code's documented convention
 * (code.claude.com/docs/en/sessions): `~/.claude/projects/<dir>/<session id>.jsonl`, `<dir>`
 * being the working directory with every non-alphanumeric character turned into `-`.
 * The session API gives no path, only the id (the file's name). A directory name over
 * 200 characters is cut and hashed by Claude Code; that case is not reproduced here.
 *
 * @param cwd - A directory of the session
 * @param sessionId - `$.session.id()`
 * @returns The path the transcript would have
 */
const transcriptPath = (cwd: string, sessionId: string): string =>
	join(homedir(), ".claude", "projects", cwd.replace(/[^a-zA-Z0-9]/g, "-"), `${sessionId}.jsonl`);

/** The last `TAIL_BYTES` of a file as text, or `null` when it cannot be read. */
function readTail(path: string): string | null {
	let fd: number | null = null;
	try {
		fd = openSync(path, "r");
		const size = fstatSync(fd).size;
		const length = Math.min(size, TAIL_BYTES);
		const buffer = Buffer.alloc(length);
		readSync(fd, buffer, 0, length, size - length);
		return buffer.toString("utf-8");
	} catch {
		return null;
	} finally {
		if (fd !== null) closeSync(fd);
	}
}

/**
 * The prompt cache's real clock from the session's transcript, read-only and from its end
 * only. The session's directory is tried first, then the project's.
 *
 * @param sessionId - `$.session.id()`
 * @param dirs - The session's cwd and project root
 * @returns When the last main request was and its TTL; `null` when the transcript is not found
 */
export function cacheClock(sessionId: string, dirs: string[]): CacheClock | null {
	for (const dir of dirs) {
		const tail = readTail(transcriptPath(dir, sessionId));
		const clock = tail === null ? null : parseCacheTail(tail);
		if (clock) return clock;
	}
	return null;
}
