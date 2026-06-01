/**
 * scripts/shoot.ts
 *
 * Render the visual example artifacts to full-page PNGs in examples/screenshots/.
 * These are the launch screenshots (Thariq-style companion shots) and the visual
 * evidence that the chosen formats actually look good.
 *
 * Run: npm run shoot   (requires `npx playwright install chromium` once)
 * Text artifacts (.md/.json) are not shot — they're shown inline in the README.
 */

import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const examples = join(root, "examples");
const outDir = join(examples, "screenshots");
mkdirSync(outDir, { recursive: true });

const shots = [
  { file: "index.html", out: "index.png", width: 900 },
  { file: "code-review.html", out: "code-review.png", width: 900 },
  { file: "mockup.html", out: "mockup.png", width: 1000 },
  { file: "dashboard.html", out: "dashboard.png", width: 1000 },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.width, height: 800 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(join(examples, s.file)).href, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(outDir, s.out), fullPage: true });
  await page.close();
  console.log(`shot  ${s.out}`);
}
await browser.close();
console.log(`\n${shots.length} screenshots written to examples/screenshots/`);
