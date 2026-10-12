/**
 * Narrows an unknown value to a non-null object, for reading parsed JSON field by field.
 *
 * @param v - Any value
 * @returns True for objects and arrays alike, false for `null` and primitives
 */
export const isObject = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null;
