import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("DropdownMenu", () => {
  it("uses the same compact popup padding and item height as Select", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./dropdown-menu.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toContain("rounded-lg border p-1 shadow-lg");
    expect(source).toContain("min-h-7");
    expect(source).toContain("gap-2");
    expect(source).toContain("px-2 py-1");
    expect(source).not.toContain("rounded-lg border p-2 shadow-lg");
    expect(source).not.toContain("min-h-10");
    expect(source).not.toContain("px-3 py-2");
  });
});
