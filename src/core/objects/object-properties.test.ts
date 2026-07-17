import { describe, expect, it } from "vitest";
import type { Board, BoardObject } from "../board/types";
import { createBoardPlayerGroup } from "../board/player-groups";
import { createPlayerObject } from "./player-object";
import {
  getObjectColorSelectionState,
  updateObjectColor,
} from "./object-properties";

describe("Object color properties", () => {
  it("resolves mixed colors across Object types and applies one common value", () => {
    const playerGroup = createBoardPlayerGroup({
      id: "red-team",
      color: "#ef4444",
    });
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      groupId: playerGroup.id,
    });
    const text: BoardObject = {
      id: "text-1",
      type: "text",
      position: { x: 20, y: 10 },
      props: { color: "#1f6feb" },
    };
    const board = createTestBoard([player, text], [playerGroup]);

    expect(getObjectColorSelectionState(board, [player, text])).toEqual({
      color: "#ef4444",
      mixed: true,
    });

    const recoloredObjects = [player, text].map((object) =>
      updateObjectColor(object, "#22c55e"),
    );
    const recoloredBoard = createTestBoard(recoloredObjects, [playerGroup]);

    expect(
      getObjectColorSelectionState(recoloredBoard, recoloredObjects),
    ).toEqual({
      color: "#22c55e",
      mixed: false,
    });
  });
});

function createTestBoard(
  objects: BoardObject[],
  playerGroups: NonNullable<Board["playerGroups"]>,
): Board {
  return {
    id: "board-1",
    version: 1,
    metadata: {},
    frame: { width: 100, height: 50 },
    objects: {
      byId: Object.fromEntries(objects.map((object) => [object.id, object])),
      order: objects.map((object) => object.id),
    },
    playerGroups,
    style: {},
  };
}
