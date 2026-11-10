# Hermes Agent model choice — research (2026-11-10)

Scope: read-only research. "Fetched" = page read on 2026-11-10 (official pages carry no publication date). Prices in USD per 1M tokens (MTok).
Baseline (owner): coordinator = GPT-6.1 Terra at HIGH; sub-agents = GPT-6.1 Terra at medium and high; one model everywhere.

## 1. GPT Terra 6.1
- Exists as **GPT-6.1 Terra**, model id `gpt-6.1-terra`. Third of four tiers: GPT-6 Astra (flagship) > GPT-6.1 Sol ("near-Astra, lower cost") > **GPT-6.1 Terra** ("fast, efficient model for visual reasoning, precise computer use, and clear, natural writing") > GPT-6 Luna (most efficient, high-volume). https://developers.openai.com/api/docs/models (fetched 2026-11-10)
- Price: input $1, cached input $0.05, cache write $1.25 (30 min) / $2.50 (12 h), output $5. Prompts above 272K input tokens: 2x input/cache, 1.5x output. Batch/Flex -50%. Fast mode 2x. https://developers.openai.com/api/docs/models/gpt-6.1-terra and https://developers.openai.com/api/docs/pricing (fetched 2026-11-10)
- Context 1,050,000 (max input 922,000), max output 128,000, cutoff 2026-06-01. Effort levels: `none, low, medium (default), high, xhigh, max`. Tool calling requires the Responses API. Same model page.
- OpenAI guidance: "Start with medium and increase it if the improvement in quality is worth the added time and tokens." https://developers.openai.com/api/docs/guides/latest-model (fetched 2026-11-10)
- Tool-calling / long-run strengths and weaknesses: no official benchmark found. OpenAI positions Terra for vision, computer use and writing, not for the hardest reasoning/coding (that is Astra/Sol). Speed: no official tokens/s found.
- Hermes-side issues seen on Terra: #145360 `max` effort silently clamped to `xhigh` on Codex Responses (2026-10-27, 1 reporter, root cause confirmed by a contributor). https://github.com/NousResearch/hermes-agent/issues/145360

## 2. Hermes Agent providers and config keys
Source: https://hermes-agent.nousresearch.com/docs/integrations/providers (fetched 2026-11-10), .../user-guide/configuration, .../user-guide/features/delegation, .../user-guide/features/cron.
- Supported (non-exhaustive, list is long): Nous Portal (OAuth subscription), OpenAI Codex (`hermes model` -> "ChatGPT or Codex Subscription", provider `openai-codex`), Anthropic (API key, or OAuth for Claude Max + purchased extra-usage credits only; Pro "doesn't work"), OpenRouter, Fireworks, z.ai/GLM, Kimi/Moonshot, MiniMax, Qwen, Ollama/vLLM/custom endpoints, many more.
- **xAI Grok: yes.** Two providers: `xai` (`XAI_API_KEY`, Responses API) and `xai-oauth` (SuperGrok / X Premium+ browser OAuth, default model `grok-4.6`, endpoint `https://api.x.ai/v1`). Config: `model: {default: grok-4.6, provider: xai-oauth, base_url: https://api.x.ai/v1}`. https://hermes-agent.nousresearch.com/docs/guides/xai-grok-oauth (fetched 2026-11-10). The page itself warns of HTTP 403 for standard SuperGrok subscribers on OAuth (issue #26847) and advises `XAI_API_KEY` + `provider: xai`.
- Cursor: no provider named Cursor in the providers page.
- Main vs sub-agents vs cron vs auxiliary can all differ:
  - main: `model.default`, `model.provider`, `model.base_url`; global effort `agent.reasoning_effort`.
  - sub-agents: `delegation.model`, `delegation.provider`, `delegation.base_url` (empty = inherit parent). Example from the docs: `delegation: {model: "google/gemini-flash-2.0", provider: "openrouter"}`.
  - cron: `cron.model`, `cron.model_provider` (fleet default) and per job `hermes cron create/edit --model ... --provider ...`.
  - auxiliary side tasks: `auxiliary.<task>.provider/model/reasoning_effort` (compression, vision, title, review...). Default is the main model, so side tasks cost like the main model.
  - Different effort per sub-agent: documented under the `model_map` delegation backend (options with `name, description, provider, model, reasoning_effort, service_tier`; the model picks an option per task). A plain top-level `delegation.reasoning_effort` key: NOT FOUND in the pages read.

## 3. Cursor as a backend
- Answer: **No, not officially.** Cursor docs: the Cloud Agents API and SDKs "run Cursor agent workflows ... They are not a standalone model-inference or chat-completions API." https://cursor.com/docs/api (fetched 2026-11-10). The APIs listed are Admin/Analytics/Bugbot (Enterprise), Cloud Agents (beta), TypeScript/Python SDK (run Cursor's own agents).
- Terms of Service (https://cursor.com/terms-of-service, fetched 2026-11-10): no sentence found that grants or forbids using the subscription from a third-party agent. Section 1.5 bans reverse engineering, extraction ("harvest, scrape, or extract data from the Service") and model-extraction attacks.
- Hermes has an open issue "Unofficial Grok Bot provider (Cursor sand ConnectRPC)" (#99886, 2026-09-01). That is an unofficial reverse-engineered route: do not use.
- Verdict: no officially supported way to drive Hermes with a Cursor subscription found.

## 4. Subscription alternatives (official status)
- ChatGPT plan via Codex login: supported by Hermes (`openai-codex`, device-code OAuth, creds in `~/.hermes/auth.json`). OpenAI-side terms text NOT retrieved; secondary sources say tolerated and publicly encouraged but it uses a non-public endpoint (`chatgpt.com/backend-api/codex`), so treat as fragile. Limits: OpenAI business page says "Starting in December, plan usage will have a shared limit across all of ChatGPT and Codex" (https://openai.com/business/pricing/, fetched 2026-11-10). Consumer plan limits: not found.
- Claude: Hermes docs say OAuth route works only with Claude Max + purchased extra-usage credits (base Max allowance never consumed); Pro cannot use it. An experimental `claude-subscription-directsdk` plugin goes through the official Claude Code CLI (BetterClaw, 2026-10-28, secondary). Anthropic's own help article read does not address third-party apps (https://support.claude.com/en/articles/11145838, "Updated over a week ago"; limits "shared across Claude and Claude Code"). Anthropic ToS position: NOT verified. Flag: do not rely on it.
- Nous Portal: official subscription, 300+ models, one bill (https://hermes-agent.nousresearch.com/docs/integrations/nous-portal, fetched 2026-11-10). Plan price and rate limits: not found.
- xAI SuperGrok/Premium+ OAuth: officially documented by Hermes, but open reports of 403 (#26847) and 429 RPM 0/0 on `api.x.ai` (#137690, 2026-10-13).

## 5. Claude pay-per-token cost levers
Current list prices (https://platform.claude.com/docs/en/about-claude/pricing, fetched 2026-11-10), smallest to largest, input / output / cache hit:
- Haiku 5.5: $0.10 / $0.50 / $0.01 (prompts up to 100K; above 100K: $0.50 / $2.50 / $0.05). Haiku 4.5: $1 / $5 / $0.10.
- Sonnet 5.5: $2 / $10 / $0.10. Sonnet 5: $2 / $10 / $0.20.
- Opus 5.5: $4 / $20 / $0.20. Opus 5: $5 / $25 / $0.50.
- Fable 5.2: $8 / $40 / $0.20. Fable 5.1 / Fable 5: $10 / $50 / $0.25 / $1.
- Cache writes: 1.25x input for 5 min, 2x for 1 h (e.g. Sonnet 5.5 $2.50 / $4).
Hermes and caching (https://hermes-agent.nousresearch.com/docs/user-guide/configuration, fetched 2026-11-10): always-on, no opt-out. For Claude via native Anthropic, OpenRouter, Nous Portal it sets `cache_control` breakpoints with `ttl: "1h"` on system prompt and skills, reused across sessions and forked sub-agents. Knob: `prompt_caching.cache_ttl: "5m" | "1h" | "auto"`. xAI uses a separate session-pinned mechanism. Measured cache hit 98% on a Codex user session (#134798).
Other levers from the delegation docs: route side tasks to cheap models (`auxiliary.*`), pin `delegation.model` to a cheap model ("children are where the tokens go"), `delegation.max_concurrent_children` (default 3 in one passage, 10 in another: not reconciled), `max_spawn_depth` multiplies spend.

### Cost model (ESTIMATE, plug your numbers)
Assumptions: 30 days; 100 orchestrator calls/day + 300 sub-agent calls/day = 12,000 calls/month; 40,000 input tokens/call with 90% cache hit (36K cached, 4K fresh); 1,500 output tokens/call (includes reasoning). Cache-write surcharges ignored (add ~10-25%). Formula per call = 36K x cached + 4K x input + 1.5K x output.

| Model for all 12,000 calls | $/call | $/month |
|---|---|---|
| GPT-6.1 Terra (baseline, 1.5K out) | 0.0133 | ~160 |
| GPT-6.1 Terra with 3K out (high effort, more reasoning) | 0.0208 | ~250 |
| GPT-6 Luna | 0.0015 | ~18 |
| Claude Haiku 5.5 | 0.0015 | ~18 |
| Claude Sonnet 5.5 | 0.0266 | ~320 |
| GPT-6.1 Sol | 0.0266 | ~320 |
| Claude Opus 5.5 | 0.0532 | ~640 |
| Grok 4.3 | 0.0160 | ~190 |
| Grok 4.7 (< 200K prompt) | 0.0350 | ~420 |

## 6. Two-tier routing
Supported. Docs section "Cost strategy: frontier planner, inexpensive workers": `model.default` = planner, `delegation.model` (+ optional `delegation.provider`) = all children; "with the default strategy delegate_task has no per-task model parameter, so every child in a batch runs on the configured delegation model". Per-task choice needs the `model_map` backend (options each with provider/model/reasoning_effort). Desktop: Settings -> Model -> Subagents. https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation (fetched 2026-11-10).
```yaml
model:
  default: gpt-6.1-terra
  provider: openai-codex
delegation:
  model: gpt-6-luna          # example only; check it is in your provider catalog
  provider: openai-codex
```
Exact nesting of `model_map` options: copy from the page, not verified here.

## 7. Comparison for sub-agents (coordinator kept on Terra high)
Monthly cost = coordinator 3,000 calls + sub-agents 9,000 calls, same assumptions as item 5 (estimate).

| Option | Cost/month (estimate) | Quality / risk notes |
|---|---|---|
| Baseline: Terra high everywhere (owner's setup) | ~160 (1.5K out) to ~250 (3K out) | Owner reports "not effective". No Terra-specific tool-calling benchmark found. |
| Keep Terra, sub-agents at low/medium | ~115 (assumes 0.5K out per sub-agent call) | Cuts latency and output tokens; OpenAI says start at medium. Reliability effect for Terra: not found. |
| Terra coordinator + GPT-6 Luna sub-agents | ~54 | Luna = "focused, high-volume tasks" (OpenAI). Tool-calling quality of Luna on long agentic runs: not found. |
| Terra coordinator + Claude Haiku 5.5 sub-agents with caching | ~54 | Haiku price very low; above 100K prompt tokens price x5. Hermes caches Claude at 1h TTL. Quality: not found. |
| Sonnet 5.5 coordinator + Haiku 5.5 sub-agents | ~93 | Sonnet 5.5 = Claude's mid tier at $2/$10, same list price as GPT-6.1 Sol. Quality unmeasured here. |
| Grok 4.3 sub-agents | ~184 total | Not cheaper than Terra; cached input $0.20 vs Terra $0.05. |
| Grok 4.7 anywhere | ~420 per 12K calls | Open Hermes bug: effort ignored, slow (see item 8). |
| Kimi / Cursor | n/a | Owner says Kimi slow; Cursor has no inference API (item 3). |

What lowering effort or moving sub-agents to a smaller model changes: latency and output tokens drop (measured on Grok, not Terra: 57.7 s / 3,608 output tokens at default effort vs ~18 s / ~800 at `low`, issue #121796); input price drops 10x with Luna; the loss is on multi-step tool use and judgment, which no source here quantifies. The Hermes docs argue sub-agents given a clear goal, full context and an output contract rarely need a frontier model (opinion of the vendor docs, not a measurement). Sub-agents start with zero context, so the briefing quality in `goal`/`context` matters more than the model.

## 8. What Hermes users say: Grok (xAI) vs GPT (OpenAI)
Evidence is THIN. Reddit, Hacker News, X, Discord summaries: could not be retrieved (Exa returned 401 invalid key; Reddit mirror returned 502; web search returned only vendor/SEO blogs such as haimaker.ai, which are marketing, not user reports). The only primary, dated user material is GitHub issues of NousResearch/hermes-agent. No head-to-head Grok-vs-GPT user comparison was found.

Grok (models named: grok-4.7, grok-4.6, grok-4.3), providers `xai` / `xai-oauth`:
- MEASURED, 5 independent reports: grok-4.7 ignores `agent.reasoning_effort` (allowlist stops at grok-4.6). One turn: 57.7 s, 3,608 output tokens (~3,100 hidden reasoning) for a recipe question; grok-4.6 at `low`: ~18 s, ~800 tokens. Reproduced 2026-10-10, 2026-10-14, 2026-11-02, 2026-11-06 (still present in v0.23.0). Fix PR #118414 pending. https://github.com/NousResearch/hermes-agent/issues/121796 (2026-09-24)
- BUG, 1 reporter + related: long Telegram sessions on grok-4.7, auto-compression cannot cut encrypted reasoning, retries blocked; similar pattern reported on an OpenAI reasoning model via LiteLLM. Fix PR #125935. https://github.com/NousResearch/hermes-agent/issues/125920 (2026-09-28)
- BUG, 1 reporter: SuperGrok OAuth token gets 429 RPM 0/0 on `api.x.ai`, works through Grok CLI proxy. https://github.com/NousResearch/hermes-agent/issues/137690 (2026-10-13)
- BUG: tool-call turns leave the reply only in reasoning (title only read). https://github.com/NousResearch/hermes-agent/issues/118738 (2026-09-22)
- Praise: none found in primary sources.

GPT (models named: gpt-6.1-sol, gpt-6.1-terra, gpt-6-luna), provider `openai-codex`:
- MEASURED, 1 user, n=41 calls: gpt-6.1-sol direct Codex OAuth ~23 tok/s vs ~39 tok/s via Nous Portal; cache hit ~98%. https://github.com/NousResearch/hermes-agent/issues/134798 (2026-10-07)
- OPINION, 1 user: "My sol is overtesting" (too much verification/tool round-trips), asks to cut it without removing tool-backed arithmetic. Comment on https://github.com/NousResearch/hermes-agent/issues/134640 (2026-10-29). Related request to reduce token use vs Codex/Claude Code (issue created 2026-10-28, number not captured).
- HARNESS: maintainers note GPT-6 still gets the GPT-5.4 execution prompt block, i.e. Hermes prompts are not yet tuned for GPT-6. https://github.com/NousResearch/hermes-agent/issues/134640 (2026-10-07)
- BUG, 1 reporter: Terra `max` clamped to `xhigh` (#145360, 2026-10-27).
- Setup friction: Codex refresh-token 401s need re-auth (BetterClaw, secondary).

Reading: both families have open Hermes integration bugs; evidence for either is a handful of anecdotes plus one 5-reporter measured Grok latency bug. This does not establish that Grok or GPT is better for Hermes.

## Not verified / not found
- Any user-experience source from Reddit, HN, X, Discord (blocked/unavailable).
- Terra benchmark for tool calling or agentic stability; Terra tokens/s.
- OpenAI and Anthropic ToS text on third-party use of consumer subscriptions (Anthropic help article does not cover it; OpenAI text not retrieved).
- Nous Portal price and limits; ChatGPT consumer plan limits.
- Exact YAML nesting of `delegation` `model_map`; existence of a plain `delegation.reasoning_effort` key.
- Whether OpenAI bills reasoning tokens as output on `gpt-6.1-terra` (page lists "Reasoning token support" only).
- Exa was down (401); verification used fuse-browser/curl on official pages, WebSearch, and the GitHub API. Confidence: medium (official pages primary, no second independent confirmation for prices).
