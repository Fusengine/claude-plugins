/** The environment variables that choose Claude Code's main-conversation cache TTL. */
export interface TtlEnv {
	/** `FORCE_PROMPT_CACHING_5M` */
	force5m?: string | null;
	/** `CLAUDE_CODE_PROMPT_CACHE_TTL` (`5m` or `1h`) */
	ttl?: string | null;
	/** `ENABLE_PROMPT_CACHING_1H` */
	enable1h?: string | null;
}
