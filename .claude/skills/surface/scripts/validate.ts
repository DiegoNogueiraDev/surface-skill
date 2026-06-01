/**
 * surface/scripts/validate.ts
 *
 * Format validators. Each returns a ValidationResult.
 *
 * Validators are advisory by default. Pass { strict: true } to
 * surface errors as throws instead of return values.
 *
 * No external deps. Lightweight checks designed to run in <100ms.
 */

import type { Format } from "./decide";

export interface ValidationResult {
  ok: boolean;
  warnings: string[];
  errors: string[];
}

export interface ValidateOptions {
  strict?: boolean;
}

// ---------- per-format validators ----------

export function validateMarkdown(output: string): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Monotonic heading levels (no jumping from # to ###).
  const headings = [...output.matchAll(/^(#{1,6})\s/gm)].map((m) => m[1].length);
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      warnings.push(`heading level jumps from h${headings[i - 1]} to h${headings[i]}`);
    }
  }

  // Unclosed code fences.
  const fenceCount = (output.match(/^```/gm) ?? []).length;
  if (fenceCount % 2 !== 0) errors.push("unclosed fenced code block");

  // Raw HTML tag detection (warning only — sometimes legitimate).
  if (/<[a-zA-Z][^>]*>/.test(output) && !/<!--/.test(output)) {
    warnings.push("contains raw HTML — consider hybrid-md-html if intentional");
  }

  return { ok: errors.length === 0, warnings, errors };
}

export function validateHTML(output: string): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Must look like HTML.
  if (!/<html[\s>]/i.test(output) && !/<!doctype/i.test(output)) {
    warnings.push("missing <!doctype> or <html> — output may be a fragment");
  }

  // Balanced tag check (naive — counts opens vs closes for common tags).
  const opens = (output.match(/<([a-zA-Z]+)(\s[^>]*)?>/g) ?? []).length;
  const closes = (output.match(/<\/[a-zA-Z]+>/g) ?? []).length;
  const selfClose = (output.match(/<[a-zA-Z]+[^>]*\/>/g) ?? []).length;
  const voidTags = (output.match(/<(br|hr|img|input|meta|link|area|base|col|embed|source|track|wbr)\b[^>]*>/gi) ?? []).length;
  const expectedCloses = opens - selfClose - voidTags;
  if (closes < expectedCloses - 2) {
    errors.push(`tag imbalance: ~${expectedCloses} opens vs ${closes} closes`);
  }

  // External resources — usually a policy violation.
  if (/<link\s+[^>]*href=["']https?:/i.test(output)) {
    warnings.push("external stylesheet detected — policy prefers inline <style>");
  }
  if (/<script\s+[^>]*src=["']https?:/i.test(output)) {
    errors.push("external script detected — not allowed in self-contained HTML");
  }

  return { ok: errors.length === 0, warnings, errors };
}

export function validateHTMLSVG(output: string): ValidationResult {
  const base = validateHTML(output);
  const warnings = [...base.warnings];
  const errors = [...base.errors];

  if (!/<svg[\s>]/i.test(output)) {
    errors.push("html+svg format requires at least one inline <svg> element");
  } else if (!/<svg[^>]*viewBox=/i.test(output)) {
    warnings.push("<svg> missing viewBox — scaling may break");
  }

  return { ok: errors.length === 0, warnings, errors };
}

export function validateJSON(output: string): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Strip common pollution.
  const trimmed = output.trim();
  if (trimmed.startsWith("```")) {
    errors.push("JSON output wrapped in markdown code fence — strip the fence");
  }

  try {
    JSON.parse(trimmed);
  } catch (e) {
    errors.push(`JSON.parse failed: ${(e as Error).message}`);
  }

  return { ok: errors.length === 0, warnings, errors };
}

export function validateHybrid(output: string): ValidationResult {
  // Hybrid is valid if the MD wrapper is valid and any embedded HTML
  // blocks parse independently. We check the MD first, then look for
  // raw HTML blocks and validate them in isolation.
  const mdResult = validateMarkdown(output);

  // Pull out blocks that look like raw HTML (block-level tags).
  const htmlBlocks = output.match(/<(div|section|article|table|figure|details|svg)[\s\S]*?<\/\1>/gi) ?? [];

  const warnings = [...mdResult.warnings.filter((w) => !w.startsWith("contains raw HTML"))];
  const errors = [...mdResult.errors];

  for (const block of htmlBlocks) {
    const r = validateHTML(block);
    errors.push(...r.errors.map((e) => `embedded HTML: ${e}`));
    warnings.push(...r.warnings.map((w) => `embedded HTML: ${w}`));
  }

  return { ok: errors.length === 0, warnings, errors };
}

// ---------- dispatch ----------

export function validate(
  output: string,
  format: Format,
  opts: ValidateOptions = {}
): ValidationResult {
  let result: ValidationResult;
  switch (format) {
    case "markdown": result = validateMarkdown(output); break;
    case "html": result = validateHTML(output); break;
    case "html+svg": result = validateHTMLSVG(output); break;
    case "json": result = validateJSON(output); break;
    case "hybrid-md-html": result = validateHybrid(output); break;
    default: result = { ok: false, warnings: [], errors: [`unknown format: ${format}`] };
  }

  if (opts.strict && !result.ok) {
    throw new Error(
      `surface.validate: ${format} output failed validation.\n` +
      `Errors:\n  - ${result.errors.join("\n  - ")}`
    );
  }

  return result;
}
