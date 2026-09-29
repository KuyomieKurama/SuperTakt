/**
 * `apps/web/src/lib/labels.ts` types `en` as `typeof de` (A-28.2), so a missing
 * or extra key is already a compile-time error. That check is blind to one
 * thing: a leaf that exists but is an empty string, e.g. a translator leaving
 * `cancel: ""` behind. This file walks both bundles at runtime and fails on
 * any empty-string or `undefined` leaf that is not an explicitly documented
 * exception.
 *
 * `setLanguage` (`lib/language.ts`) also writes `document.documentElement.lang`
 * (A-28.2 point 2). This suite runs under the shared `environment: 'node'`
 * (`vitest.config.ts`) and has no DOM, so a minimal stub stands in for that one
 * assignment -- nothing about the completeness check needs a real document.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { labels } from "../../src/lib/labels";
import { setLanguage, type Language } from "../../src/lib/language";

/**
 * The English sentence for `affected` (labels.ts, `en.affected`) omits the verb
 * ("Affected: …" instead of "Affected is: …"), so its `one`/`many` slots are
 * empty by design -- see the `subject === ""` branch of `affected.sentence`.
 * Nothing else in either bundle is meant to be empty.
 */
const EMPTY_BY_DESIGN = new Set(["en.affected.one", "en.affected.many"]);

function collectEmptyLeaves(value: unknown, path: string, into: string[]): void {
  if (value === undefined) {
    into.push(path);
    return;
  }
  if (typeof value === "string") {
    if (value === "" && !EMPTY_BY_DESIGN.has(path)) into.push(path);
    return;
  }
  if (typeof value === "function") return; // message builders, checked by their own tests
  if (typeof value === "object" && value !== null) {
    for (const [key, nested] of Object.entries(value)) {
      collectEmptyLeaves(nested, `${path}.${key}`, into);
    }
  }
}

let restoreDocument: () => void;

beforeAll(() => {
  const fakeDocument = { documentElement: { lang: "" } };
  Object.defineProperty(globalThis, "document", { value: fakeDocument, configurable: true });
  restoreDocument = () => {
    delete (globalThis as { document?: unknown }).document;
  };
});

afterAll(() => {
  setLanguage("de"); // leave the module-level language where every other file expects it
  restoreDocument();
});

function bundleFor(language: Language): unknown {
  setLanguage(language);
  return labels();
}

describe("labels bundle completeness (de/en)", () => {
  it("carries no empty or missing leaf strings in the German bundle", () => {
    const found: string[] = [];
    collectEmptyLeaves(bundleFor("de"), "de", found);
    expect(found).toEqual([]);
  });

  it("carries no empty or missing leaf strings in the English bundle, apart from the documented grammatical exception", () => {
    const found: string[] = [];
    collectEmptyLeaves(bundleFor("en"), "en", found);
    expect(found).toEqual([]);
  });

  it("would catch a regression: an undocumented empty string is reported by path", () => {
    // Proves the check is not vacuous -- a fixture standing in for a bundle
    // with an accidental empty string (the bug this test exists to catch),
    // not the real bundle.
    const brokenFixture = { cancel: "", nested: { label: "kept" } };
    const found: string[] = [];
    collectEmptyLeaves(brokenFixture, "en", found);
    expect(found).toEqual(["en.cancel"]);
  });

  it("does not flag the documented exception (en.affected.one / en.affected.many)", () => {
    const found: string[] = [];
    collectEmptyLeaves(bundleFor("en"), "en", found);
    expect(found).not.toContain("en.affected.one");
    expect(found).not.toContain("en.affected.many");
  });
});
