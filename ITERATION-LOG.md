# surface — validation log

> **Two kinds of validation live here.**
> **(1) Adversarial breadth validation — agent-run (done below).** Independent skeptic
> agents tried to *refute* every routing decision across 24 diverse/edge prompts. This
> proves the matrix's *coverage* and surfaced real gaps. It is **not** human-usage telemetry.
> **(2) Human usage signal — Diego only (pending).** Does the skill trigger naturally in
> real chats, and are the generated artifacts subjectively good? Only ~10 real conversations
> answer that. The table at the bottom is for those.

---

## (1) Adversarial breadth validation — 2026-05-31

**Method.** 24 edge-heavy scenarios (`scenarios.json`) → routed with `npm run scenarios`
→ two independent adversarial reviewer agents instructed to *refute* each route (default to
skepticism, only concede if no real case exists). Findings triaged against the policy's own
stated principle: *"pick by who reads it next and what the content fundamentally is."*

**Outcome.** 6 genuine misroutes/gaps found and fixed in `policy.yaml` (v0.1 → v0.2). All
fixes are guarded by new cases in `evals.json` (`npm test` now 12/12). Debatable findings
that align with the source thesis were kept and documented.

### Findings & fixes (acted on)

| # | Scenario | v0.1 route | Problem (adversary) | v0.2 fix | New route |
|---|----------|-----------|---------------------|----------|-----------|
| 1 | data-extract for a human (`s12`) | json | Rule was consumer-blind; a human saving extracted data wants a readable table, not raw JSON — violates the policy's own "who reads it next". | Added **"Data extraction for humans → Markdown"** before the JSON rule. | markdown |
| 2 | dashboard data for an agent (`s20`) | markdown (fallback) | `dashboard` rule required `human-*`; an agent consuming tabular alert data fell through to prose. | Added **"Structured handoff to agents → JSON"** before fallback. | json |
| 3 | code-review findings to auto-fix agent (`s22`) | markdown (fallback) | Same gate bug; an auto-fix agent needs structured findings. | Same new rule (#2). | json |
| 4 | `doc` runbook (`s19`) | markdown (fallback) | `intent=doc` had **no rule** — reached markdown by accident, not design. | Added **"Rich doc for humans → hybrid"** + **"Doc for humans → Markdown"**. | hybrid-md-html |
| 5 | RAG ingest of visual notes (`s14`) | markdown | `rag-ingest` rule swallowed the `visual` content signal → diagrams dropped (lossy). | Added **"RAG ingest with visuals → hybrid"** before the markdown rag rule. | hybrid-md-html |
| 6 | mockup for a vision agent (`s23`) | html | `mockup → html+svg` was gated on `human-*`; lost the SVG specialization to rule ordering. | Made **"Mockup → HTML+SVG"** consumer-independent. | html+svg |

Root cause of #2/#3/#4: intent rules gated on `human-*` had no agent-facing counterpart, so
machine consumers silently defaulted to markdown — the worst format for machine consumption.

### Considered but kept (with rationale)

- **Large human spec → HTML** (`s01`) and **spec for agent → hybrid** (`s03`): a reviewer argued
  length ≠ interface. Kept — this *is* Thariq's thesis (a 1000-line Markdown spec is unread), and
  hybrid gives the next agent MD + renderable islands. Source-aligned, deliberate.
- **Code-review for humans → HTML** (`s07`): argued over-broad. Kept — it's the central thesis
  example (color-coded diffs, inline annotations).
- **Inferred-signal confidence** (`s10`, `s21`, e.g. bare "give me a plan"): real point, but it's
  handled at the skill layer — `SKILL.md` already says to ask one clarifying question when a key
  signal (consumer/lifecycle) is genuinely ambiguous. No policy change needed.
- **Agent prose → markdown** (`s17`, agent-verify + text-heavy): reaches markdown via fallback;
  kept intentionally — "markdown for agents" is the cited nuance for prose between agents.

---

## (2) Human usage signal — pending (Diego)

Run the skill in 10–15 real conversations and record below. This is the gate the agent run
**cannot** satisfy.

| #  | Date | Prompt (short) | Triggered? | Format chosen | Felt right? | OK/Fix | Note |
|----|------|----------------|------------|---------------|-------------|--------|------|
| 1  |      |                |            |               |             |        |      |
| 2  |      |                |            |               |             |        |      |
| 3  |      |                |            |               |             |        |      |
| 4  |      |                |            |               |             |        |      |
| 5  |      |                |            |               |             |        |      |
| 6  |      |                |            |               |             |        |      |
| 7  |      |                |            |               |             |        |      |
| 8  |      |                |            |               |             |        |      |
| 9  |      |                |            |               |             |        |      |
| 10 |      |                |            |               |             |        |      |

## Decision after validation

- [ ] Matrix reliable on common + edge cases (agent breadth: ✅ done) **and** in real use (human: pending) → proceed toward launch.
- [ ] Needs more iteration.
- [ ] Reframe as article + published skill without an actively maintained repo.
