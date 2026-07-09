import { describe, expect, it } from "vitest";
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
