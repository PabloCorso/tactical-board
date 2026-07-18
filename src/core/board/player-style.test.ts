import { describe, expect, it } from "vitest";
import {
  createPlayerObject,
  type PlayerObject,
} from "../objects/player-object";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import { playerSelectionAdapter } from "../tools/player-selection";
import {
  createBoardPlayerGroup,
  updatePlayerGroupStyle,
} from "./player-groups";
import { resolveEffectivePlayerStyle, updatePlayerStyle } from "./player-style";
import type { Board } from "./types";
import { getBoardContentBounds } from "./board-content-bounds";

function createBoardWithPlayers(): Board {
  const group = createBoardPlayerGroup({ id: "group-1" });
  const inheritedPlayer = createPlayerObject({
    id: "inherited-player",
    position: { x: 10, y: 10 },
    groupId: group.id,
  });
  const playerToOverride = createPlayerObject({
    id: "overridden-player",
    position: { x: 20, y: 10 },
    groupId: group.id,
  });
  const board: Board = {
    id: "player-style-board",
    version: 1,
    metadata: {},
    frame: { width: 100, height: 60 },
    objects: {
      byId: {
        [inheritedPlayer.id]: inheritedPlayer,
        [playerToOverride.id]: playerToOverride,
      },
      order: [inheritedPlayer.id, playerToOverride.id],
    },
    playerGroups: [group],
    style: {},
  };
  const overriddenPlayer = updatePlayerStyle(playerToOverride, { size: 18 });

  return {
    ...board,
    objects: {
      ...board.objects,
      byId: {
        ...board.objects.byId,
        [overriddenPlayer.id]: overriddenPlayer,
      },
    },
  };
}

describe("Player size inheritance", () => {
  it("preserves explicit overrides when the Player Group default changes", () => {
    let board = createBoardWithPlayers();

    board = updatePlayerGroupStyle(board, "group-1", { size: 30 });

    const inheritedPlayer = board.objects.byId[
      "inherited-player"
    ] as PlayerObject;
    const overriddenPlayer = board.objects.byId[
      "overridden-player"
    ] as PlayerObject;

    expect(resolveEffectivePlayerStyle(board, inheritedPlayer).size).toBe(30);
    expect(resolveEffectivePlayerStyle(board, overriddenPlayer).size).toBe(18);
    expect(inheritedPlayer.size).toBeUndefined();
    expect(overriddenPlayer.size).toEqual({ width: 18, height: 18 });

    const resetPlayer = updatePlayerStyle(overriddenPlayer, {
      size: undefined,
    });

    expect(resolveEffectivePlayerStyle(board, resetPlayer).size).toBe(30);
    expect(resetPlayer.size).toBeUndefined();
  });

  it("uses the inherited size in Selection and Board bounds", () => {
    let board = createBoardWithPlayers();
    const inheritedPlayer = board.objects.byId[
      "inherited-player"
    ] as PlayerObject;
    const movedPlayer = {
      ...inheritedPlayer,
      position: { x: 110, y: 10 },
    };

    board = updatePlayerGroupStyle(
      {
        ...board,
        objects: {
          ...board.objects,
          byId: {
            ...board.objects.byId,
            [movedPlayer.id]: movedPlayer,
          },
        },
      },
      "group-1",
      { size: 30 },
    );

    const projection = createBoardSpaceProjection({
      frame: board.frame,
      viewport: { pan: { x: 0, y: 0 }, zoom: 1 },
      canvasRect: { width: 100, height: 60 },
    });
    const inheritedBounds = playerSelectionAdapter.getCanvasBounds?.({
      board,
      object: movedPlayer,
      projection,
    });
    const explicitBounds = playerSelectionAdapter.getCanvasBounds?.({
      board,
      object: createPlayerObject({
        id: "explicit-size-player",
        position: movedPlayer.position,
        size: { width: 30, height: 30 },
      }),
      projection,
    });

    expect(inheritedBounds).toEqual(explicitBounds);
    expect(getBoardContentBounds(board).maxX).toBe(125);
  });
});
