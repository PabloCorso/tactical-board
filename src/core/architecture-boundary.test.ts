import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return getSourceFiles(path);
    }

    if (
      !/\.(ts|tsx)$/.test(entry.name) ||
      /\.(test|spec)\.(ts|tsx)$/.test(entry.name)
    ) {
      return [];
    }

    return [path];
  });
}

describe("core architecture boundary", () => {
  it("does not import concrete standard tools from src/tools", () => {
    const coreRoot = join(process.cwd(), "src/core");
    const violations = getSourceFiles(coreRoot).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const importsStandardTool = /from\s+["'](?:\.\.\/){2,}tools\//.test(
        source,
      );

      return importsStandardTool ? [relative(process.cwd(), file)] : [];
    });

    expect(violations).toEqual([]);
  });
});
