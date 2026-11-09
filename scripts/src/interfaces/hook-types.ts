/**
 * Hook Types - Supported Claude Code hook event types
 *
 * @description SRP: Hook type definitions and registry only
 * @see https://code.claude.com/docs/en/hooks
 */

/**
 * Hook types routed through the fusengine hooks-loader. Only events that a
 * plugin hooks.json actually handles belong here: registering the loader for an
 * unhandled event is harmful (a WorktreeCreate command hook REPLACES git's
 * worktree creation and must print the path, so an empty-output loader breaks it).
 */
export type HookType =
	| "UserPromptSubmit"
	| "PreToolUse"
	| "PostToolUse"
	| "PostToolUseFailure"
	| "PermissionRequest"
	| "SubagentStart"
	| "SubagentStop"
	| "SessionStart"
	| "Stop"
	| "Notification"
	| "PreCompact"
	| "SessionEnd"
	| "InstructionsLoaded"
	| "TeammateIdle"
	| "TaskCompleted";

/** Registry of all hook types for settings generation */
export const HOOK_TYPES: HookType[] = [
	"UserPromptSubmit",
	"PreToolUse",
	"PostToolUse",
	"PostToolUseFailure",
	"PermissionRequest",
	"SubagentStart",
	"SubagentStop",
	"SessionStart",
	"Stop",
	"Notification",
	"PreCompact",
	"SessionEnd",
	"InstructionsLoaded",
	"TeammateIdle",
	"TaskCompleted",
];

/** Events the loader used to be registered for; migrated away on setup. */
export const REMOVED_HOOK_TYPES = [
	"WorktreeCreate",
	"WorktreeRemove",
	"ConfigChange",
	"Setup",
] as const;
