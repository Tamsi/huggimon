/**
 * Record holo/tilt animation on the profile card and write docs/card-holo.gif.
 * Requires: dev server on localhost:3000, ffmpeg, and playwright (npx).
 *
 *   npx playwright install chromium
 *   node scripts/capture-card-gif.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const FRAMES_DIR = path.join(REPO_ROOT, ".tmp/card-frames");
const GIF_PATH = path.join(REPO_ROOT, "docs/card-holo.gif");
const URL = process.env.CAPTURE_URL ?? "http://localhost:3000/ImTamsi";
const FRAME_COUNT = 36;

fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
fs.mkdirSync(FRAMES_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForSelector(".profile-hero__card .card.interactive", { timeout: 60_000 });
await page.waitForFunction(
  () => {
    const img = document.querySelector(".profile-hero__card .card__front img");
    return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
  },
  { timeout: 60_000 },
);
await page.waitForTimeout(800);

const card = page.locator(".profile-hero__card .card.interactive");
const box = await card.boundingBox();
if (!box) throw new Error("Card bounding box not found");

for (let i = 0; i < FRAME_COUNT; i++) {
  const t = (i / FRAME_COUNT) * Math.PI * 2;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const x = cx + Math.cos(t) * box.width * 0.38;
  const y = cy + Math.sin(t) * box.height * 0.32;

  await page.mouse.move(x, y, { steps: 4 });
  await page.waitForTimeout(40);
  await card.screenshot({
    path: path.join(FRAMES_DIR, `frame-${String(i).padStart(3, "0")}.png`),
  });
}

await browser.close();

fs.mkdirSync(path.dirname(GIF_PATH), { recursive: true });
execSync(
  [
    "ffmpeg -y",
    `-framerate 12 -i "${FRAMES_DIR}/frame-%03d.png"`,
    '-vf "fps=10,scale=420:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5"',
    `"${GIF_PATH}"`,
  ].join(" "),
  { stdio: "inherit" },
);

fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
console.log(`Wrote ${GIF_PATH}`);
