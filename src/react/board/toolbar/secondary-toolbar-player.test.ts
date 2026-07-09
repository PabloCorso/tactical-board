import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createBoardPlayerGroup } from "../../../core/board/player-groups";
import { getPlayerGroupDraftStyle } from "./secondary-toolbar-player";

describe("getPlayerGroupDraftStyle", () => {
  it("does not inherit shirt appearance data from another active group", () => {
    const shirtGroup = {
      ...createBoardPlayerGroup({
        id: "player-group-1",
        color: "#1f6feb",
      }),
      style: {
        color: "#1f6feb",
        appearanceId: "football-shirt",
        colors: {
          shirt: "#1f6feb",
          trim: "#ffffff",
        },
        options: {
          pattern: "solid",
        },
      },
    };
    const circleGroup = createBoardPlayerGroup({
      id: "player-group-2",
      color: "#ef4444",
    });

    expect(getPlayerGroupDraftStyle(shirtGroup)).toMatchObject({
      appearanceId: "football-shirt",
      colors: {
        shirt: "#1f6feb",
      },
    });
    expect(getPlayerGroupDraftStyle(circleGroup)).toMatchObject({
      color: "#ef4444",
      appearanceId: undefined,
      colors: undefined,
      options: undefined,
    });
  });
});

describe("BoardEditorPlayerGroupToolbar layout", () => {
  it("keeps player groups tightly stacked and the add button preview-sized", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./secondary-toolbar-player.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toContain('contentClassName={cn("items-center gap-0.5"');
    expect(source).toContain(
      'className={cn("relative flex w-20 min-w-0 flex-col gap-0.5")}',
    );
    expect(source).toContain("<BoardEditorToolbarSeparator");
    expect(source).toContain("index < playerGroups.length - 1");
    expect(source).toContain("playerGroups.length > 0");
    expect(source).toContain('className="my-0"');
    expect(source).toContain('className="h-11 w-20"');
    expect(source).not.toContain('className="h-20 w-20"');
    expect(source).not.toContain("relative h-20");
  });
});
