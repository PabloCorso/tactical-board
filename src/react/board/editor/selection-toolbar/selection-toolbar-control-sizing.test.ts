import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("selection toolbar control sizing", () => {
  it("keeps player selection controls in the same height lane as toolbar buttons", () => {
    const source = readFileSync(
      fileURLToPath(
        new URL("./player-selection-toolbar.tsx", import.meta.url),
      ),
      "utf8",
    );

    expect(source).toContain('className="h-10 w-auto max-w-28 px-3 text-sm"');
    expect(source).toContain(
      'className="h-10 w-12 px-2 text-center text-sm font-medium md:text-sm"',
    );
    expect(source).toContain(
      'className="h-10 w-28 px-3 text-sm font-medium md:text-sm"',
    );
    expect(source).not.toContain("className=\"h-8 w-auto max-w-28");
    expect(source).not.toContain("className=\"h-8 w-12");
    expect(source).not.toContain("className=\"h-8 w-28");
  });

  it("keeps text selection controls in the same height lane as toolbar buttons", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./text-selection-toolbar.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toContain(
      "text-tb-text-primary h-10 w-12 px-2 text-center text-sm font-medium md:text-sm",
    );
    expect(source).not.toContain("text-tb-text-primary h-8 w-12");
  });
});
