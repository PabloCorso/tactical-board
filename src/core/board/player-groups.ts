import type { Board, PlayerGroup } from "./types";
import {
  DEFAULT_BOARD_COLOR,
  DEFAULT_BOARD_COLORS,
} from "../colors/default-colors";
import {
  DEFAULT_PLAYER_FONT_SIZE,
  DEFAULT_PLAYER_SIZE,
  PLAYER_OBJECT_TYPE,
  type PlayerObject,
} from "../objects/player-object";

export const BOARD_PLAYER_GROUP_COLOR_ORDER = [
  DEFAULT_BOARD_COLOR.red,
  DEFAULT_BOARD_COLOR.blue,
  ...DEFAULT_BOARD_COLORS.filter(
    (color) =>
      color !== DEFAULT_BOARD_COLOR.red && color !== DEFAULT_BOARD_COLOR.blue,
  ),
] as const;

const DEFAULT_GROUP_COUNT = 2;

export function createBoardPlayerGroupId(
  groups: ReadonlyArray<Pick<PlayerGroup, "id">>,
) {
  let index = 1;

  while (groups.some((group) => group.id === `player-group-${index}`)) {
    index += 1;
  }

  return `player-group-${index}`;
}

export function getDefaultBoardPlayerGroupName(index: number) {
  return `Group ${index + 1}`;
}

export function createBoardPlayerGroup(input: {
  id: string;
  name?: string;
  color?: string;
  autoNumbering?: boolean;
}): PlayerGroup {
  return {
    id: input.id,
    name: input.name,
    autoNumbering: input.autoNumbering === false ? false : undefined,
    style: {
      color: input.color ?? DEFAULT_BOARD_COLOR.red,
      size: DEFAULT_PLAYER_SIZE,
      fontSize: DEFAULT_PLAYER_FONT_SIZE,
    },
  };
}

export function createDefaultBoardPlayerGroups(
  count = DEFAULT_GROUP_COUNT,
): PlayerGroup[] {
  return Array.from({ length: Math.max(1, count) }, (_, index) =>
    createBoardPlayerGroup({
      id: `player-group-${index + 1}`,
      name: getDefaultBoardPlayerGroupName(index),
      color:
        BOARD_PLAYER_GROUP_COLOR_ORDER[
          index % BOARD_PLAYER_GROUP_COLOR_ORDER.length
        ],
    }),
  );
}

export function appendPlayerGroup(
  board: Pick<Board, "playerGroups">,
  group: PlayerGroup,
) {
  return [...getBoardPlayerGroups(board), group];
}

function updatePlayerGroupById(
  board: Pick<Board, "playerGroups">,
  groupId: string,
  update: (group: PlayerGroup) => PlayerGroup,
) {
  return getBoardPlayerGroups(board).map((group) =>
    group.id === groupId ? update(group) : group,
  );
}

export function setPlayerGroupAutoNumbering(
  board: Pick<Board, "playerGroups">,
  groupId: string,
  autoNumbering: boolean,
) {
  return updatePlayerGroupById(board, groupId, (group) => ({
    ...group,
    autoNumbering: autoNumbering ? undefined : false,
  }));
}

export function setPlayerGroupColor(
  board: Pick<Board, "playerGroups">,
  groupId: string,
  color: string,
) {
  return updatePlayerGroupById(board, groupId, (group) => ({
    ...group,
    style: {
      ...group.style,
      color,
    },
  }));
}

export function setPlayerGroupName(
  board: Pick<Board, "playerGroups">,
  groupId: string,
  name: string | undefined,
) {
  return updatePlayerGroupById(board, groupId, (group) => ({
    ...group,
    name,
  }));
}

export function normalizeBoardPlayerGroups(
  groups: ReadonlyArray<PlayerGroup> | undefined,
): PlayerGroup[] {
  const source =
    groups && groups.length > 0 ? groups : createDefaultBoardPlayerGroups();

  return source.map((group, index) => ({
    id: group.id,
    name: group.name ?? getDefaultBoardPlayerGroupName(index),
    autoNumbering: group.autoNumbering === false ? false : undefined,
    style: {
      color:
        group.style.color ??
        BOARD_PLAYER_GROUP_COLOR_ORDER[
          index % BOARD_PLAYER_GROUP_COLOR_ORDER.length
        ],
      size: group.style.size ?? DEFAULT_PLAYER_SIZE,
      fontSize: group.style.fontSize ?? DEFAULT_PLAYER_FONT_SIZE,
      colors: group.style.colors ? { ...group.style.colors } : undefined,
      appearanceId: group.style.appearanceId,
      options: group.style.options ? { ...group.style.options } : undefined,
      asset: group.style.asset ? { ...group.style.asset } : undefined,
      caption: group.style.caption ? { ...group.style.caption } : undefined,
    },
  }));
}

export function isBoardPlayerGroupAutoNumberingEnabled(
  group: Pick<PlayerGroup, "autoNumbering"> | undefined,
) {
  return group?.autoNumbering ?? true;
}

export function getBoardPlayerGroups(board: Pick<Board, "playerGroups">) {
  return normalizeBoardPlayerGroups(board.playerGroups);
}

export function getBoardPlayerGroup(
  board: Pick<Board, "playerGroups">,
  groupId: string | undefined,
) {
  if (!groupId) {
    return undefined;
  }

  return getBoardPlayerGroups(board).find((group) => group.id === groupId);
}

export function getPlayerGroupMemberObjects(
  board: Pick<Board, "objects">,
  groupId: string,
) {
  return board.objects.order
    .map((objectId) => board.objects.byId[objectId])
    .filter(
      (object): object is PlayerObject =>
        object?.type === PLAYER_OBJECT_TYPE &&
        (object as PlayerObject).props.groupId === groupId,
    );
}

export type RemovePlayerGroupResult = {
  removed: boolean;
  playerGroups: PlayerGroup[];
  removedMemberIds: string[];
};

/**
 * Deleting a Player Group is destructive for its members, and a board must
 * always retain at least one group — removing the final group is a no-op.
 */
export function removePlayerGroup(
  board: Pick<Board, "playerGroups" | "objects">,
  groupId: string,
): RemovePlayerGroupResult {
  const groups = getBoardPlayerGroups(board);
  const exists = groups.some((group) => group.id === groupId);

  if (!exists || groups.length <= 1) {
    return { removed: false, playerGroups: groups, removedMemberIds: [] };
  }

  return {
    removed: true,
    playerGroups: groups.filter((group) => group.id !== groupId),
    removedMemberIds: getPlayerGroupMemberObjects(board, groupId).map(
      (object) => object.id,
    ),
  };
}

export function getNextBoardPlayerGroupColor(
  board: Pick<Board, "playerGroups">,
) {
  const groups = getBoardPlayerGroups(board);
  const usedColors = new Set(
    groups
      .map((group) => group.style.color?.trim().toLowerCase())
      .filter((color): color is string => typeof color === "string"),
  );

  const nextUnusedColor = BOARD_PLAYER_GROUP_COLOR_ORDER.find(
    (color) => !usedColors.has(color.trim().toLowerCase()),
  );

  if (nextUnusedColor) {
    return nextUnusedColor;
  }

  return BOARD_PLAYER_GROUP_COLOR_ORDER[
    groups.length % BOARD_PLAYER_GROUP_COLOR_ORDER.length
  ];
}
