/**
 * Atomic path exchange via Bun FFI — the one primitive `node:fs` does not expose.
 * macOS: renamex_np(RENAME_SWAP); Linux: renameat2(RENAME_EXCHANGE). Anything
 * else (or a missing symbol/filesystem support) reports false and the caller
 * skips the switch (live tree untouched). Built-ins only.
 * @description SRP: exchange two existing paths in a single syscall.
 */
import { dlopen, FFIType } from "bun:ffi";

const MAC_RENAME_SWAP = 2;
const LINUX_RENAME_EXCHANGE = 2;
const AT_FDCWD = -100;

/** NUL-terminated UTF-8 buffer for an FFI `cstring` argument. */
function cstr(path: string): Buffer {
	return Buffer.from(`${path}\0`);
}

/** Exchange via the macOS `renamex_np` symbol; true on success. */
function swapDarwin(a: string, b: string): boolean {
	const lib = dlopen("libSystem.B.dylib", {
		renamex_np: { args: [FFIType.cstring, FFIType.cstring, FFIType.u32], returns: FFIType.i32 },
	});
	return lib.symbols.renamex_np(cstr(a), cstr(b), MAC_RENAME_SWAP) === 0;
}

/** Exchange via the Linux `renameat2` symbol (glibc 2.28+); true on success. */
function swapLinux(a: string, b: string): boolean {
	const lib = dlopen("libc.so.6", {
		renameat2: {
			args: [FFIType.i32, FFIType.cstring, FFIType.i32, FFIType.cstring, FFIType.u32],
			returns: FFIType.i32,
		},
	});
	return lib.symbols.renameat2(AT_FDCWD, cstr(a), AT_FDCWD, cstr(b), LINUX_RENAME_EXCHANGE) === 0;
}

/**
 * Atomically exchange two existing paths (e.g. a real directory and a symlink):
 * at no instant is either path missing. Never throws.
 *
 * @param a - First existing path
 * @param b - Second existing path
 * @returns true when exchanged; false when unsupported or the syscall failed (nothing changed)
 */
export function swapPaths(a: string, b: string): boolean {
	try {
		if (process.platform === "darwin") return swapDarwin(a, b);
		if (process.platform === "linux") return swapLinux(a, b);
		return false;
	} catch {
		return false;
	}
}
