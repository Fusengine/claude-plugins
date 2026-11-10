# Challenge — batch 2026-11-10 (bce608f7, 33c839c0, 0395904c, e54f7c1c, 518a2c1a)

**VERDICT: REFUTED** — the claim "the five commits are correct and regress nothing" fails on e54f7c1c (docs index). The four other commits hold. No functional regression: tests, tsc and the agent validator pass on a clean HEAD snapshot.

Claim challenged: "commits bce608f7, 33c839c0, 0395904c, e54f7c1c, 518a2c1a are correct and regress nothing."

## Findings

### MAJOR

1. **docs/README.md:39 links to a file that is not in the repository and to a plugin that does not exist.**
   `docs/plugins/memory.md` is ignored by `.gitignore:46` (block "WIP - in development, do not commit", next to `plugins/memory-neural/`). It exists only on this disk: `git ls-files docs/plugins` does not list it, so the link is broken on GitHub and in any clone. No `fuse-memory` plugin exists in `.claude-plugin/marketplace.json` (28 entries, none for memory). The index also advertises a WIP plugin that the repo explicitly keeps out.
   Fix: delete line 39 (`- [memory](plugins/memory.md) - Neural Memory, persistent memory with Graphiti + Qdrant`).

2. **docs/README.md:22 and :35 add rows with versions the plugins no longer target.** The same commit fixed the stale Go version but copied stale versions for TypeScript and Rust.
   - Line 22 says `TypeScript 6.0 expert (Node 24 / Bun 1.3)`. `plugins/typescript-expert/.claude-plugin/plugin.json:4`, `agents/typescript-expert.md:12` and the plugin README all say TypeScript 7.0 on Node 26 LTS (Node 24 is Maintenance LTS) or Bun 1.4.
     Corrected text: `- [typescript](plugins/typescript.md) - Pure TypeScript 7.0 expert (Node 26 LTS / Bun 1.4)`
   - Line 35 says `Rust 1.96+`. `plugins/rust-expert/.claude-plugin/plugin.json:4`, `agents/rust-expert.md:12` and the plugin README all say `Rust 1.99+`.
     Corrected text: `- [rust](plugins/rust.md) - Rust 1.99+ expert (2024 edition, tokio / axum)`
   - The target pages are stale for the same reason (outside this commit's diff, but the new index rows send readers to them): `docs/plugins/typescript.md:3` and `:9` (TS 6.0 / Node 24 / Bun 1.3 → TS 7.0 / Node 26 LTS / Bun 1.4), and `docs/plugins/rust.md:3` and `:9` (1.96+ → 1.99+).

### MINOR

3. **docs/workflow/commands.md:52 lists a false alias: `/audit-design` (also `/design-audit`).** The file is `plugins/design-expert/commands/audit-design.md` and its frontmatter has `name: design-audit`. The Claude Code docs (https://code.claude.com/docs/en/slash-commands) say a command file "accepts the same fields except `name` and `paths`", and that a command's name comes from the "File name without extension". So `name: design-audit` is ignored and `/design-audit` does not exist.
   Corrected text: ``| `/audit-design` | fuse-design | Audit an existing HTML/CSS design |``

4. **docs/workflow/commands.md:80-88 reads as if only 3 skills can be invoked.** The section says "These are skills with `user-invocable: true`" and lists 3. The real count: 120 skills set `user-invocable: true` and 28 set nothing (the docs give a default of `true`), so 148 of 236 skills are invocable. Only 88 set `false`. Commands used: `grep -lE '^user-invocable: *true' plugins/*/skills/*/SKILL.md | wc -l` → 120, the same with `false` → 88, `ls plugins/*/skills/*/SKILL.md | wc -l` → 236.
   Corrected sentence for line 82: `Skills can also be invoked by name: 148 of the 236 skills are user-invocable (user-invocable defaults to true; 88 set it to false). They are not command files and do not count in the 35 slash commands above. Examples:`

5. **plugins/security-expert/commands/scan.md:34 is narrower than the skill and the agent.** The skill (step 3) and `agents/security-expert.md` both say to complete the scan for every language, file type **and vulnerability class** the scanner does not cover. scan.md:34 still says only "for every language and file type in scope". It does not contradict them, but this one line is behind the 33c839c0 alignment.
   Corrected text: `- Always complete it with the manual patterns of skill \`security-scan\` for every language, file type and vulnerability class it does not cover (secrets: \`references/secrets-patterns.md\`)`

6. **plugins/ai-pilot/agents/brainstorming.md:54 and plugins/ai-pilot/agents/sniper-faster.md:53 give the Rule 7 chain only partly.** The order (fuse-browser → Context7 → Exa) matches `00-critical-rules` Critical Rule 7. Neither line keeps "cross-checked across all three; one source is never enough for an uncertain API", so an agent could stop at the first source. This leaves part of the rule out; it does not contradict it.
   Suggested addition at the end of both bullets: `— cross-check across the three; one source is never enough for an uncertain API`.

## Checked and found correct

- **bce608f7** — only `plugins/package.json` and `plugins/bun.lock` changed (3+/3−). The lock resolves `@fusengine/harness@0.1.115`, and its integrity `sha512-aXFyUAp+…qINFqg==` equals `npm view @fusengine/harness@0.1.115 dist.integrity`. The `figures` / `is-unicode-supported` entries did not change. `bun install --frozen-lockfile --dry-run` in `plugins/` succeeds. The installed `plugins/node_modules/@fusengine/harness/package.json` is at 0.1.115. Every `0.1.11[0-4]` reference outside CHANGELOG and decisions is a floor (`>= 0.1.113` in the motion-expert hooks.json, README, stage-gates.md and docs/plugins/motion.md, which 0.1.115 satisfies), a comment (`pre-0.1.112 location`), or a test fixture under uncommitted `scripts/` (out of scope). No other `^0.1.x` pin exists.
- **0395904c** — the frontmatter of all 6 files parses as YAML (keys name, description, model, effort, color, tools, skills). The tool sets before and after (`comm`) show **0 removed**, 0 duplicates, and these additions: brainstorming +fetch/fetch_batch/serp_batch, sniper-faster +fetch/fetch_batch, prompt-engineer +fetch/fetch_batch/serp_batch, seo-cluster +fetch/fetch_batch, seo-geo +fetch/fetch_batch, seo-local +fetch/fetch_batch/crawl. Each added name is in `plugins/ai-pilot/agents/research-expert.md` (fetch, fetch_batch, crawl, serp_batch) and in the live fuse-browser MCP tool list. sniper-faster's widened scope is bounded: read-only `browser_fetch` / `browser_fetch_batch` of "the doc page that confirms a fix — nothing else", with no live session. "Pre-identified Only", "Never discover new issues" and the >10-line escalation are unchanged. This matches its existing "Verify Before Fixing" principle and does not go beyond its mandate of already-identified fixes. The seo-geo body change replaces "no fast-path tools available" with a fast-path rule that is now true.
- **33c839c0** — the two one-line edits (`agents/security-expert.md:38`, `commands/scan.md:33`) match the skill: one regex per line, exits 0, a `coverage` block since 0.1.115, `coverage.languages`, `totals.files: 0`, "empty ≠ clean". Nothing else changed in those two files (1+/1− each).
- **e54f7c1c, the parts that hold** — every link in docs/README.md resolves to an existing file on disk (memory.md is the git exception, see finding 1). Every `docs/plugins/*.md` is linked. Counters: `ls plugins/*/agents/*.md | wc -l` = 42, `ls plugins/*/skills/*/SKILL.md | wc -l` = 236, `ls plugins/*/commands/*.md | wc -l` = 35, all equal to README lines 9-12 and commands.md:3. The 35 commands in commands.md match the 35 files of `plugins/*/commands/*.md` in both directions, by name, with no duplicates and no subdirectories. The new rows' descriptions match each file's frontmatter (first sentence), and the Plugin column matches each `plugin.json` name. `/nextjs-stack`, `/laravel-api` and `/code-quality` have `user-invocable: true`. Of the removed rows, `/research`, `/exploration` and `/elicitation` have `user-invocable: false`, and `/swift-build` has no command file and no skill directory. Go: go.dev/doc/devel/release lists go1.27.0 (2026-08-19) up to go1.27.3 (2026-10-19), and `plugins/go-expert` (plugin.json, README, agent) says Go 1.27+, so docs/plugins/go.md is correct.
- **518a2c1a** — 2 lines added to docs/decisions.md, dated, quoting the owner. Consistent with the batch.
- **Non-regression** — working tree (HEAD + harness-pin's uncommitted scripts/): `bun test` 415 pass / 0 fail; `bunx tsc --noEmit -p scripts` exit 0; `validate-agents.sh` "No critical errors detected". Clean HEAD snapshot (`git archive HEAD` into the scratchpad, node_modules symlinked): `bun test` 384 pass / 0 fail, tsc exit 0, validate-agents clean. So the five commits pass on their own.

## Not checked

- Whether Claude Code accepts the bare short form (`/nextjs-stack`, `/scan`) for plugin skills and commands, or requires `/plugin:name`. commands.md uses short forms throughout, and so did the version before this commit.
- How Claude Code actually loads the `audit-design.md` `name:` field at runtime. Finding 3 rests on the official docs, not on a live `/` menu.
- Pre-existing stale content outside these diffs: `docs/plugins/swift.md:22` lists a `swift-build` skill that does not exist; `docs/plugins/php.md` says PER-CS 3.0 while `plugin.json` says 3.1.
- The scripts/ WIP (owned by harness-pin) — out of scope.
