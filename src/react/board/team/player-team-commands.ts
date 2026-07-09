import type {
  Asset,
  PlayerCaptionStyle,
  PlayerGroup,
  Point,
} from "../../../core/board/types";
import {
  appendPlayerGroup,
  createBoardPlayerGroup,
  createBoardPlayerGroupId,
  getBoardPlayerGroup,
  getBoardPlayerGroups,
  getDefaultBoardPlayerGroupName,
  getNextBoardPlayerGroupColor,
  getPlayerGroupMemberObjects,
  isBoardPlayerGroupAutoNumberingEnabled,
  removePlayerGroup,
  setPlayerGroupAutoNumbering,
  setPlayerGroupName,
} from "../../../core/board/player-groups";
import {
  getFormationPositions,
  type FormationLayout,
  type FormationPlacement,
} from "../../../core/board/player-formation";
import {
  createPlayerObject,
  updatePlayerObject,
  type PlayerObject,
} from "../../../core/objects/player-object";
import {
  parsePlayerNumericLabel,
  getNextNumericPlayerLabel,
} from "../../../core/tools/player-labels";
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

export type PlayerGroupStylePatch = Partial<{
  color: string;
  colors: Record<string, string> | undefined;
  size: number;
  fontSize: number;
  appearanceId: string | undefined;
  options: Record<string, unknown> | undefined;
  asset: Asset | undefined;
  caption: PlayerCaptionStyle | undefined;
}>;

export function getPlayerGroupDraftStyle(group: PlayerGroup): PlayerDraftStyle {
  return {
    ...DEFAULT_PLAYER_TOOL_STATE.draftStyle,
    color: group.style.color ?? DEFAULT_PLAYER_TOOL_STATE.draftStyle.color,
    colors: group.style.colors,
    size: group.style.size ?? DEFAULT_PLAYER_TOOL_STATE.draftStyle.size,
    fontSize:
      group.style.fontSize ?? DEFAULT_PLAYER_TOOL_STATE.draftStyle.fontSize,
    appearanceId: group.style.appearanceId,
    options: group.style.options,
    asset: group.style.asset,
    caption: group.style.caption,
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
    toolApi.updateBoard((board) => ({
      ...board,
      playerGroups: getBoardPlayerGroups(board).map((group) =>
        group.id === groupId
          ? { ...group, style: { ...group.style, ...patch } }
          : group,
      ),
    }));

    const memberIds = getPlayerGroupMemberObjects(
      toolApi.getState().board,
      groupId,
    ).map((object) => object.id);

    if (memberIds.length > 0) {
      const { caption, size, ...objectPatch } = patch;

      toolApi.updateObjects(memberIds, (object) => {
        const player = object as PlayerObject;

        return updatePlayerObject(player, {
          ...objectPatch,
          ...("size" in patch && typeof size === "number"
            ? { size: { width: size, height: size } }
            : {}),
          ...("caption" in patch
            ? { caption: { ...player.props.caption, style: caption } }
            : {}),
        });
      });
    }

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
  const board = toolApi.getState().board;
  const group = getBoardPlayerGroup(board, groupId);

  if (!group) {
    return;
  }

  const nextLabel = isBoardPlayerGroupAutoNumberingEnabled(group)
    ? getNextNumericPlayerLabel(board, group.style.color ?? "", groupId)
    : undefined;

  toolApi.updateObjects([playerId], (object) => {
    const player = object as PlayerObject;

    if (player.props.groupId === groupId) {
      return player;
    }

    return updatePlayerObject(player, {
      groupId,
      color: group.style.color ?? player.props.color,
      colors: group.style.colors,
      appearanceId: group.style.appearanceId,
      options: group.style.options,
      asset: group.style.asset,
      fontSize: group.style.fontSize,
      size: group.style.size
        ? { width: group.style.size, height: group.style.size }
        : undefined,
      ...(nextLabel ? { label: nextLabel } : {}),
      caption: {
        ...player.props.caption,
        style: group.style.caption,
      },
    });
  });
}

/**
 * Reapplies the team's style to a single player, discarding per-player
 * overrides while keeping the player's number, caption text, and position.
 */
export function resetPlayerStyleToGroup(
  toolApi: TeamToolApi,
  playerId: string,
) {
  toolApi.updateObjects([playerId], (object) => {
    const player = object as PlayerObject;
    const group = getBoardPlayerGroup(
      toolApi.getState().board,
      player.props.groupId,
    );

    if (!group) {
      return player;
    }

    return updatePlayerObject(player, {
      color: group.style.color ?? player.props.color,
      colors: group.style.colors,
      appearanceId: group.style.appearanceId,
      options: group.style.options,
      asset: group.style.asset,
      fontSize: group.style.fontSize,
      size: group.style.size
        ? { width: group.style.size, height: group.style.size }
        : undefined,
      caption: {
        ...player.props.caption,
        style: group.style.caption,
      },
    });
  });
}

function sortMembersByNumericLabel(members: PlayerObject[]) {
  return [...members].sort((a, b) => {
    const aLabel = parsePlayerNumericLabel(a.props.label);
    const bLabel = parsePlayerNumericLabel(b.props.label);

    if (aLabel !== undefined && bLabel !== undefined) {
      return aLabel - bLabel;
    }

    if (aLabel !== undefined) {
      return -1;
    }

    if (bLabel !== undefined) {
      return 1;
    }

    return 0;
  });
}

function createFormationPlayerId(existingIds: Set<string>) {
  let index = 1;

  while (existingIds.has(`player-${index}`)) {
    index += 1;
  }

  const id = `player-${index}`;
  existingIds.add(id);

  return id;
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
  const group = getBoardPlayerGroup(board, groupId);

  if (!group) {
    return;
  }

  const positions = getFormationPositions({
    frame: board.frame,
    layout,
    placement,
  });
  const members = sortMembersByNumericLabel(
    getPlayerGroupMemberObjects(board, groupId),
  );
  const autoNumbering = isBoardPlayerGroupAutoNumberingEnabled(group);

  withHistoryBatch(toolApi, () => {
    const positionById = new Map<string, Point>();

    members.slice(0, positions.length).forEach((member, index) => {
      positionById.set(member.id, positions[index]);
    });

    if (positionById.size > 0) {
      toolApi.updateObjects([...positionById.keys()], (object) => {
        const position = positionById.get(object.id);

        return position
          ? updatePlayerObject(object as PlayerObject, { position })
          : object;
      });
    }

    if (members.length >= positions.length) {
      return;
    }

    const existingIds = new Set(Object.keys(board.objects.byId));
    const usedNumbers = members
      .map((member) => parsePlayerNumericLabel(member.props.label))
      .filter((value): value is number => typeof value === "number");
    let nextNumber = Math.max(0, ...usedNumbers) + 1;
    const draftStyle = getPlayerGroupDraftStyle(group);
    const createdPlayers = positions.slice(members.length).map((position) => {
      const label = autoNumbering ? String(nextNumber++) : undefined;

      return createPlayerObject({
        id: createFormationPlayerId(existingIds),
        position,
        groupId,
        label,
        color: draftStyle.color,
        colors: draftStyle.colors,
        fontSize: draftStyle.fontSize,
        size: { width: draftStyle.size, height: draftStyle.size },
        appearanceId: draftStyle.appearanceId,
        options: draftStyle.options,
        asset: draftStyle.asset,
        caption: draftStyle.caption ? { style: draftStyle.caption } : undefined,
      });
    });

    toolApi.addObjects(createdPlayers);
  });
}
