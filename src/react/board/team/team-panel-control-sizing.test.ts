import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("team panel control sizing", () => {
  it("keeps the upload-image label in the same 48px outer-height lane as appearance buttons", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./team-panel.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toContain(
      "transition-interactive box-border flex h-12 min-w-0",
    );
  });

  it("shows the current uploaded image inside the upload-image tile", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./team-panel.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toContain("active && value.asset?.src");
    expect(source).toContain("backgroundImage: `url(\"${value.asset.src}\")`");
    expect(source).toContain("size-full rounded-sm bg-cover bg-center");
  });
});
