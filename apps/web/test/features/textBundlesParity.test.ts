import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function textBundleFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return textBundleFiles(path);
    return entry.name === "texts.ts" ? [path] : [];
  });
}

describe("feature text bundles (de/en)", () => {
  it("types every English bundle as the German bundle", () => {
    const files = textBundleFiles(join(process.cwd(), "apps/web/src/features"));

    expect(files).not.toEqual([]);
    for (const file of files) {
      expect(readFileSync(file, "utf8")).toMatch(/const en: typeof de\s*=/);
    }
  });
});