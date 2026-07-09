import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("DrawerContent", () => {
  it("defines the tactical board token scope for portaled popup content", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./drawer.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toMatch(
      /<DrawerPrimitive\.Popup\s+[^>]*data-tactical-board/s,
    );
  });
});
