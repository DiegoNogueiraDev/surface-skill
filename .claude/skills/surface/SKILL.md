---
name: surface
description: Decide which output format (HTML, Markdown, JSON, SVG, hybrid) an agent should generate based on the task's intent, consumer, lifecycle, size, and content type. Use this skill whenever the user asks for a report, spec, code review, dashboard, summary, plan, doc, data extraction, or any deliverable where the format choice is implicit — even when they don't explicitly ask "what format should I use?". Apply this skill before generating any substantive artifact (>20 lines) to avoid defaulting to Markdown when HTML, JSON, or a hybrid would serve the consumer better.
---

# surface

**Output format policy for AI agents.**

> Operationalizes the thesis from Thariq Shihipar's *The Unreasonable Effectiveness of HTML* and the Thariq ↔ Karpathy discussion on x.com. See README → Sources.

Markdown won as the default AI output format in 2023, when context windows were 8k tokens and every character cost real money. That world is gone. Context windows are 1M+, agents pass artifacts to other agents, and a 200-line Markdown report is a thing nobody reads.

The right format is now a function of *what the output is for* — who reads it, when, and what they'll do with it. This skill turns that decision into something explicit, deterministic, and auditable.

## When to apply this skill

Apply whenever you're about to generate a substantive artifact (more than ~20 lines, or anything the user will save, share, or pass to another tool). Signals that this skill is relevant:

- The user asks for a "report", "spec", "plan", "review", "summary", "doc", "dashboard", "mockup", "extraction", or "comparison".
- The output will be read later, by someone other than the user-in-this-conversation.
- The output is going to feed another LLM call, RAG pipeline, or verification agent.
- The user mentioned "save this", "create a file", "send to my team", "for our records".

Skip this skill for short conversational replies, single-paragraph answers, or quick clarifications. Format policy is overkill there.

## Core principle

Two factors collapse the decision:

1. **Who reads it next** — human (once / archive) vs. agent (next-step / verifier) vs. RAG ingest.
2. **What the content fundamentally is** — text, tabular, visual, interactive, structured-data.

Markdown is a *report*. HTML is an *interface*. Reports are for reading once. Interfaces are for using. JSON is for passing. Pick the substrate that matches what the artifact will actually do.

## The decision matrix

Match the most specific rule first. Stop at the first match.

| # | Intent | Consumer | Size | Content | → Format |
|---|--------|----------|------|---------|----------|
| 1 | `code-review` | human-* | any | any | **html** |
| 2 | `dashboard` | human-* | any | any | **html** |
| 3 | `mockup` | human-* | any | any | **html+svg** |
| 4 | `spec` | agent-next | any | any | **hybrid-md-html** |
| 5 | `spec` | human-* | large | any | **html** |
| 6 | `spec` | human-* | small/medium | any | **markdown** |
| 7 | `report` | human-* | large | tabular/visual/mixed | **html** |
| 8 | `report` | human-* | large | text-heavy | **markdown** |
| 9 | `report` | human-* | small/medium | any | **markdown** |
| 10 | `data-extract` | any | any | any | **json** |
| 11 | any | `rag-ingest` | any | any | **markdown** |
| 12 | any | `agent-verify` | any | visual/interactive | **html** |
| 13 | any | `agent-verify` | any | tabular/structured | **json** |
| 14 | `scratchpad` | any | any | any | **markdown** |
| 15 | any | any | any | any | **markdown** *(fallback)* |

The same matrix lives machine-readable in `policy.yaml`. The YAML is the source of truth; this table is the human-readable mirror.

## Signal definitions

When inferring signals from the user's request, use these working definitions:

**intent** — what kind of artifact this is, regardless of subject matter:
- `spec` — defines what should be built (PRD, design spec, architecture)
- `code-review` — analyzes existing code with findings, severity, diffs
- `report` — communicates findings or status of something already done
- `dashboard` — multi-metric, multi-view display optimized for scanning
- `mockup` — visual prototype of an interface or layout
- `scratchpad` — exploratory, throwaway, low-fidelity
- `doc` — durable reference material (API docs, runbooks, guides)
- `data-extract` — structured pull from unstructured input

**consumer** — who or what will read this next:
- `human-once` — read once and discarded or skimmed (most chat outputs)
- `human-archive` — saved and revisited (specs, decisions, references)
- `agent-next` — feeds the next step of a multi-agent pipeline
- `agent-verify` — read by a checker/grader/validator agent
- `rag-ingest` — chunked and embedded into a retrieval system

**lifecycle** — `ephemeral` | `versioned` | `published`. Versioned and published artifacts justify the extra cost of richer formats.

**size** — `small` (<100 lines) | `medium` (100–1000) | `large` (>1000).

**content** — `text-heavy` | `tabular` | `visual` | `interactive` | `mixed`. "Visual" means the content fundamentally needs diagrams, mockups, or color encoding to communicate (e.g., a diff, a chart, a layout). "Interactive" means the consumer benefits from controls (sliders, collapsibles, filters).

## How to apply the skill

1. **Infer signals.** From the user's request, infer intent, consumer, lifecycle, size, and content. When ambiguous, ask one short clarifying question — but only one, and only for the most ambiguous signal. Default to reasonable assumptions otherwise.

2. **Look up the decision.** Walk the matrix top to bottom. First match wins. Mention the format choice and one-line rationale in your reply ("Going with HTML since this is a code review for a human consumer").

3. **Apply the prompt prefix.** Each format has a canonical instruction set (see below). Use it as your internal generation guideline. Don't paste it back at the user.

4. **Generate the artifact** in the chosen format.

5. **Validate** by reading back through your output once before finalizing. Quick checks: HTML tags balanced, JSON parses, Markdown headings monotonic.

If `scripts/decide.ts` is available in the environment (e.g., when the skill is installed alongside a Node.js runtime), prefer calling it for deterministic decision-making instead of walking the matrix manually. The script encodes the same rules and adds telemetry.

## Format prompt prefixes (internalize, do not paste)

**markdown**
Generate clean GitHub-flavored Markdown. Use ATX headings (`#`, `##`). Fenced code blocks with language tags. Tables for tabular data. No HTML tags unless explicitly needed. Prefer concise prose over walls of bullets.

**html**
Generate a single self-contained HTML5 document. Inline `<style>` only — no external stylesheets, no external scripts. Use semantic tags: `<table>` for tabular data, `<details>` for collapsibles, `<figure>` for diagrams. Inline `<svg>` for any vector graphic. No JavaScript unless the consumer is interactive. Optimize for one-shot rendering in a browser tab.

**html+svg**
Like `html`, but every visual element must be inline `<svg>`. Use `viewBox` for scaling. Annotate SVG elements with `<title>` and `<desc>` for accessibility. Prefer vector over any raster mention.

**json**
Output a single JSON object. No prose before or after. No Markdown fences around it. No comments. If the consumer needs metadata, include it as a top-level field, not as text.

**hybrid-md-html**
Generate Markdown as the primary surface. When information density requires it (mockups, diagrams, comparison tables with styling), embed self-contained HTML blocks. Each HTML block must be valid in isolation and render correctly in a Markdown viewer that supports raw HTML (GitHub, Obsidian).

## Examples

### Example 1
**Input:** "Review this PR and tell me what's wrong with the streaming logic."
**Inferred signals:** intent=`code-review`, consumer=`human-once`, size=`medium`, content=`mixed`
**Matched rule:** #1
**Format:** `html`
**Why:** Code reviews benefit from color-coded severity, inline annotations, and diff rendering — none of which Markdown does well.

### Example 2
**Input:** "Draft a PRD for our new payments service. The architect agent will pick this up next."
**Inferred signals:** intent=`spec`, consumer=`agent-next`, size=`large`, content=`mixed`
**Matched rule:** #4
**Format:** `hybrid-md-html`
**Why:** The architect agent reads Markdown more reliably, but embedded HTML islands let you include mockups, decision tables, and data-flow diagrams without losing structure.

### Example 3
**Input:** "Summarize these 50 customer support tickets so we can feed them into our RAG store."
**Inferred signals:** intent=`report`, consumer=`rag-ingest`, size=`medium`, content=`text-heavy`
**Matched rule:** #11
**Format:** `markdown`
**Why:** RAG chunking works best on clean Markdown. Token efficiency matters when this content will be re-embedded and re-queried hundreds of times.

### Example 4
**Input:** "Extract the line items from this invoice."
**Inferred signals:** intent=`data-extract`, consumer=`agent-next`, content=`tabular`
**Matched rule:** #10
**Format:** `json`
**Why:** Structured data is structured. JSON parses; Markdown tables don't.

### Example 5
**Input:** "Show me three layout options for the empty state of our new dashboard."
**Inferred signals:** intent=`mockup`, consumer=`human-once`, content=`visual`
**Matched rule:** #3
**Format:** `html+svg`
**Why:** Layouts are spatial. Spatial relationships need vector graphics. SVG inline lets the user actually see the proposed layouts side by side.

### Example 6
**Input:** "Write a quick summary of our standup."
**Inferred signals:** intent=`scratchpad`, consumer=`human-once`, size=`small`
**Matched rule:** #14
**Format:** `markdown`
**Why:** Ephemeral, short, conversational. Markdown is the right tool. Going to HTML here would be overkill.

## When ambiguity is real

Some signals genuinely aren't inferrable from the prompt. The two that matter most:

- **consumer** — if the user says "give me a plan," who reads it next? Ask: "Will another agent or pipeline read this, or is it for you?"
- **lifecycle** — if the user says "create a doc," is it published anywhere? Ask: "Is this for one-time use, or saving somewhere?"

Don't ask about `intent`, `size`, or `content` — those are almost always inferrable from the request. One clarifying question, max.

## Non-goals

This skill does not:

- Generate the artifact for you — it tells you *which format* to generate in. The generation itself uses your standard capabilities.
- Convert between formats. Use a converter (Turndown, markdownify, html2md) for that.
- Enforce schemas at decode time. Use Instructor, LM Format Enforcer, or Outlines for JSON schema enforcement.
- Route between models. Use LLMRouter or similar for that.

## Bundled resources

- `policy.yaml` — the decision rules in declarative form. Edit this to customize the matrix for your context. The skill respects whatever is in `policy.yaml` over the table in this file.
- `scripts/decide.ts` — pure function `decide(signals)` returning `{format, promptPrefix, validator, rationale}`. Use when running in a Node.js context for deterministic, auditable decisions.
- `scripts/validate.ts` — format validators. Each returns `{ok, warnings, errors}`.
- `scripts/prompts.ts` — canonical prompt prefixes per format.
- `README.md` — repo landing page for non-skill consumers (npm package, MCP server).

## One-line summary

Markdown is a report. HTML is an interface. JSON is a payload. SVG is a picture. Pick the one that matches what the artifact will actually *do*, not what's easiest to type.
