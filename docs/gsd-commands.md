# GSD (Get Shit Done) — Command Reference

## What is GSD?

GSD is a workflow orchestration system for AI-assisted development inside Claude Code.  
It solves context rot, gray-area guessing, and unverified shipping by structuring work into phases with fresh agent contexts per task.

**Install:**
```bash
npx get-shit-done-cc@latest --claude --global
```

**Verify install:**
```
/gsd-help
```

---

## Core Workflow (use in order)

| Command | When to use | What it does |
|---|---|---|
| `/gsd-new-project` | Start of a new project | Runs research agents to generate PROJECT.md, REQUIREMENTS.md, ROADMAP.md |
| `/gsd-discuss-phase N` | Before planning each phase | Locks implementation decisions via interview or assumptions mode; outputs CONTEXT.md |
| `/gsd-plan-phase N` | After discussion | 4 parallel research agents → planner → plan-checker → atomic PLAN.md files |
| `/gsd-execute-phase N` | After planning | Runs tasks in dependency-ordered parallel waves; each task gets a fresh context window |
| `/gsd-verify-work N` | After execution | Automated + manual validation; runs nyquist auditor for coverage gaps |
| `/gsd-ship N` | After verification | Creates a PR with auto-generated body |

> Replace `N` with the phase number (e.g. `/gsd-discuss-phase 1`)

---

## Accelerated Paths

| Command | Use case |
|---|---|
| `/gsd-quick` | Ad-hoc task without full planning overhead |
| `/gsd-fast` | Trivial changes (typos, config tweaks) — skips planning entirely |
| `/gsd-next` | Auto-detects current state and suggests the next step |

---

## Phase Management

| Command | What it does |
|---|---|
| `/gsd-add-phase` | Append a new phase to the end of the roadmap |
| `/gsd-insert-phase N` | Insert an urgent phase between existing phases |
| `/gsd-remove-phase N` | Delete a future phase |
| `/gsd-plan-milestone-gaps` | Audit milestone and create phases to fill unmet requirements |

---

## Quality & Review

| Command | What it does |
|---|---|
| `/gsd-verify-work N` | Full verification for phase N (automated + manual) |
| `/gsd-audit-milestone` | Check that all milestone requirements are met |
| `/gsd-ui-review` | 6-pillar visual audit: copywriting, visuals, color, typography, spacing, UX |
| `/gsd-review` | Code quality review |
| `/gsd-add-tests` | Generate test plans for a phase or feature |

---

## Milestone Management

| Command | What it does |
|---|---|
| `/gsd-complete-milestone` | Archive the milestone with a git tag |
| `/gsd-new-milestone` | Start the next version cycle |
| `/gsd-milestone-summary` | Generate a summary doc for onboarding or handoff |

---

## Utilities

| Command | What it does |
|---|---|
| `/gsd-progress` | Show current phase, wave, and task status |
| `/gsd-manager` | Interactive project orchestration UI |
| `/gsd-settings` | Configure workflow preferences |
| `/gsd-debug` | Diagnostic troubleshooting |
| `/gsd-help` | Full command listing inside Claude Code |

---

## The 21 Agents GSD Uses Internally

### Researchers
- `project-researcher` — tech stack, features, architecture
- `phase-researcher` — implementation patterns, test infrastructure
- `ui-researcher` — design contracts (spacing, typography, colors)

### Analyzers
- `assumptions-analyzer` — reads codebase files, surfaces evidence-backed assumptions
- `advisor-researcher` — single decision points with comparison tables

### Planners & Synthesizers
- `research-synthesizer` — merges research into a unified context
- `planner` — creates atomic, dependency-ordered task plans (uses Opus)
- `roadmapper` — builds and updates ROADMAP.md

### Execution & Verification
- `executor` — runs individual tasks with fresh context
- `plan-checker` — validates atomicity, dependencies, and coverage (max 3 iterations)
- `verifier` — end-to-end validation after execution
- `integration-checker` — cross-phase regression testing
- `ui-checker` — visual consistency validation

### Auditors
- `nyquist-auditor` — generates tests to fill coverage gaps without modifying code
- `ui-auditor` — retroactive visual quality audit
- `security-auditor` — OWASP-level threat mitigation verification

### Support
- `codebase-mapper` — maps project structure for agent context
- `debugger` — root cause analysis for failures
- `user-profiler` — adapts output to user's skill level
- `doc-writer` — generates documentation
- `doc-verifier` — validates docs against code

---

## Key Files GSD Creates (in `.planning/`)

| File | Purpose |
|---|---|
| `PROJECT.md` | Project overview and goals |
| `REQUIREMENTS.md` | Functional scope |
| `ROADMAP.md` | Phase-by-phase breakdown |
| `CONTEXT.md` | Locked implementation decisions from discussion phase |
| `PLAN.md` | Atomic task specs with file targets and success criteria |
| `STATE.md` | Current progress tracker |
| `config.json` | Workflow preferences |

---

## Configuration Options (`config.json`)

| Setting | Options | Default |
|---|---|---|
| Mode | `interactive` / `yolo` | `interactive` |
| Granularity | `coarse` (3–5 phases) / `standard` (5–8) / `fine` (8–12) | `standard` |
| Model profile | `quality` / `balanced` / `budget` / `inherit` | per agent |
| Git branching | `none` / `phase` / `milestone` | `none` |
| Security level | OWASP ASVS `1` / `2` / `3` | `1` |

---

## How Parallel Execution Works

GSD groups tasks into **waves** based on dependencies. Tasks in the same wave run in parallel (each with a fresh 200K token context). Tasks that depend on a prior wave run after it completes.

```
Plan 01 (no deps) ──┐
Plan 02 (no deps) ──┼─── Wave 1 (parallel)
Plan 03 (no deps) ──┘
Plan 04 (depends 01) ─── Wave 2
Plan 05 (depends 04) ─── Wave 3
```

---

## Applying GSD to This Project

The Solar Service Manager production roadmap maps directly to GSD phases:

| Sprint (from roadmap.md) | GSD Phase |
|---|---|
| Sprint 0 — Replit cleanup ✅ | Phase 1 |
| Sprint 1 — Authentication & security (JWT) | Phase 2 |
| Sprint 2 — Database integrity | Phase 3 |
| Sprint 3 — Missing admin features | Phase 4 |
| Sprint 4 — File upload & PDFs | Phase 5 |
| Sprint 5 — Notifications | Phase 6 |
| Sprint 6 — Web deployment | Phase 7 |
| Sprint 7 — Mobile foundation (rename + Expo scaffold) | Phase 8 |
| Sprint 8 — Staff app MVP (Android + iOS) | Phase 9 |

**Recommended start:**
```
/gsd-new-project   ← let it read the codebase and existing docs/
/gsd-discuss-phase 1
/gsd-plan-phase 1
/gsd-execute-phase 1
```

---

> GSD does not integrate with GitHub Issues, Linear, or Jira.  
> It operates as a self-contained planning and execution layer alongside your existing tools.
