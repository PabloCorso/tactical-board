import type { Asset, Board, PlayerCaptionStyle, PlayerGroup } from "./types";
import {
  getFormationPositions,
  type FormationLayout,
  type FormationPlacement,
} from "./player-formation";
import {
  DEFAULT_BOARD_COLOR,
  DEFAULT_BOARD_COLORS,
} from "../colors/default-colors";
import {
  createPlayerObject,
  DEFAULT_PLAYER_FONT_SIZE,
  DEFAULT_PLAYER_SIZE,
  PLAYER_OBJECT_TYPE,
  updatePlayerObject,
  type PlayerObject,
} from "../objects/player-object";
import {
  getNextNumericPlayerLabel,
  parsePlayerNumericLabel,
} from "../tools/player-labels";

export const BOARD_PLAYER_GROUP_COLOR_ORDER = [
  DEFAULT_BOARD_COLOR.red,
  DEFAULT_BOARD_COLOR.blue,
  ...DEFAULT_BOARD_COLORS.filter(
    (color) =>
      color !== DEFAULT_BOARD_COLOR.red && color !== DEFAULT_BOARD_COLOR.blue,
  ),
] as const;

const DEFAULT_GROUP_COUNT = 2;

export type PlayerGroupStylePatch = Partial<{
  color: string;
  colors: Record<string, string> | undefined;
  size: number;
  fontSize: number;
  labelColor: string | undefined;
  appearanceId: string | undefined;
  options: Record<string, unknown> | undefined;
  asset: Asset | undefined;
  caption: PlayerCaptionStyle | undefined;
}>;

export type ResolvedPlayerGroupStyle = {
  color: string;
  colors?: Record<string, string>;
  size: number;
  fontSize: number;
  labelColor?: string;
  appearanceId?: string;
  options?: Record<string, unknown>;
  asset?: Asset;
  caption?: PlayerCaptionStyle;
};

export type PlayerGroupFormationPlan = {
  createdPlayers: PlayerObject[];
  positionById: Map<string, { x: number; y: number }>;
};

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

export function resolvePlayerGroupStyle(
  group: Pick<PlayerGroup, "style">,
): ResolvedPlayerGroupStyle {
  return {
    color: group.style.color ?? DEFAULT_BOARD_COLOR.red,
    colors: group.style.colors ? { ...group.style.colors } : undefined,
    size: group.style.size ?? DEFAULT_PLAYER_SIZE,
    fontSize: group.style.fontSize ?? DEFAULT_PLAYER_FONT_SIZE,
    labelColor: group.style.labelColor,
    appearanceId: group.style.appearanceId,
    options: group.style.options ? { ...group.style.options } : undefined,
    asset: group.style.asset ? { ...group.style.asset } : undefined,
    caption: group.style.caption ? { ...group.style.caption } : undefined,
  };
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
      labelColor: group.style.labelColor,
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

export function sortPlayerGroupMembersByNumericLabel(
  members: ReadonlyArray<PlayerObject>,
) {
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

export function getPlayerGroupRosterObjects(
  board: Pick<Board, "objects">,
  groupId: string,
) {
  return sortPlayerGroupMembersByNumericLabel(
    getPlayerGroupMemberObjects(board, groupId),
  );
}

function getPlayerCaptionWithoutStyle(player: PlayerObject) {
  const captionText = player.props.caption?.text;

  if (captionText === undefined) {
    return undefined;
  }

  return {
    text: captionText,
  };
}

export function applyPlayerGroupStyleToPlayer(
  player: PlayerObject,
  group: PlayerGroup,
) {
  const style = resolvePlayerGroupStyle(group);

  return updatePlayerObject(player, {
    color: undefined,
    colors: undefined,
    appearanceId: undefined,
    options: undefined,
    asset: undefined,
    fontSize: undefined,
    size: { width: style.size, height: style.size },
    caption: getPlayerCaptionWithoutStyle(player),
  });
}

function applyPlayerGroupStylePatchToPlayer(
  player: PlayerObject,
  patch: PlayerGroupStylePatch,
) {
  return updatePlayerObject(player, {
    ...("size" in patch && typeof patch.size === "number"
      ? { size: { width: patch.size, height: patch.size } }
      : {}),
  });
}

function updateBoardPlayerObject(
  board: Board,
  playerId: string,
  update: (player: PlayerObject) => PlayerObject,
) {
  const object = board.objects.byId[playerId];

  if (object?.type !== PLAYER_OBJECT_TYPE) {
    return board;
  }

  const nextObject = update(object as PlayerObject);

  if (nextObject === object) {
    return board;
  }

  return {
    ...board,
    objects: {
      ...board.objects,
      byId: {
        ...board.objects.byId,
        [playerId]: nextObject,
      },
    },
  };
}

export function updatePlayerGroupStyle(
  board: Board,
  groupId: string,
  patch: PlayerGroupStylePatch,
) {
  const groups = getBoardPlayerGroups(board);
  const groupExists = groups.some((group) => group.id === groupId);

  if (!groupExists) {
    return board;
  }

  const playerGroups = groups.map((group) =>
    group.id === groupId
      ? { ...group, style: { ...group.style, ...patch } }
      : group,
  );
  const memberIds = getPlayerGroupMemberObjects(board, groupId).map(
    (object) => object.id,
  );

  if (memberIds.length === 0) {
    return {
      ...board,
      playerGroups,
    };
  }

  const nextById = { ...board.objects.byId };

  for (const memberId of memberIds) {
    const object = nextById[memberId];

    if (object?.type === PLAYER_OBJECT_TYPE) {
      nextById[memberId] = applyPlayerGroupStylePatchToPlayer(
        object as PlayerObject,
        patch,
      );
    }
  }

  return {
    ...board,
    playerGroups,
    objects: {
      ...board.objects,
      byId: nextById,
    },
  };
}

export function movePlayerToGroupInBoard(
  board: Board,
  playerId: string,
  groupId: string,
) {
  const group = getBoardPlayerGroup(board, groupId);

  if (!group) {
    return board;
  }

  const nextLabel = isBoardPlayerGroupAutoNumberingEnabled(group)
    ? getNextNumericPlayerLabel(board, group.style.color ?? "", groupId)
    : undefined;

  return updateBoardPlayerObject(board, playerId, (player) => {
    if (player.props.groupId === groupId) {
      return player;
    }

    return updatePlayerObject(applyPlayerGroupStyleToPlayer(player, group), {
      groupId,
      ...(nextLabel ? { label: nextLabel } : {}),
    });
  });
}

export function resetPlayerStyleToGroupInBoard(board: Board, playerId: string) {
  return updateBoardPlayerObject(board, playerId, (player) => {
    const group = getBoardPlayerGroup(board, player.props.groupId);

    return group ? applyPlayerGroupStyleToPlayer(player, group) : player;
  });
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

function createPlayerGroupFormationPlayerId(existingIds: Set<string>) {
  let index = 1;

  while (existingIds.has(`player-${index}`)) {
    index += 1;
  }

  const id = `player-${index}`;
  existingIds.add(id);

  return id;
}

export function createPlayerFromPlayerGroup({
  group,
  id,
  label,
  position,
}: {
  group: PlayerGroup;
  id: string;
  label?: string;
  position: { x: number; y: number };
}) {
  const style = resolvePlayerGroupStyle(group);

  return createPlayerObject({
    id,
    position,
    groupId: group.id,
    label,
    size: { width: style.size, height: style.size },
  });
}

export function createPlayerGroupFormationPlan(
  board: Board,
  {
    groupId,
    layout,
    placement,
  }: {
    groupId: string;
    layout: FormationLayout;
    placement?: FormationPlacement;
  },
): PlayerGroupFormationPlan | undefined {
  const group = getBoardPlayerGroup(board, groupId);

  if (!group) {
    return undefined;
  }

  const positions = getFormationPositions({
    frame: board.frame,
    layout,
    placement,
  });
  const members = getPlayerGroupRosterObjects(board, groupId);
  const positionById = new Map<string, { x: number; y: number }>();

  members.slice(0, positions.length).forEach((member, index) => {
    positionById.set(member.id, positions[index]);
  });

  if (members.length >= positions.length) {
    return {
      createdPlayers: [],
      positionById,
    };
  }

  const existingIds = new Set(Object.keys(board.objects.byId));
  const usedNumbers = members
    .map((member) => parsePlayerNumericLabel(member.props.label))
    .filter((value): value is number => typeof value === "number");
  let nextNumber = Math.max(0, ...usedNumbers) + 1;
  const autoNumbering = isBoardPlayerGroupAutoNumberingEnabled(group);
  const createdPlayers = positions.slice(members.length).map((position) => {
    const label = autoNumbering ? String(nextNumber++) : undefined;

    return createPlayerFromPlayerGroup({
      id: createPlayerGroupFormationPlayerId(existingIds),
      position,
      group,
      label,
    });
  });

  return {
    createdPlayers,
    positionById,
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
