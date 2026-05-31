# surface

**Output format policy for AI agents.**

`surface` is a deterministic, declarative policy that decides which output format (HTML, Markdown, JSON, SVG, hybrid) an agent should generate, based on five signals: intent, consumer, lifecycle, size, content type.

No ML. No framework. One YAML file you can edit. MIT.

## Why this exists

In May 2026, Anthropic's **Thariq Shihipar** ([@trq212](https://x.com/trq212)) argued *The Unreasonable Effectiveness of HTML* for AI agents, and **Andrej Karpathy** ([@karpathy](https://x.com/karpathy)) picked up the thread on x.com (see [Sources](#sources--inspiration)). The thesis: Markdown won the default-output-format race back when context windows were 8k tokens and every character cost money — but with 1M-token contexts and agents reading other agents' outputs, the right format is now a function of *what the output is for*.

That discussion stayed a heuristic. Today every developer still hand-writes "respond in markdown" or "respond in HTML" in prompts, with no shared rationale, no validation, no audit trail.

**`surface` is the policy layer that automates that decision** — it turns the format choice discussed by Thariq and Karpathy into something you can read, version, test, and audit.

## What this is *not*

`surface` does not:

- Convert between formats. Use [Turndown](https://github.com/mixmark-io/turndown), [markdownify](https://github.com/zcaceres/markdownify-mcp), or [html2md-mcp](https://github.com/sunshad0w/html2md-mcp).
- Enforce schemas at decode time. Use [Instructor](https://github.com/jxnl/instructor), [LM Format Enforcer](https://github.com/noamgat/lm-format-enforcer), or [Outlines](https://github.com/outlines-dev/outlines).
- Route between models. Use [LLMRouter](https://github.com/ulab-uiuc/LLMRouter) or similar.

It decides *what format the output should be in*. Composes with everything above.

## How to use it

### As an Agent Skill (the working path today)

Drop this repo into your agent's skills directory:

```bash
# Claude Code, Cursor, ChatGPT, Codex CLI, Gemini CLI, Junie, Kiro, Goose...
git clone https://github.com/DiegoNogueiraDev/surface-skill ~/.skills/surface
```

The agent reads [`SKILL.md`](./SKILL.md) and applies the policy automatically when it generates substantive artifacts. Zero code on your end.

### As TypeScript functions (optional)

The decision and validation logic live as plain, dependency-free functions in [`scripts/`](./scripts):

```ts
import { decide } from "./scripts/decide";
import { validate } from "./scripts/validate";
// load policy.yaml with your YAML parser of choice, then:

const { format, promptPrefix } = decide(signals, policy);
const check = validate(response, format);
if (!check.ok) console.warn(check.errors);
```

## The decision matrix

| Intent | Consumer | Size | Content | → Format |
|--------|----------|------|---------|----------|
| code-review | human | any | any | **html** |
| dashboard | human | any | any | **html** |
| mockup | human | any | any | **html+svg** |
| spec | agent-next | any | any | **hybrid-md-html** |
| spec | human | large | any | **html** |
| spec | human | small/med | any | **markdown** |
| report | human | large | tabular/visual | **html** |
| report | human | large | text-heavy | **markdown** |
| report | human | small/med | any | **markdown** |
| data-extract | any | any | any | **json** |
| any | rag-ingest | any | any | **markdown** |
| any | agent-verify | any | visual/interactive | **html** |
| any | agent-verify | any | tabular/structured | **json** |
| scratchpad | any | any | any | **markdown** |
| *(fallback)* | | | | **markdown** |

Source of truth: [`policy.yaml`](./policy.yaml). Edit there.

## Customizing the policy

Copy `policy.yaml`, edit rules, point your code at the new file. Rules match top to bottom; first match wins. Add a wildcard rule at the bottom as fallback.

```yaml
rules:
  - name: "Our team always wants HTML for specs"
    match:
      intent: spec
    decide:
      format: html
      reason: "Internal standard, decided 2026-Q2."
```

## Project layout

```
surface-skill/
├── SKILL.md          # Agent Skill instructions (canonical entry for skill consumers)
├── policy.yaml       # Decision rules (source of truth)
├── evals.json        # Canonical test cases (input → expected format)
├── ITERATION-LOG.md  # Closed-validation diary
├── README.md         # This file
├── LICENSE           # MIT
└── scripts/
    ├── decide.ts     # Pure decision function (~80 lines)
    ├── validate.ts   # Per-format validators
    └── prompts.ts    # Canonical prompt prefixes
```

## Status

**v0.1 — draft, in closed validation.** The Skill and the TypeScript functions work today. The skill is being exercised in real conversations before any public launch — see [`ITERATION-LOG.md`](./ITERATION-LOG.md).

### Roadmap (not built yet)

- **npm package** — `import { decide, validate } from "surface"` without a local clone.
- **MCP server** — expose `decide` / `validate` as MCP tools for any MCP-compatible agent.
- **CLI** — `npx surface decide --intent=spec --consumer=agent-next --size=large`.
- **Telemetry** and publication to `skills.sh`.

## Sources & inspiration

The thesis isn't original to this repo — `surface` operationalizes it. Grounding:

- **Thariq Shihipar** ([@trq212](https://x.com/trq212)) — *Using Claude Code: The Unreasonable Effectiveness of HTML* (Anthropic, May 8, 2026): [claude.com/blog](https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html). Companion site with 20 HTML artifacts: [thariqs.github.io/html-effectiveness](https://thariqs.github.io/html-effectiveness/).
- **Andrej Karpathy** ([@karpathy](https://x.com/karpathy)) — independent endorsement on x.com, framing the progression *text → markdown → HTML → interactive*: [the post](https://x.com/karpathy/status/2053872850101285137).
- Simon Willison's writeup of the discussion: [simonwillison.net](https://simonwillison.net/2026/May/8/unreasonable-effectiveness-of-html/).
- The nuance `surface` is built on — *"Markdown for agents, HTML for humans"*: the right format depends on **who reads it next**. That's exactly what the policy encodes.
- Packaging philosophy: nanoGPT, micrograd, llm.c — one repo, one thesis, read it in 5 minutes.

## License

MIT — see [`LICENSE`](./LICENSE).
