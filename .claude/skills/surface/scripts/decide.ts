/**
 * surface/scripts/decide.ts
 *
 * Pure, deterministic format decision engine.
 *
 * Given a set of signals describing the artifact and its consumer,
 * walks a policy of rules and returns the first matching format.
 *
 * No I/O. No side effects. No model calls. ~80 lines including types.
 */

// ---------- types ----------

export type Intent =
  | "spec" | "code-review" | "report" | "dashboard"
  | "mockup" | "scratchpad" | "doc" | "data-extract";

export type Consumer =
  | "human-once" | "human-archive"
  | "agent-next" | "agent-verify"
  | "rag-ingest";

export type Lifecycle = "ephemeral" | "versioned" | "published";
export type Size = "small" | "medium" | "large";
export type Content = "text-heavy" | "tabular" | "visual" | "interactive" | "mixed" | "structured";

export type Format = "markdown" | "html" | "html+svg" | "json" | "hybrid-md-html";

export interface Signals {
  intent?: Intent;
  consumer?: Consumer;
  lifecycle?: Lifecycle;
  size?: Size;
  content?: Content;
}

export interface Rule {
  name: string;
  match: Partial<Record<keyof Signals, string | string[] | "*">> | "*";
  decide: { format: Format; reason: string };
}

export interface Policy {
  version: number;
  rules: Rule[];
  prompts: Record<Format, string>;
}

export interface Decision {
  format: Format;
  promptPrefix: string;
  rationale: string;
  matchedRule: string;
}

// ---------- match logic ----------

function fieldMatches(signal: string | undefined, criterion: string | string[] | "*"): boolean {
  if (criterion === "*") return true;
  if (signal === undefined) return false;
  if (Array.isArray(criterion)) return criterion.includes(signal);
  return criterion === signal;
}

function ruleMatches(signals: Signals, rule: Rule): boolean {
  if (rule.match === "*") return true;
  for (const [field, criterion] of Object.entries(rule.match)) {
    const value = signals[field as keyof Signals];
    if (!fieldMatches(value, criterion as string | string[] | "*")) return false;
  }
  return true;
}

// ---------- core decide ----------

export function decide(signals: Signals, policy: Policy): Decision {
  for (const rule of policy.rules) {
    if (ruleMatches(signals, rule)) {
      const format = rule.decide.format;
      return {
        format,
        promptPrefix: policy.prompts[format] ?? "",
        rationale: rule.decide.reason,
        matchedRule: rule.name,
      };
    }
  }
  throw new Error(
    `surface.decide: no matching rule for signals ${JSON.stringify(signals)}. ` +
    `Add a fallback rule with match: "*" to your policy.`
  );
}

// ---------- optional helpers ----------

/**
 * Load a policy object from a YAML string.
 * Requires a YAML parser (e.g., js-yaml) — kept out of this file to
 * preserve zero-dependency core.
 *
 * Example:
 *   import yaml from "js-yaml";
 *   const policy = loadPolicy(yaml.load(fs.readFileSync("policy.yaml", "utf-8")));
 */
export function loadPolicy(parsed: unknown): Policy {
  // Trust-but-verify shape check.
  const p = parsed as Policy;
  if (!p || typeof p !== "object" || !Array.isArray(p.rules) || !p.prompts) {
    throw new Error("loadPolicy: input does not look like a valid Policy object.");
  }
  return p;
}
