/**
 * scripts/run-evals.ts
 *
 * Evidence harness for `surface`. Two parts, one command (`npm test`):
 *
 *   Part A — routing:   run decide() over evals.json, assert the chosen
 *                       format (and matchedRule, when given) matches expect.
 *   Part B — artifacts: run validate() over every file in examples/, assert
 *                       each one is well-formed for its declared format.
 *
 * Exits non-zero if anything fails, so it doubles as a CI-style gate.
 * Reuses decide/loadPolicy/validate — no decision logic re-implemented here.
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import yaml from "js-yaml";

import { decide, loadPolicy, type Signals, type Format } from "./decide";
import { validate } from "./validate";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ---------- tiny console helpers ----------
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const PASS = green("PASS");
const FAIL = red("FAIL");

// ---------- load policy + evals ----------
const policy = loadPolicy(yaml.load(readFileSync(join(root, "policy.yaml"), "utf-8")));

interface EvalCase {
  id: string;
  prompt: string;
  signals: Signals;
  expect: { format: Format; matchedRule?: string };
}
const evals = JSON.parse(readFileSync(join(root, "evals.json"), "utf-8")) as {
  cases: EvalCase[];
};

// ---------- Part A: routing ----------
console.log(bold("\nPart A — routing (decide() vs evals.json)\n"));
let aPass = 0;
const aFail: string[] = [];
const colW = Math.max(...evals.cases.map((c) => c.id.length), 4);

for (const c of evals.cases) {
  const d = decide(c.signals, policy);
  const formatOk = d.format === c.expect.format;
  const ruleOk = c.expect.matchedRule ? d.matchedRule === c.expect.matchedRule : true;
  const ok = formatOk && ruleOk;
  if (ok) aPass++;
  else aFail.push(c.id);
  const detail = ok
    ? d.format
    : `${red(d.format)} (expected ${c.expect.format}${
        c.expect.matchedRule && !ruleOk ? `, rule "${d.matchedRule}" != "${c.expect.matchedRule}"` : ""
      })`;
  console.log(`  ${ok ? PASS : FAIL}  ${c.id.padEnd(colW)}  → ${detail}`);
}
console.log(`\n  Part A: ${aPass}/${evals.cases.length} routing cases passed.`);

// ---------- Part B: artifact validators ----------
const extToFormat: Record<string, Format | undefined> = {
  ".html": "html",
  ".json": "json",
  // .md handled below (markdown vs hybrid) by filename hint
};
function formatForFile(name: string): Format {
  const ext = extname(name);
  if (ext === ".md") return name.includes("spec") ? "hybrid-md-html" : "markdown";
  if (name.includes("mockup")) return "html+svg";
  return extToFormat[ext] ?? "markdown";
}

console.log(bold("\nPart B — artifacts (validate() over examples/)\n"));
let bPass = 0;
let bTotal = 0;
const bFail: string[] = [];
let exampleFiles: string[] = [];
try {
  exampleFiles = readdirSync(join(root, "examples"))
    .filter((f) => /\.(html|md|json)$/.test(f) && f !== "index.html")
    .sort();
} catch {
  console.log(red("  examples/ not found — skipping Part B"));
}
const bColW = Math.max(...exampleFiles.map((f) => f.length), 4);
for (const f of exampleFiles) {
  bTotal++;
  const fmt = formatForFile(f);
  const content = readFileSync(join(root, "examples", f), "utf-8");
  const r = validate(content, fmt);
  if (r.ok) bPass++;
  else bFail.push(`${f}: ${r.errors.join("; ")}`);
  console.log(`  ${r.ok ? PASS : FAIL}  ${f.padEnd(bColW)}  [${fmt}]${r.ok ? "" : "  " + red(r.errors.join("; "))}`);
}
console.log(`\n  Part B: ${bPass}/${bTotal} artifacts well-formed.`);

// ---------- summary + exit ----------
const failures = aFail.length + bFail.length;
console.log(bold(`\nSummary: A ${aPass}/${evals.cases.length}, B ${bPass}/${bTotal} — ${failures === 0 ? green("ALL GREEN") : red(failures + " FAILED")}\n`));
process.exit(failures === 0 ? 0 : 1);
