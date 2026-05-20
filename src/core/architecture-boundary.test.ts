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

function getImportBoundaryViolations({
  root,
  pattern,
}: {
  root: string;
  pattern: RegExp;
}): string[] {
  return getSourceFiles(root).flatMap((file) => {
    const source = readFileSync(file, "utf8");

    return pattern.test(source) ? [relative(process.cwd(), file)] : [];
  });
}

describe("core architecture boundary", () => {
  it("does not import concrete standard tools from src/tools", () => {
    const coreRoot = join(process.cwd(), "src/core");
    const violations = getImportBoundaryViolations({
      root: coreRoot,
      pattern: /from\s+["'](?:\.\.\/){2,}tools\//,
    });

    expect(violations).toEqual([]);
  });

  it("keeps football example code out of production library layers", () => {
    const libraryRoots = [
      "src/core",
      "src/rendering",
      "src/react",
      "src/tools",
    ];
    const violations = libraryRoots.flatMap((root) =>
      getImportBoundaryViolations({
        root: join(process.cwd(), root),
        pattern: /from\s+["'][^"']*examples\/football/,
      }),
    );

    expect(violations).toEqual([]);
  });
});
