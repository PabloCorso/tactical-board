import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(fileName: string) {
  return readFileSync(
    fileURLToPath(new URL(`./${fileName}`, import.meta.url)),
    "utf8",
  );
}

describe("shared control sizing", () => {
  it("keeps default inputs, select triggers, and medium buttons at the same height", () => {
    const inputSource = readUiSource("input.tsx");
    const selectSource = readUiSource("select.tsx");
    const buttonSource = readUiSource("button.tsx");

    expect(inputSource).toContain("flex h-10 w-full");
    expect(selectSource).toContain("flex h-10 w-full");
    expect(buttonSource).toContain('md: "h-10 gap-2 px-3 text-sm"');
  });

  it("keeps the compact button height as the explicit small control lane", () => {
    const buttonSource = readUiSource("button.tsx");

    expect(buttonSource).toContain('sm: "h-8 gap-1.5 px-2.5 text-xs"');
  });
});
