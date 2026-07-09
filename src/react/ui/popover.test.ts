import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("PopoverContent", () => {
  it("uses the same compact default popup padding as Select", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./popover.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toContain("rounded-lg border p-1 text-sm shadow-lg");
    expect(source).not.toContain("rounded-lg border p-2.5");
  });
});
