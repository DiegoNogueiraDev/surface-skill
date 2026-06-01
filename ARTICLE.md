<!-- DRAFT — pending Diego's voice and final sign-off. Structure and claims are ready;
     swap in your tone, add a personal hook, and verify every link before publishing. -->

# Markdown is a report. HTML is an interface. So why do we still hardcode the format?

In May 2026, Thariq Shihipar (Anthropic, Claude Code) published *The Unreasonable
Effectiveness of HTML* and Andrej Karpathy picked it up on x.com. The thesis landed fast:
Markdown won the default-output-format race back when context windows were 8k tokens and
every character cost money. With 1M-token contexts and agents reading other agents' outputs,
that default is no longer obviously right. A 1000-line Markdown plan is a thing nobody reads;
a color-coded diff, a rendered mockup, or a sortable table is an *interface*, not a report.

The discussion was excellent. What didn't follow was a way to make the decision **systematic**.

Today, every developer still hand-writes "respond in Markdown" or "respond in HTML" at the end
of a prompt. No shared rationale. No validation. No audit trail. The single most consequential
formatting decision an agent makes — *what substrate does this output live in?* — is an ad-hoc
afterthought repeated in thousands of prompts.

`surface` is the missing policy layer.

## The idea in one paragraph

The right format is a function of **who reads the output next** and **what the content
fundamentally is**. A human skimming once wants something different from an agent in a pipeline,
a RAG store, or a grader. Tabular data wants a structured container; a layout wants vectors; a
diff wants color. `surface` encodes those signals into a small, declarative policy you can read,
version, test, and audit — and ships it as an Agent Skill so the decision happens automatically.

```
Markdown is a report.  HTML is an interface.  JSON is a payload.  SVG is a picture.
Pick the one that matches what the artifact will actually do.
```

## How it works

Five signals: **intent** (spec, code-review, report, dashboard, mockup, doc, data-extract,
scratchpad), **consumer** (human-once, human-archive, agent-next, agent-verify, rag-ingest),
**lifecycle**, **size**, **content** (text-heavy, tabular, visual, interactive, structured).

A declarative `policy.yaml` matches them top-to-bottom, first match wins:

| Intent | Consumer | Size | Content | → Format |
|--------|----------|------|---------|----------|
| code-review | human | any | any | **html** |
| spec | agent-next | any | any | **hybrid-md-html** |
| spec | human | large | any | **html** |
| report | rag-ingest | any | text | **markdown** |
| data-extract | agent | any | any | **json** |
| data-extract | human | any | any | **markdown** |
| mockup | any | any | any | **html+svg** |
| *(fallback)* | | | | **markdown** |

No ML. No framework. One YAML file you edit. The same rules run three ways: as the Skill the
agent reads, as pure TypeScript functions (`decide()` / `validate()`), and as the source of an
auditable decision (`matchedRule` + `rationale` come back with every call).

## It's tested, not asserted

A policy nobody checks is just opinion. `surface` ships an evidence harness:

```bash
npm install && npm test
# Part A — routing:   decide() over canonical cases → 12/12
# Part B — artifacts: validators over the example gallery → 6/6
```

It exits non-zero on failure (flip one expectation and watch it fail). And the matrix was
hardened the honest way: independent adversarial agents tried to *refute* every route across 24
edge cases. They found six real misroutes — e.g. extracted data for a *human* shouldn't be raw
JSON, an agent consuming dashboard data shouldn't get prose, `doc` had no rule at all — and each
became a fix in v0.2, guarded by a regression case. The write-up is in `ITERATION-LOG.md`.

## See it

The gallery renders one artifact per format — a code review with color-coded severity, three
SVG mockups side by side, a JSON extraction, a RAG-ready Markdown digest, a hybrid spec with an
embedded data-flow diagram: [`examples/index.html`](./examples/index.html).

## What it is not

`surface` doesn't convert between formats (use Turndown/markdownify), enforce schemas at decode
time (use Instructor/Outlines), or route between models (use an LLM router). It decides *what
format the output should be in*, and composes with all of them.

## Try it

```bash
git clone https://github.com/DiegoNogueiraDev/surface-skill ~/.skills/surface
```

The agent reads `SKILL.md` and applies the policy when it generates substantive artifacts.
Zero code on your end. Fork `policy.yaml` to encode your team's conventions.

---

*Built on the thesis from [Thariq Shihipar](https://x.com/trq212) (Anthropic) and
[Andrej Karpathy](https://x.com/karpathy). `surface` turns that thesis into a policy you can
run. MIT-licensed: https://github.com/DiegoNogueiraDev/surface-skill*
