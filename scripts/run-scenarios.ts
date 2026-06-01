/**
 * scripts/run-scenarios.ts
 *
 * Exploratory breadth run (not a pass/fail test). Runs decide() over the broad,
 * edge-heavy set in scenarios.json and prints the route + matched rule + rationale
 * for each. Output feeds the independent adversarial review (see ITERATION-LOG.md).
 *
 * Run: npm run scenarios   (or: npx tsx scripts/run-scenarios.ts)
 * Add --json for machine-readable output.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";

import { decide, loadPolicy, type Signals } from "./decide";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const policy = loadPolicy(yaml.load(readFileSync(join(root, "policy.yaml"), "utf-8")));

interface Scenario {
  id: string;
  prompt: string;
  signals: Signals;
  note?: string;
}
const { scenarios } = JSON.parse(readFileSync(join(root, "scenarios.json"), "utf-8")) as {
  scenarios: Scenario[];
};

const asJson = process.argv.includes("--json");
const results = scenarios.map((s) => {
  const d = decide(s.signals, policy);
  return {
    id: s.id,
    prompt: s.prompt,
    signals: s.signals,
    format: d.format,
    matchedRule: d.matchedRule,
    rationale: d.rationale,
    note: s.note ?? "",
  };
});

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    console.log(`\n${r.id}  →  \x1b[1m${r.format}\x1b[0m  (rule: ${r.matchedRule})`);
    console.log(`  prompt: ${r.prompt}`);
    console.log(`  signals: ${JSON.stringify(r.signals)}`);
    if (r.note) console.log(`  note: ${r.note}`);
  }
  console.log(`\n${results.length} scenarios routed.\n`);
}
