/**
 * surface/scripts/prompts.ts
 *
 * Canonical prompt prefixes per format. Internalized by the agent
 * during generation — never pasted into user-facing output.
 *
 * Kept as a typed export for programmatic consumers (npm package, MCP server).
 */

import type { Format } from "./decide";

export const PROMPT_PREFIXES: Record<Format, string> = {
  markdown: `Generate clean GitHub-flavored Markdown.
Use ATX headings (#, ##, ###).
Fenced code blocks with language tags.
Tables for tabular data.
No HTML tags unless explicitly required.
Prefer concise prose over walls of bullets.`,

  html: `Generate a single self-contained HTML5 document.
Inline <style> only — no external stylesheets, no external scripts.
Semantic tags: <table>, <details>, <figure>, <article>, <section>.
Inline <svg> for any vector graphic.
No JavaScript unless the consumer is interactive.
Optimize for one-shot rendering in a browser tab.`,

  "html+svg": `Like html, but every visual element is inline <svg>.
Use viewBox for scaling.
Annotate with <title> and <desc> for accessibility.
Vector over raster, always.`,

  json: `Output a single JSON object.
No prose before or after. No markdown fences. No comments.
Top-level fields only — metadata, payload, version.`,

  "hybrid-md-html": `Markdown as the primary surface.
Embed self-contained HTML blocks where information density demands it
(mockups, diagrams, comparison tables with styling).
Each HTML block must be valid in isolation.
Render correctly in MD viewers that support raw HTML (GitHub, Obsidian).`,
};

export function getPromptPrefix(format: Format): string {
  return PROMPT_PREFIXES[format] ?? "";
}
