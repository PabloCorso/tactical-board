import { describe, expect, it } from "vitest";
import { createBoardEditorStore } from "../../../core/store/board-editor-store";
import { createToolApi } from "../../../core/editor/create-tool-api";
import { createFootballBoard } from "../../sports/football/board/football-board";
import { createFootballEditorConfig } from "../../sports/football/theme/football-editor-config";
import { getBoardPlayerGroups } from "../../../core/board/player-groups";
import {
  createPlayerObject,
  PLAYER_OBJECT_TYPE,
  type PlayerObject,
} from "../../../core/objects/player-object";
import {
  applyFormationToPlayerGroup,
  deletePlayerGroupCommand,
  movePlayerToGroup,
  movePlayersToGroup,
} from "./player-team-commands";

function createTestToolApi() {
  const store = createBoardEditorStore({
    initialBoard: createFootballBoard({ id: "team-commands-board" }),
    ...createFootballEditorConfig(),
  });

  return createToolApi(store);
}

function getGroupMembers(
  toolApi: ReturnType<typeof createTestToolApi>,
  groupId: string,
) {
  return Object.values(toolApi.getState().board.objects.byId).filter(
    (object): object is PlayerObject =>
      object.type === PLAYER_OBJECT_TYPE && object.props.groupId === groupId,
  );
}

function addGroupPlayer(
  toolApi: ReturnType<typeof createTestToolApi>,
  id: string,
  groupId: string,
  label?: string,
) {
  toolApi.addObjects([
    createPlayerObject({
      id,
      position: { x: 10, y: 10 },
      groupId,
      label,
    }),
  ]);
}

describe("deletePlayerGroupCommand", () => {
  it("deletes the group along with its member players", () => {
    const toolApi = createTestToolApi();
    const [first, second] = getBoardPlayerGroups(toolApi.getState().board);

    addGroupPlayer(toolApi, "player-a", first.id, "1");
    addGroupPlayer(toolApi, "player-b", first.id, "2");
    addGroupPlayer(toolApi, "player-c", second.id, "1");

    expect(deletePlayerGroupCommand(toolApi, first.id)).toBe(true);

    const board = toolApi.getState().board;
    expect(getBoardPlayerGroups(board).map((group) => group.id)).toEqual([
      second.id,
    ]);
    expect(board.objects.byId["player-a"]).toBeUndefined();
    expect(board.objects.byId["player-b"]).toBeUndefined();
    expect(board.objects.byId["player-c"]).toBeDefined();
  });

  it("refuses to delete the final remaining group", () => {
    const toolApi = createTestToolApi();
    const groups = getBoardPlayerGroups(toolApi.getState().board);

    expect(deletePlayerGroupCommand(toolApi, groups[0].id)).toBe(true);

    const remaining = getBoardPlayerGroups(toolApi.getState().board);
    expect(remaining).toHaveLength(1);
    expect(deletePlayerGroupCommand(toolApi, remaining[0].id)).toBe(false);
    expect(getBoardPlayerGroups(toolApi.getState().board)).toHaveLength(1);
  });
});

describe("movePlayerToGroup", () => {
  it("adopts the destination team style and next number", () => {
    const toolApi = createTestToolApi();
    const [first, second] = getBoardPlayerGroups(toolApi.getState().board);

    addGroupPlayer(toolApi, "player-a", first.id, "5");
    addGroupPlayer(toolApi, "player-b", second.id, "1");

    movePlayerToGroup(toolApi, "player-a", second.id);

    const moved = toolApi.getState().board.objects.byId[
      "player-a"
    ] as PlayerObject;

    expect(moved.props.groupId).toBe(second.id);
    expect(moved.props.label).toBe("2");
  });

  it("moves several players with unique destination team numbers", () => {
    const toolApi = createTestToolApi();
    const [first, second] = getBoardPlayerGroups(toolApi.getState().board);

    addGroupPlayer(toolApi, "player-a", first.id, "4");
    addGroupPlayer(toolApi, "player-b", first.id, "5");
    addGroupPlayer(toolApi, "player-c", second.id, "1");

    movePlayersToGroup(toolApi, ["player-a", "player-b"], second.id);

    expect(
      getGroupMembers(toolApi, second.id)
        .map((player) => player.props.label)
        .sort(),
    ).toEqual(["1", "2", "3"]);
  });
});

describe("applyFormationToPlayerGroup", () => {
  it("creates missing players with team numbering inside the chosen half", () => {
    const toolApi = createTestToolApi();
    const [group] = getBoardPlayerGroups(toolApi.getState().board);

    applyFormationToPlayerGroup(toolApi, {
      groupId: group.id,
      layout: { rows: [4, 3, 3] },
      placement: { side: "start" },
    });

    const board = toolApi.getState().board;
    const members = getGroupMembers(toolApi, group.id);
    const longExtent = Math.max(board.frame.width, board.frame.height);
    const horizontal = board.frame.width >= board.frame.height;

    expect(members).toHaveLength(11);
    expect(members.map((member) => member.props.label).sort()).toEqual(
      ["1", "10", "11", "2", "3", "4", "5", "6", "7", "8", "9"].sort(),
    );

    for (const member of members) {
      const along = horizontal ? member.position.x : member.position.y;
      expect(along).toBeLessThan(longExtent / 2);
    }
  });

  it("repositions existing members instead of duplicating them", () => {
    const toolApi = createTestToolApi();
    const [group] = getBoardPlayerGroups(toolApi.getState().board);

    addGroupPlayer(toolApi, "player-a", group.id, "1");
    addGroupPlayer(toolApi, "player-b", group.id, "2");

    applyFormationToPlayerGroup(toolApi, {
      groupId: group.id,
      layout: { rows: [1, 2, 1] },
      placement: { side: "end" },
    });

    const members = getGroupMembers(toolApi, group.id);

    expect(members).toHaveLength(5);

    const board = toolApi.getState().board;
    const horizontal = board.frame.width >= board.frame.height;
    const halfExtent = Math.max(board.frame.width, board.frame.height) / 2;
    const movedGoalkeeper = board.objects.byId["player-a"] as PlayerObject;
    const along = horizontal
      ? movedGoalkeeper.position.x
      : movedGoalkeeper.position.y;

    expect(along).toBeGreaterThan(halfExtent);
  });
});
