import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("SelectContent", () => {
  it("defines the tactical board token scope for portaled popup content", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./select.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toMatch(
      /<SelectPrimitive\.Popup\s+[^>]*data-tactical-board/s,
    );
  });

  it("defaults to fit-to-content dropdown positioning", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./select.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toMatch(/alignItemWithTrigger = false/);
    expect(source).toMatch(
      /alignItemWithTrigger=\{alignItemWithTrigger\}/,
    );
    expect(source).toMatch(/data-align-trigger=\{alignItemWithTrigger\}/);
  });

  it("keeps select items compact by default", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./select.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toContain("min-h-7");
    expect(source).toContain("py-1");
    expect(source).not.toContain("min-h-8");
    expect(source).not.toContain("py-1.5 pr-8");
  });
});
