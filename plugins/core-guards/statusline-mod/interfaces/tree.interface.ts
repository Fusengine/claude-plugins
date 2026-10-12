/** A drawn element as a test reads it back from `ui.drawn()`. */
export interface TreeNode {
	type?: string;
	props?: Record<string, unknown>;
	children?: unknown;
}
