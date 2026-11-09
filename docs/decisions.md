# Owner decisions

Dated owner decisions for this repo. Agents execute them; a risk is flagged once, never re-debated.

- **2026-11-09** — All Haiku agents move to Sonnet with `effort: low` (owner: « on passe les agent haiku alors en sonnet low »). Basis: same changelog-watcher task, Sonnet low was more reliable than Haiku medium (fact-checked: Haiku wrong on substance, Sonnet only on version numbers) and used fewer tokens (111K vs 154K).
- **2026-11-09** — Sniper → challenger → WIP commit → release run automatically; never ask the owner a go/no-go for them (owner: « ca doit etre auto »).
- **2026-11-09** — Codex rules hooks use `additionalContextLimit: 0`: the full rules corpus is re-injected on every message, on purpose (owner: « il sait que la reinjection ce fait a chaque fois », « Oui, passe à 0 »).
