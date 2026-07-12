import type { PlayerGroup } from "../../../core/board/types";
import {
  appendPlayerGroup,
  createPlayerGroupFormationPlan,
  createBoardPlayerGroup,
  createBoardPlayerGroupId,
  getBoardPlayerGroup,
  getBoardPlayerGroups,
  getDefaultBoardPlayerGroupName,
  getNextBoardPlayerGroupColor,
  movePlayerToGroupInBoard,
  removePlayerGroup,
  resetPlayerStyleToGroupInBoard,
  resolvePlayerGroupStyle,
  setPlayerGroupAutoNumbering,
  setPlayerGroupName,
  updatePlayerGroupStyle,
  type PlayerGroupStylePatch,
} from "../../../core/board/player-groups";
import type {
  FormationLayout,
  FormationPlacement,
} from "../../../core/board/player-formation";
import {
  updatePlayerObject,
  type PlayerObject,
} from "../../../core/objects/player-object";
import {
  DEFAULT_PLAYER_TOOL_STATE,
  getPlayerToolState,
  PLAYER_TOOL_ID,
  type PlayerDraftStyle,
  type PlayerToolState,
} from "../../../core/tools/player-tool-state";
import type { ToolApi } from "../../../core/tools/types";
import {
  mergeToolDraftStyle,
  setToolStatePatch,
} from "../toolbar/secondary-toolbar-commands";

export type { PlayerGroupStylePatch } from "../../../core/board/player-groups";

type TeamToolApi = Pick<
  ToolApi,
  | "addObjects"
  | "beginHistoryBatch"
  | "deleteObjects"
  | "endHistoryBatch"
  | "getState"
  | "setToolState"
  | "updateBoard"
  | "updateObjects"
>;

export function getPlayerGroupDraftStyle(group: PlayerGroup): PlayerDraftStyle {
  const style = resolvePlayerGroupStyle(group);

  return {
    ...DEFAULT_PLAYER_TOOL_STATE.draftStyle,
    color: style.color,
    colors: style.colors,
    size: style.size,
    fontSize: style.fontSize,
    labelColor: style.labelColor,
    appearanceId: style.appearanceId,
    options: style.options,
    asset: style.asset,
    caption: style.caption,
  };
}

function withHistoryBatch(toolApi: TeamToolApi, run: () => void) {
  toolApi.beginHistoryBatch();

  try {
    run();
  } finally {
    toolApi.endHistoryBatch();
  }
}

function syncActiveGroupDraftStyle(toolApi: TeamToolApi, groupId: string) {
  const currentState = getPlayerToolState(toolApi.getState().toolState);

  if (currentState.activeGroupId !== groupId) {
    return;
  }

  const group = getBoardPlayerGroup(toolApi.getState().board, groupId);

  if (group) {
    mergeToolDraftStyle<PlayerDraftStyle, PlayerToolState>(
      toolApi,
      PLAYER_TOOL_ID,
      currentState,
      getPlayerGroupDraftStyle(group),
    );
  }
}

/**
 * Updates a Player Group's default style and propagates the change to all
 * member players and, when the group is active, the player tool draft style.
 */
export function applyPlayerGroupStylePatch(
  toolApi: TeamToolApi,
  groupId: string,
  patch: PlayerGroupStylePatch,
) {
  withHistoryBatch(toolApi, () => {
    toolApi.updateBoard((board) =>
      updatePlayerGroupStyle(board, groupId, patch),
    );
    syncActiveGroupDraftStyle(toolApi, groupId);
  });
}

export function renamePlayerGroup(
  toolApi: TeamToolApi,
  groupId: string,
  name: string,
) {
  const trimmedName = name.trim();

  toolApi.updateBoard((board) => ({
    ...board,
    playerGroups: setPlayerGroupName(
      board,
      groupId,
      trimmedName.length > 0 ? trimmedName : undefined,
    ),
  }));
}

export function setPlayerGroupAutoNumberingCommand(
  toolApi: TeamToolApi,
  groupId: string,
  autoNumbering: boolean,
) {
  toolApi.updateBoard((board) => ({
    ...board,
    playerGroups: setPlayerGroupAutoNumbering(board, groupId, autoNumbering),
  }));
}

/** Creates a new Player Group and makes it the active player-tool team. */
export function addPlayerGroupCommand(toolApi: TeamToolApi): PlayerGroup {
  const board = toolApi.getState().board;
  const currentGroups = getBoardPlayerGroups(board);
  const nextGroup = createBoardPlayerGroup({
    id: createBoardPlayerGroupId(currentGroups),
    name: getDefaultBoardPlayerGroupName(currentGroups.length),
    color: getNextBoardPlayerGroupColor(board),
  });

  toolApi.updateBoard((nextBoard) => ({
    ...nextBoard,
    playerGroups: appendPlayerGroup(nextBoard, nextGroup),
  }));

  const currentState = getPlayerToolState(toolApi.getState().toolState);
  setToolStatePatch(toolApi, PLAYER_TOOL_ID, currentState, {
    activeGroupId: nextGroup.id,
    draftStyle: getPlayerGroupDraftStyle(nextGroup),
  });

  return nextGroup;
}

/**
 * Deletes a Player Group along with its member players. Removing the final
 * remaining group is a no-op per the Coach Workflow rules.
 */
export function deletePlayerGroupCommand(
  toolApi: TeamToolApi,
  groupId: string,
): boolean {
  const preview = removePlayerGroup(toolApi.getState().board, groupId);

  if (!preview.removed) {
    return false;
  }

  withHistoryBatch(toolApi, () => {
    if (preview.removedMemberIds.length > 0) {
      toolApi.deleteObjects(preview.removedMemberIds);
    }

    toolApi.updateBoard((board) => ({
      ...board,
      playerGroups: removePlayerGroup(board, groupId).playerGroups,
    }));

    const currentState = getPlayerToolState(toolApi.getState().toolState);

    if (currentState.activeGroupId === groupId) {
      const nextGroup = getBoardPlayerGroups(toolApi.getState().board)[0];

      setToolStatePatch(toolApi, PLAYER_TOOL_ID, currentState, {
        activeGroupId: nextGroup?.id,
        draftStyle: nextGroup
          ? getPlayerGroupDraftStyle(nextGroup)
          : currentState.draftStyle,
      });
    }
  });

  return true;
}

/**
 * Moves a player to another team: the player adopts the team's style while
 * keeping its position and caption text. With auto-numbering enabled the
 * player gets the next free number in the destination team.
 */
export function movePlayerToGroup(
  toolApi: TeamToolApi,
  playerId: string,
  groupId: string,
) {
  toolApi.updateBoard((board) =>
    movePlayerToGroupInBoard(board, playerId, groupId),
  );
}

/**
 * Reapplies the team's style to a single player, discarding per-player
 * overrides while keeping the player's number, caption text, and position.
 */
export function resetPlayerStyleToGroup(
  toolApi: TeamToolApi,
  playerId: string,
) {
  toolApi.updateBoard((board) =>
    resetPlayerStyleToGroupInBoard(board, playerId),
  );
}

/**
 * Places a team into a formation on its half of the frame. Existing members
 * are repositioned by shirt number, missing players are created with the
 * team's style, and surplus players are left where they are.
 */
export function applyFormationToPlayerGroup(
  toolApi: TeamToolApi,
  {
    groupId,
    layout,
    placement,
  }: {
    groupId: string;
    layout: FormationLayout;
    placement?: FormationPlacement;
  },
) {
  const board = toolApi.getState().board;
  const plan = createPlayerGroupFormationPlan(board, {
    groupId,
    layout,
    placement,
  });

  if (!plan) {
    return;
  }

  withHistoryBatch(toolApi, () => {
    if (plan.positionById.size > 0) {
      toolApi.updateObjects([...plan.positionById.keys()], (object) => {
        const position = plan.positionById.get(object.id);

        return position
          ? updatePlayerObject(object as PlayerObject, { position })
          : object;
      });
    }

    toolApi.addObjects(plan.createdPlayers);
  });
}
