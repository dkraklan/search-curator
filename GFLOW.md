# gflow development workflow

# Goals

- Consistent repeatable tracking of a project through its extended lifetime. right now AI coding workflows are really good for "take idea and turn it into feature". But not good at tracking a project over weeks and months.
- Provide a tracked and repeatable pipeline to input ideas, bugs, feedback while the user is still working on some potentially multi day project without totally switching gears.
- Provide a macro tracking state of the project
- Ensure the agents, skills, and subagents are consistently and repeatedly updating project files when working.
- Consider context usage in all this, use subagents when possible to prevent polluting the main thread


# Vocabulary

```
Project              top-level state of all work (artifact: STATE.md)
└── Epic             multi-Slice undertaking
    └── Slice        one end-to-end run of the workflow; ships one piece
        └── Phase    Plan / Execute / Review / Complete
            └── (gflow workhorses: spec → plan → task → step)

Inbox (parallel to Epics)
├── Idea       raw signal; may be promoted to Epic or Slice
├── Bug        broken behavior; becomes a Chore (small) or Slice (substantial)
├── Feedback   user/stakeholder input; digested into decisions log or a Slice
└── Chore      small unit of work; executed inline via gflow-do-chore, no Phase ceremony
```

## Definitions

- **Project** — the entire workspace; aggregate state of all Epics, Slices, and Inbox.
- **Epic** — a major undertaking delivered as multiple Slices.
- **Slice** — one end-to-end pass through Plan/Execute/Review/Complete; produces one shipped piece.
- **Phase** — a stage within a Slice: Plan, Execute, Review, Complete.
- **Spec / Plan / Task / Step** — gflow-native workhorse terms; do not redefine. A spec is a brainstorm output, a plan contains tasks, a task contains steps.
- **Idea / Bug / Feedback / Chore** — the four Inbox bucket types. Chore is the only one that is also a terminal work unit.

# Project Structure

GFLOW.md describes the **consumer-side** layout — what a project that has gflow installed looks like. The gflow package itself is a separate repo (standard pi package shape: `package.json` with `pi` manifest + `extensions/`, `skills/`, `bin/`, `templates/`, etc.). Where the package physically lives on disk depends on the install method.

## Consumer project layout

```
<project>/
├── STATE.md                    project dashboard (auto-generated)
├── GFLOW.md                    rulebook; not auto-loaded
├── AGENTS.md                   lean dispatcher; loaded every request
├── docs/                       active items only
│   ├── epics/
│   │   └── <slug>.md
│   ├── slices/
│   │   └── YYYY-MM-DD-<slug>/
│   │       ├── spec.md         intermediate (brainstorm output)
│   │       ├── plan.md         Plan phase done
│   │       ├── review.md       Review phase done
│   │       └── complete.md     Complete phase done
│   ├── inbox/                  flat; 4 files; each item is a bullet
│   │   ├── ideas.md
│   │   ├── bugs.md
│   │   ├── feedback.md
│   │   └── chores.md
│   ├── triage/                 dated triage notes (if any)
│   └── decisions/              ADR-style memos
└── _archive/                   non-active items (parallel to docs/)
    ├── slices/
    ├── epics/
    ├── abandoned/
    └── dismissed/
```

## Structure rules

- **Slice artifacts co-locate** in one folder (`docs/slices/YYYY-MM-DD-<slug>/`). Wrapper skills override default workhorse spec/plan paths to write here.
- **Slices are flat**, not nested under Epics. An Epic file references its Slices by name. Slices can exist without an Epic.
- **Inbox is 4 files, period.** Each item is one bullet with a date prefix. If a bullet wants to grow, promote it to a Slice or Chore file.
- **Captures go through `gflow-capture`.** The four `docs/inbox/*.md` files are not hand-edited; the `gflow_capture` tool enforces date format and exact-match dedup.
- **`docs/` holds active items only.** Completed Slices, drained Inbox items, and superseded Epics move to `_archive/`.
- **Package loads via `pi install git:github.com/dkraklan/pi-gflow`** (or `pi -e ./path` for local dev). Use `/reload` to pick up changes.

# Lifecycle

## Artifact States

| Artifact      | States                                                              | Terminal                       |
|---------------|---------------------------------------------------------------------|--------------------------------|
| Slice         | drafted → planning → executing → reviewing → completed → archived   | archived (or abandoned)        |
| Epic          | drafted → active → completed → archived                             | archived (or superseded)       |
| Chore         | open → done → archived                                              | archived                       |
| Inbox item    | open → promoted / dismissed                                         | gone (dismissals logged)       |
| Decision      | published                                                           | superseded-but-retained        |

## Transitions

- **Forward transitions fire automatically** from the wrapper skill that produced the new artifact (e.g., `gflow-plan-slice` writes `plan.md` and moves the Slice to `executing`).
- **Archive moves fire automatically via hook** on branch merge / Slice completion.
- **Abandonment and dismissal are manual only** — `gflow-abandon-slice`, `gflow-dismiss-inbox-item`. No auto-abandon.

## Rules

- **Phase enforcement: hard block.** A wrapper skill refuses to run if the prerequisite phase artifact is missing. To do work outside gflow, do it as a Chore. (A Chore can be promoted into gflow if it grows.)
- **STATE.md is generated, never hand-edited.** Regenerated by the extension on session start and by every phase wrapper. Surfaces the N most recent completed Slices so progress is visible.
- **`_archive/` at repo root**, mirrors `docs/` shape: `_archive/slices/`, `_archive/epics/`, `_archive/abandoned/`, `_archive/dismissed/`. STATE.md reads from both `docs/` and `_archive/`.
- **Promotion is cheap and starts fresh.** Inbox bullet → Slice creates an empty Slice folder; brainstorm runs from scratch, seeded with the bullet text. No carry-forward of frontmatter, threads, etc.
- **Abandonment is tracked.** Slice moves to `_archive/abandoned/<slug>/` with a `WHY.md` note. Available for retrospectives.
- **Real-time plan refinement.** During execute, any change to `plan.md` task structure must append an `## Update: <date>` block describing what was discovered. Skill-enforced for v1; hook-enforcement deferred to v1.1.
- **Decisions are manual only.** `gflow-decide` is the sole path. No auto-emission from brainstorming.

## Inbox Triage

- **Cadence: on-demand.** User invokes `gflow-triage-inbox` when they want to drain the inbox. No cron, no routine, no automatic invocation.
- **Interactive flow.** The skill walks through open inbox items one at a time, proposes a disposition, gets user approval, executes the move. No digest file — decisions land immediately during the session.
- **Human in the loop, always.** No headless promotion, dismissal, or Epic creation. Triage proposes; the user disposes.
- **Opportunistic prompt.** `gflow-complete-slice` ends by asking "drain inbox before starting the next Slice?" and offers to launch triage. User can decline. Cheap nudge at the natural moment.
- **Sizing: LLM-suggest + user-approve.** For each open inbox item, the skill proposes a category (Slice / Chore / Epic / Dismiss / Defer) with reasoning. User confirms or overrides; nothing promotes headlessly.
- **Promotion target: LLM-suggest + user-approve.** When promoting to a Slice, the skill proposes one of: standalone, append-to-existing-Epic-X, or new-Epic. User confirms.
- **Decomposition: 1:N allowed.** A single inbox item can fan out to multiple outputs (e.g., feedback → one Bug + one Chore). Triage is the legitimate place to split entangled signals.
- **Dismissal logged.** Dismissed items move to `_archive/dismissed/<date>.md` with a one-line reason.
- **Promotion seeds, doesn't carry forward.** Bullet text seeds the new Slice's brainstorm; no frontmatter or threads carry over.

## STATE.md

Project dashboard. Auto-generated, never hand-edited. One screen, scannable in seconds.

### Sections (in order)

- **Stat block** — single line: `{N epics · M in flight · K shipped · L inbox · D decisions}`
- **In flight** — table of active Slices: slug, epic, phase, progress, started
- **Active Epics** — list with shipped-vs-in-flight counts
- **Recently shipped** — last 5 completed Slices
- **Inbox** — tally per type
- **Recent abandonments** — last 3 with reasons
- **Stale** — Slices in flight >7 days without activity

### Phase progress (filesystem-derived)

Per Slice:

| Phase    | Done iff                                                  |
|----------|-----------------------------------------------------------|
| Plan     | `plan.md` exists                                          |
| Execute  | every `- [ ]` in `plan.md` is `- [x]` (display `M/N tasks`) |
| Review   | `review.md` exists                                        |
| Complete | `complete.md` exists                                      |

`spec.md` is intermediate (brainstorm output); not a phase-completion marker. Compact display: `Plan ✓ · Execute 8/15 · Review · Complete`.

### Regeneration

- **End of each phase** — every wrapper skill calls `gflow-update-state` as its last step.
- **SessionStart hook** — regenerates on pi launch (catches drift from out-of-band edits).
- **No filesystem watcher** — STATE.md does not regen on every `docs/` write; the cost would be wasteful since most writes don't change the visible surface.

### Format constraints

- Tables for structured data; bullets for everything else.
- Hard cap: one terminal screen. If it grows past that, cut sections rather than expanding.

# Wrapper Skills

Ten `gflow-*` skills. Common pattern for phase wrappers: hard-check pre-condition, configure underlying gflow workhorse skill, invoke, **present output to user for review** (like brainstorming presents the design), call `gflow-update-state`. Phase and chore wrappers stop at the end and offer to launch the next phase; user confirms (no auto-chain).

## Phase wrappers

| Skill                  | Pre-condition                  | Invokes                                       | Context     |
|------------------------|--------------------------------|-----------------------------------------------|-------------|
| `gflow-plan-slice`     | none (creates folder)          | `gflow-brainstorm`, `gflow-write-plan` | main thread |
| `gflow-execute-slice`  | `plan.md` exists               | `gflow-subagent-dev`     | subagent    |
| `gflow-review-slice`   | all `plan.md` tasks checked    | multi-model orchestration (see § Multi-Model Review) | main thread |
| `gflow-complete-slice` | `review.md` exists             | `gflow-finish-branch`  | main thread |
| `gflow-do-chore`       | open item in inbox             | inline execution, no subagent       | main thread |

### gflow-plan-slice

Entry point for new work. Verifies on a feature branch, creates `docs/slices/YYYY-MM-DD-<slug>/`, runs brainstorm → writes `spec.md`, then writing-plans → writes `plan.md`. Slug auto-derived from description; user can override. Presents the plan for review at the end.

### gflow-execute-slice

Hard-blocks if `plan.md` missing. Dispatches `gflow-subagent-dev` to run the plan task-by-task, marking checkboxes in `plan.md` as it goes. Real-time refinement appends `## Update: <date>` blocks (skill-enforced for v1). When all tasks checked, presents completion summary.

### gflow-review-slice

Hard-blocks if Execute incomplete. Main-thread orchestrator that dispatches parallel multi-model review (Claude subagent + bash workers for non-Claude CLIs), then runs LLM-based merge and interactive user triage. Full architecture: see § Multi-Model Review. Deferred items route to inbox as Bug or Chore.

### gflow-complete-slice

Hard-blocks if `review.md` missing. Writes `complete.md` (brief wrap-up), runs `gflow-finish-branch`, moves slice folder to `_archive/slices/<slug>/`, updates Epic file if attached, prompts opportunistic triage ("drain inbox before next Slice?").

## Lifecycle wrappers

- **`gflow-abandon-slice`** — manual. Asks for one-line reason. Moves slice to `_archive/abandoned/<slug>/` with `WHY.md`.
- **`gflow-capture`** -- manual. Captures one item to an inbox file (`ideas` / `bugs` / `feedback` / `chores`). Uses the `gflow_capture` tool (date format, type validation, exact-match dedup).
- **`gflow-dismiss-inbox-item`** — manual. Removes the bullet, logs to `_archive/dismissed/<date>.md` with reason.
- **`gflow-decide`** — write an ADR entry to `docs/decisions/YYYY-MM-DD-<slug>.md`. Manual only; no auto-emission.

## Operational wrappers

- **`gflow-triage-inbox`** — interactive inbox drain (see Lifecycle § Inbox Triage for rules). On-demand only.
- **`gflow-update-state`** — regenerates STATE.md from filesystem. Called by every phase wrapper as its last step and by the SessionStart hook. Idempotent.

## Defaults

- **Path override** flows through skill bodies as instructions to the invoked gflow workhorse skill.
- **Templates: pass-through.** Wrappers reference `templates/<artifact>.md` shape in their prompt to the underlying skill; no pre-writing skeletons.
- **Idempotency: hard-fail.** Re-invocation on a Slice past that phase errors out. Refinement uses `## Update: <date>` blocks.
- **Pre-condition enforcement: in-skill body, not hooks.** Escalate to hooks if drift becomes a problem.
- **Slice naming: auto-derived from description**, user can override at the prompt.

# Multi-Model Review

`gflow-review-slice` runs parallel reviewer subagents via `pi-subagents`, merges findings via an LLM, and presents them for user triage.

## Prerequisites

- `pi install npm:pi-subagents` must be installed.

## Architecture

```
gflow-review-slice (main thread; orchestrator + triage UX)
  1. Generate diff → .gflow/tmp/<slug>-diff.patch  (git diff main..HEAD)
  2. Build reviewer prompt (spec + plan + diff + format instructions)
  3. Dispatch in parallel via subagent({ tasks: [...], concurrency: 3 }):
       ├─ Reviewer 1 — correctness/security angle
       ├─ Reviewer 2 — tests/validation angle
       └─ Reviewer 3 — simplicity/maintainability angle
     Each reviewer gets fresh context and writes to .gflow/tmp/<slug>-review-<n>.md
  4. LLM-based merger (subagent): cluster by issue identity, normalize severity,
     attribute sources → docs/slices/<slug>/review.md
  5. Interactive user triage: per finding → fix / defer / accept / dismiss
  6. Regenerate STATE.md
```

## Rules

- **Use pi-subagents.** Fresh-context `reviewer` subagents with distinct angles. Not OS processes.
- **Default: 3 reviewers.** Configurable by adding/removing task entries in the `subagent({ tasks: [...] })` call.
- **Same prompt to all reviewers.** The angle (correctness, tests, simplicity) is in the task text, not a different prompt template.
- **Reviewer scope**: each reviewer gets the diff + `spec.md` + `plan.md` and may read the rest of the codebase. Diff is the focus, not the cage.
- **Output: Markdown** with strict headings per `templates/reviewer-output.md`. Easy for LLMs to write, merger reads natively.
- **Merger: LLM-based subagent.** Reads all reviews, clusters findings by issue identity, normalizes severity, attributes sources (e.g., "flagged by 2/3"). Output is one merged `review.md` sorted by severity.
- **Always runs unless user opts out.** Single-model fallback by reducing `tasks` array to one entry.
- **Triage routing**:
  - **Fix**: execute the fix in-flight (small) or queue as a Chore
  - **Defer**: log to `inbox/bugs.md` or `inbox/chores.md` based on finding type
  - **Accept**: mark in `review.md` as won't-fix with reason
  - **Dismiss**: false positive; annotate with `Disposition: dismiss` and a one-line reason in `review.md`

## Bash Orchestrator (removed)

The old bash-based multi-model review script has been removed. The `pi-subagents` approach is the only supported path.

# Extension Hooks

Minimal by design. Most gflow rules are skill-enforced; hooks cost real complexity (state, false positives, debug). v1 ships two hooks, both fast bash, no LLM calls.

## v1 hooks

| Event        | Handler                  | Purpose                                                                |
|--------------|--------------------------|------------------------------------------------------------------------|
| SessionStart | Extension `session_start` | Regenerate STATE.md from filesystem; catches drift from out-of-band edits |
| SessionStart | Extension `session_start` | Move completed-but-not-archived slices to `_archive/slices/`           |

Both hooks are implemented natively by the pi extension's `session_start` event handler (TypeScript, no bash).

## Deferred (v1.1+)

- **`## Update:` block enforcement** during Execute. PostToolUse hook on `plan.md` that detects task-structure changes (sidecar hash approach) and warns/blocks if no new Update block exists. Skill body educates the agent for v1; promote to hook if drift is observed.

## Why minimal

- **Pre-condition enforcement** is in-skill (each phase wrapper checks prior artifacts in step 1).
- **Archive moves** happen inside `gflow-complete-slice`; the reconcile hook is a safety net, not the primary path.
- **Branch enforcement** is in-skill (`gflow-plan-slice` step 1 verifies).
- **STATE regen during normal flow** is wrapper-driven (each phase calls `gflow-update-state` at the end); the SessionStart hook covers the out-of-band gap only.

# Templates

Pass-through philosophy (per Wrapper Skills § Defaults): templates describe shape, not pre-written skeletons. Wrappers tell the underlying skill "follow this shape" and the skill produces the content. Templates live in `templates/`.

## Inventory

| Artifact         | Path                            | Style                                                      |
|------------------|---------------------------------|------------------------------------------------------------|
| Slice spec       | `templates/spec.md`             | pass-through (frontmatter + body from brainstorming)       |
| Slice plan       | `templates/plan.md`             | pass-through (frontmatter + body from writing-plans)       |
| Slice review     | `templates/review.md`           | full custom (multi-model merge output)                     |
| Slice complete   | `templates/complete.md`         | full custom (brief wrap-up)                                |
| Epic charter     | `templates/epic.md`             | full custom                                                |
| Abandonment      | `templates/why.md`              | full custom (one-paragraph reason)                         |
| Decision (ADR)   | `templates/decision.md`         | full custom                                                |
| Reviewer output  | `templates/reviewer-output.md`  | full custom (strict; merger parses it)                     |
| Inbox seed files | `templates/inbox-<type>.md`     | initial empty file with usage comment                      |

Not templated (auto-generated): `STATE.md` (output of the `gflow_update_state` tool), `_archive/dismissed/<date>.md` (append-only log).

## Required frontmatter (minimum, all artifacts)

```yaml
---
slug: <slice-or-decision-or-epic-slug>
created: YYYY-MM-DD
summary: <one-line description; rendered by STATE.md>
---
```

No `updated_at` field — git history is the source of truth for activity timestamps (`git log -1 --format=%cI <path>`). Staleness is derivable from `created` + filesystem state.

## Per-artifact extras

- **spec.md / plan.md**: `epic` (optional)
- **review.md**: `reviewers`, `findings_count`, `severity_breakdown`
- **complete.md**: `branch`, `merged_date`
- **epic.md**: `status` (active | completed | superseded), `slices` (list)
- **why.md**: `slice` (abandoned slug), `replaced_by` (optional)
- **decision.md**: `title`, `status` (proposed | accepted | superseded), `supersedes` / `superseded_by` (optional)

## Reviewer output format (strict — merger depends on it)

See `templates/reviewer-output.md` for the canonical shape. In brief:

```markdown
# Review by <reviewer-name>

### Strengths
- <bullet>

### Issues

#### Critical
1. **<title>**
   - File: <path>:<line-or-range, or N/A>
   - Issue: <what is wrong and why>
   - Fix: <what to do>

#### Important
(same shape)

#### Minor
(same shape)

### Recommendations
- <bullet>

### Assessment
**Ready to merge?** Yes | No | With fixes
**Reasoning:** <1-2 sentences>
```

Strict H3/H4 heading structure lets the merger LLM cluster cleanly across reviewers (file + line + title becomes the dedup identity).

## Examples in templates

- **Brief examples** in `review.md`, `decision.md`, `reviewer-output.md` (formats with multiple structural pieces).
- **None** in `spec.md` / `plan.md` (let the gflow workhorse skill format dominate).

# Rules
- Always use a branch

## Plan
- User provides the description of the feature, system, component, etc they want implemented into their project.
- Use the gflow workhorse skills: `/skill:gflow-brainstorm` → spec → `/skill:gflow-write-plan` → plan

### Questions / Concerns / TBD
- How do we differentiate the planning large scope(whole project, major feature, new huge system) which should be planned at a macro scale, but then needs to be brought down to the micro scale for implementation.

## Execute
- Take a small scoped plan and execute its phases using `/skill:gflow-subagent-dev`
- Subagent development always

## Review
- Use `pi-subagents` to launch parallel `reviewer` subagents with distinct angles (correctness, tests/validation, simplicity/maintainability). Each gets fresh context and reads the diff directly.
- Each reviewer writes to `.gflow/tmp/<slug>-review-<n>.md` (ephemeral).
- A merger subagent reads all reviews, clusters by issue identity, normalizes severity, attributes sources → `docs/slices/<slug>/review.md`.
- Interactive user triage: fix / defer / accept / dismiss per finding.

## Complete
- Make sure docs are cleaned up, todos are marked complete, maybe some sort of post implementation note system(might be noise and unneeeded )
- Use `/skill:gflow-finish-branch` to guide merge/PR/keep/discard decisions

# Thoughts
- Use `templates/*.md` to define artifact shapes. Workhorse skills produce content that follows these shapes.
- Some tings might require us to create our own bash helper scripts, maybe node or something if we really need it but i'd like to avoid that.
