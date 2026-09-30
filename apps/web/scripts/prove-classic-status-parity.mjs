import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const themeBasePath = resolve(here, "../src/styles/theme-base.css");
const baselineRevision = "88f7027";
const applicationUrl = "http://127.0.0.1:5173";
const statusTokens = [
  "--info-fg",
  "--info-bg",
  "--info-border",
  "--success-fg",
  "--success-bg",
  "--success-border",
  "--warning-fg",
  "--warning-bg",
  "--warning-border",
  "--danger-text",
  "--danger-bg",
  "--danger-bg-hover",
  "--danger-bg-active",
  "--danger-bg-subtle",
  "--danger-border",
];
const themes = ["classic", "clear"];
const modes = ["light", "dark"];

function readBaselineThemeBase() {
  return execFileSync("git", ["show", `${baselineRevision}:apps/web/src/styles/theme-base.css`], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

async function collectComputedTokens(page) {
  return page.evaluate(({ themes, modes, statusTokens }) => {
    const root = document.documentElement;
    const values = {};
    for (const theme of themes) {
      values[theme] = {};
      for (const mode of modes) {
        root.dataset.designTheme = theme;
        root.dataset.theme = mode;
        const computed = getComputedStyle(root);
        values[theme][mode] = Object.fromEntries(
          statusTokens.map((token) => [token, computed.getPropertyValue(token).trim()]),
        );
      }
    }
    return values;
  }, { themes, modes, statusTokens });
}

function printValues(label, values) {
  console.log(`\n${label}`);
  for (const theme of themes) {
    for (const mode of modes) {
      console.log(`${theme} ${mode}`);
      for (const token of statusTokens) console.log(`  ${token}: ${values[theme][mode][token]}`);
    }
  }
}

function compareValues(baseline, head) {
  const differences = [];
  for (const theme of themes) {
    for (const mode of modes) {
      for (const token of statusTokens) {
        if (baseline[theme][mode][token] !== head[theme][mode][token]) {
          differences.push(
            `${theme} ${mode} ${token}: ${baseline[theme][mode][token]} != ${head[theme][mode][token]}`,
          );
        }
      }
    }
  }
  return differences;
}

const originalThemeBase = readFileSync(themeBasePath, "utf8");
const baselineThemeBase = readBaselineThemeBase();
let restored = false;

try {
  writeFileSync(themeBasePath, baselineThemeBase);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(applicationUrl, { waitUntil: "networkidle" });
    const baselineValues = await collectComputedTokens(page);

    writeFileSync(themeBasePath, originalThemeBase);
    restored = true;
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: "networkidle" });
    const headValues = await collectComputedTokens(page);

    printValues(`Status tokens at ${baselineRevision}`, baselineValues);
    printValues("Status tokens at HEAD", headValues);
    const differences = compareValues(baselineValues, headValues);
    if (differences.length > 0) {
      console.error(`\nFAILED: ${differences.length} of 60 token values differ.`);
      for (const difference of differences) console.error(`  ${difference}`);
      process.exitCode = 1;
    } else {
      console.log("\nPASS: all 60 classic/clear status-token values are identical.");
    }
  } finally {
    await browser.close();
  }
} finally {
  if (!restored) writeFileSync(themeBasePath, originalThemeBase);
}
