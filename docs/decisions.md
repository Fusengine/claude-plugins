# Owner decisions

Dated owner decisions for this repo. Agents execute them; a risk is flagged once, never re-debated.

- **2026-11-09** — All Haiku agents move to Sonnet with `effort: low` (owner: « on passe les agent haiku alors en sonnet low »). Basis: same changelog-watcher task, Sonnet low was more reliable than Haiku medium (fact-checked: Haiku wrong on substance, Sonnet only on version numbers) and used fewer tokens (111K vs 154K).
- **2026-11-09** — Sniper → challenger → WIP commit → release run automatically; never ask the owner a go/no-go for them (owner: « ca doit etre auto »).
- **2026-11-09** — The two 2026-11-06 audits (hooks, lead corrections) are AUDITED first, read-only, no fix: hooks A1–A8 by the fuse-harness session, rules F1–F10 + 2.8 in this repo; fixes only after the owner reads both reports (owner: « j'ai dit auditer », « Oui, audite »).
- **2026-11-09** — Go for the fixes of both audits, with the challenger's mitigations (owner: « okay lance tous et orchestre bien le tout et la session harness »). fuse-harness session: A1, A2, A3-1, A4, A5, F1 release gate. This repo: A7 (hook types + settings migration) and the rule sentences. Dropped: A3-2 (Next/Swift keep the 150 default) and the shared detector (later, separate). A5 trade-off accepted with the go: oldest lessons may be compressed to keep the newest whole.
- **2026-11-09** — No regression on the audit fixes (owner: « je ne veux pas de regression »): zero new test failure, no test weakened to pass, and a fix that cannot be proven regression-free is left out of the release and reported.
- **2026-11-09** — Codex rules hooks use `additionalContextLimit: 0`: the full rules corpus is re-injected on every message, on purpose (owner: « il sait que la reinjection ce fait a chaque fois », « Oui, passe à 0 »).
