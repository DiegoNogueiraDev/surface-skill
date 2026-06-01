/**
 * scripts/sync-skill.mjs
 *
 * The repo root IS the canonical `surface` skill. But Claude Code only discovers
 * project skills under `.claude/skills/<name>/`. To make the skill active for
 * anyone who clones this repo — on any OS, without relying on symlinks — we keep
 * a PORTABLE COPY in .claude/skills/surface/ and regenerate it from root here.
 *
 * Root is the source of truth. Run `npm run sync:skill` after editing SKILL.md,
 * policy.yaml, or the referenced scripts, so the project-skill copy doesn't drift.
 *
 * Run: npm run sync:skill
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, copyFileSync, rmSync, existsSync, lstatSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, ".claude", "skills", "surface");

// Files the skill needs at runtime (SKILL.md references these).
const files = [
  "SKILL.md",
  "policy.yaml",
  "README.md",
  "scripts/decide.ts",
  "scripts/validate.ts",
  "scripts/prompts.ts",
];

// Start clean: if dest exists (e.g. old symlinks from local setup), remove it.
if (existsSync(dest) || (() => { try { return lstatSync(dest); } catch { return false; } })()) {
  rmSync(dest, { recursive: true, force: true });
}
mkdirSync(join(dest, "scripts"), { recursive: true });

for (const f of files) {
  copyFileSync(join(root, f), join(dest, f));
  console.log(`copied  ${f}`);
}
console.log(`\nSynced surface → .claude/skills/surface (${files.length} files).`);
