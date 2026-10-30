---
name: stage-gates
description: Authoritative spec of the motion pipeline's owner gates G1/G2 as enforced by the harness `motion` scope — project contract, approval flow, critic sandbox, protected state, and the render budget
when-to-use: Before running any `--stage draft` or `--stage master`, when presenting stills or a draft for approval, when a render is denied, or when `.motion/project.json` is missing
keywords: gate, G1, G2, approval, sha256, MOTION-APPROVE, harness, motion scope, project.json, sandbox, budget, deny
priority: high
requires: beat-map.md
related: exit-contract.md, brief-lock.md
---

# Stage Gates

> **Status: enforced.** The `@fusengine/harness` `motion` scope (>= 0.1.113) is wired by this plugin's `hooks/hooks.json`. A skipped gate is denied by the hook, not by agent discipline. Agents still STOP at G1 and G2 — the deny is the backstop, not the plan.

## Overview

Two owner gates split the expensive renders from the cheap ones. G1 approves the look on the stills (one per beat, on one contact sheet) before any motion is rendered; G2 approves the motion on a 540p draft before the master. Each approval is keyed on the sha256 of the exact artifact the owner saw: re-rendering the artifact invalidates it.

---

## Hook Wiring

`hooks/hooks.json` calls `bun …/@fusengine/harness/dist/cli/bin.mjs hook claude-code motion` on 7 events: `PreToolUse`, `PostToolUse`, `PostToolUseFailure` (matcher `Bash|Write|Edit|MultiEdit|NotebookEdit|Read`), `UserPromptSubmit`, `SubagentStart`, `SubagentStop`, `Stop`. The scope fails closed.

---

## Project Contract — `.motion/project.json`

The project root is the nearest ancestor directory holding `.motion/` (never `$HOME` itself). The contract file is **owner-managed**: the harness denies any agent Write/Edit to it ("Motion project contract guard"). If it is missing, the agent STOPS before the first draft render and asks the owner to create it — never writes it.

| Key (all optional, paths relative to the project root) | Example |
|------|---------|
| `render` | `"bun .motion/render.js"` or `"render.sh"` |
| `draft` | `".motion/out/draft.mp4"` |
| `masters` | string or array, e.g. `[".motion/out/master.mp4"]` |
| `sourceDir` | motion source directory |
| `reviewDir` | default `.motion/review` |

Recommended content for this pipeline:

```json
{"render":"bun .motion/render.js","draft":".motion/out/draft.mp4","masters":[".motion/out/master.mp4"],"reviewDir":".motion/review"}
```

Missing or corrupt → defaults apply, and the gates **fail closed** on any artifact they cannot locate (e.g. master is denied with "declare `draft` in .motion/project.json").

---

## Render Detection

A render is the render entry (declared `render`, or conventional `render.sh`) run with `--stage`.

| Invocation | Treated as |
|------------|-----------|
| no `--stage` | stills |
| `--stage stills` | always allowed (budget note only) |
| `--stage draft` | G1-gated |
| `--stage master` | G2-gated |
| non-literal stage (`--stage "$S"`) | master |

---

## The Gates

| Gate | Denied action | Allowed only when |
|------|---------------|-------------------|
| **G1** | `--stage draft` | The owner approved the current `.motion/stills/contact.png` |
| **G2** | `--stage master` | The owner approved the current draft mp4 |

Deny messages, verbatim:
- contact sheet absent: `Cannot approve stills: the stills contact sheet (.motion/stills/contact.png) does not exist yet — produce the artifact first.`
- artifact present: `Owner: type MOTION-APPROVE stills a632` (4-hex code; `MOTION-APPROVE draft <code>` for G2)

---

## Approval

| Rule | Behaviour |
|------|-----------|
| Accepted | Only a **human-typed** prompt whose **entire** text is `MOTION-APPROVE stills|draft <4-hex>` |
| Never accepted | Sub-agent payloads, task-notifications, teammate / cross-session messages, `/loop`, system-reminders |
| Keyed on | The artifact sha256 — re-rendering it invalidates the approval |
| On success | The hook injects `stage "stills" approved … The next stage may now run.` |
| Agent | Never types, writes, or forges a `MOTION-APPROVE` line; relays the code from the deny message to the owner |

---

## Critic Sandbox

`motion-critic` (also `fuse-motion:motion-critic`) is tracked via `SubagentStart` / `SubagentStop` and write-sandboxed by the harness: it may Read media and the review pack, and run only `ffprobe`, `ffmpeg`, `ls`, `stat`; any write (Write/Edit tools, shell redirect, ffmpeg output or side file such as `-progress`) must land inside the review dir. `-report`/`-vstats` and fan-out muxers (`tee`, `segment`, `hls`, `dash`) are always denied (`Motion critic sandbox`). Its prompt keeps the same rule.

---

## Protected State

- Harness state lives under `~/.fuse-harness/video-motion/` (approvals, budget, and `keys/`). Agents never read, write, or forge it.
- Banned-term list: `~/.fuse-harness/video-motion/banned.txt` (user-level, one term per line, case-insensitive, never in git).
- Sensitive-data scan: any write under the motion source dir (`sourceDir`) whose content matches a banned term or a currency amount (`12 €`, `$1,299.00`, `1 299,50 EUR`, `£ 40`) is denied; the hit is reported redacted, never echoed back.
- Commands touching `.fuse-harness` or `.motion` paths are protected: the harness denies what it cannot verify.

---

## Budget

Each render prints `Motion budget: renders stills N · draft N · master N — wall …`. Optional master cap: `FUSE_MOTION_MAX_MASTER_RENDERS` in `~/.claude/.env` (0 / unset = no cap); reaching it denies with "Master render cap reached". See [exit-contract.md](exit-contract.md).

---

## Agent Behavior

| Moment | Agent does |
|--------|-----------|
| No `.motion/project.json` before the first draft | STOP. Give the owner the recommended content above to create |
| Stills + contact sheet rendered | STOP. Show `contact.png` and its sha256; ask the owner to type the `MOTION-APPROVE stills <code>` shown by the deny |
| Draft reviewed by motion-critic | STOP. Show the draft path, sha256, critic verdict; ask for `MOTION-APPROVE draft <code>` |
| Render denied by a gate | Report the deny message verbatim; never retry or route around it |
| Artifact re-rendered after approval | The approval is void; stop again |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Rendering the draft "to show progress" before G1 | Stop at stills; the draft is G1's reward |
| Re-rendering stills after approval and continuing | New hash → stop and re-ask |
| Writing `.motion/project.json` yourself | Denied — give the owner the content |
| Typing or echoing a `MOTION-APPROVE` line | Only the owner's own prompt approves |
| Hiding the stage (`--stage "$S"`) | Counted as master — use a literal stage |
| Claiming "gate passed" without the hook's approval message | Quote the injected "approved" line or say it is pending |

---

## Related References

- [exit-contract.md](exit-contract.md) — what to do when a gate is refused or a stage fails
- [beat-map.md](beat-map.md) — where the stills are chosen
