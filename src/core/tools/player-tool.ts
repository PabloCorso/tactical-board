import type { BoardEditorToolState } from "../editor/types";
import {
  createDefaultBoardPlayerGroups,
  getBoardPlayerGroup,
  getBoardPlayerGroups,
  isBoardPlayerGroupAutoNumberingEnabled,
} from "../board/player-groups";
import type { ToolApi, ToolDefinition } from "./types";
import { BoardEditorTool } from "./tool";
import { defineObjectDefinition } from "../objects/types";
import {
  createPlayerObject,
  DEFAULT_PLAYER_FONT_SIZE,
  PLAYER_OBJECT_TYPE,
  type PlayerObject,
} from "../objects/player-object";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
  CanvasObjectRenderer,
} from "../rendering/canvas/types";
import { clearSelection } from "./select-tool-actions";
import { playerSelectionAdapter } from "./player-selection";
import { getNextNumericPlayerLabel } from "./player-labels";
import {
  DEFAULT_PLAYER_TOOL_STATE,
  getPlayerToolState,
  PLAYER_TOOL_ID,
  type PlayerDraftStyle,
  type PlayerToolState,
} from "./player-tool-state";
import {
  getAbsoluteCanvasExtent,
  getPlayerBorderWidth,
  getPlayerLabelFontSize,
} from "../rendering/canvas/object-render-scale";
import type { Board } from "../board/types";
import {
  DEFAULT_PLAYER_APPEARANCE_ID,
  type PlayerAppearanceRendererRegistry,
} from "./player-appearance";
import {
  getPlayerCaptionCanvasBounds,
  getPlayerCaptionCanvasFontSize,
  getPlayerCaptionText,
  hitTestPlayerCaption,
} from "./player-geometry";

export type PlayerToolLabelStrategy = "numeric-by-color" | "none";

export type PlayerToolDefault = {
  id: string;
  label?: string;
  tooltip?: string;
  draftStyle: Partial<PlayerDraftStyle>;
};

type CreatePlayerToolOptions = {
  defaults?: PlayerToolDefault[];
  labelStrategy?: PlayerToolLabelStrategy;
  renderer?: CanvasObjectRenderer;
};

type PlayerAssetImageCacheEntry = {
  image: HTMLImageElement;
  loaded: boolean;
};

const playerObjectDefinition = defineObjectDefinition({
  type: PLAYER_OBJECT_TYPE,
  selection: playerSelectionAdapter,
});

const PREVIEW_OPACITY = 0.55;
const DEFAULT_PLAYER_BORDER_COLOR = "#000000";
const playerAssetImageCache = new Map<string, PlayerAssetImageCacheEntry>();
const PLAYER_LABEL_VERTICAL_OFFSET = 0.5;

function getPlayerLabelVerticalOffset(frameScale: number) {
  return PLAYER_LABEL_VERTICAL_OFFSET / Math.max(frameScale, 1);
}

function getCanvasFontSizeForPlayerLabel(
  radius: number,
  fontSize: number,
  scale: number,
) {
  const scaledConfiguredFontSize = fontSize * scale;
  const scaledMarkerBasedFontSize = getPlayerLabelFontSize(radius);

  return Math.max(scaledConfiguredFontSize, scaledMarkerBasedFontSize);
}

export class PlayerTool extends BoardEditorTool implements ToolDefinition {
  readonly id = PLAYER_TOOL_ID;
  readonly label = "Player";

  readonly labelStrategy: PlayerToolLabelStrategy;
  private readonly defaults: PlayerToolDefault[];
  private readonly renderer: CanvasObjectRenderer;

  constructor(options: CreatePlayerToolOptions = {}) {
    super();
    this.labelStrategy = options.labelStrategy ?? "numeric-by-color";
    this.defaults = options.defaults ?? [];
    this.renderer = options.renderer ?? renderPlayer;
  }

  getActivatedDraftStyle(toolState: BoardEditorToolState): PlayerDraftStyle {
    const hasStoredDraftStyle = hasStoredPlayerDraftStyle(
      toolState[PLAYER_TOOL_ID],
    );
    const currentState = getPlayerToolState(toolState);
    const nextDraftStyle = {
      ...DEFAULT_PLAYER_TOOL_STATE.draftStyle,
      ...currentState.draftStyle,
    };

    if (this.defaults.length > 0 && !hasStoredDraftStyle) {
      Object.assign(nextDraftStyle, this.defaults[0].draftStyle);
    }

    return nextDraftStyle;
  }

  onActivate(api: ToolApi) {
    const hasStoredDraftStyle = hasStoredPlayerDraftStyle(
      api.getState().toolState[PLAYER_TOOL_ID],
    );
    const currentState = getPlayerToolState(api.getState().toolState);
    const board = api.getState().board;
    const groups =
      board.playerGroups && board.playerGroups.length > 0
        ? getBoardPlayerGroups(board)
        : [];
    const selectedGroup = getBoardPlayerGroup(board, currentState.activeGroupId);
    const activeGroup = selectedGroup ?? groups[0];
    const activatedDraftStyle = this.getActivatedDraftStyle(
      api.getState().toolState,
    );
    const groupDraftStyle = {
      ...activatedDraftStyle,
      color: activeGroup?.style.color ?? activatedDraftStyle.color,
      colors: activeGroup?.style.colors ?? activatedDraftStyle.colors,
      size: activeGroup?.style.size ?? activatedDraftStyle.size,
      fontSize: activeGroup?.style.fontSize ?? activatedDraftStyle.fontSize,
      appearanceId:
        activeGroup?.style.appearanceId ?? activatedDraftStyle.appearanceId,
      options: activeGroup?.style.options ?? activatedDraftStyle.options,
      asset: activeGroup?.style.asset ?? activatedDraftStyle.asset,
      caption: activeGroup?.style.caption ?? activatedDraftStyle.caption,
    };
    const shouldPreserveInitialDefault =
      activeGroup &&
      !selectedGroup &&
      !hasStoredDraftStyle &&
      this.defaults.length > 0 &&
      isDefaultBoardPlayerGroup(activeGroup, 0);
    const draftStyle = shouldPreserveInitialDefault
      ? {
          ...groupDraftStyle,
          ...this.defaults[0].draftStyle,
        }
      : groupDraftStyle;

    api.setToolState(PLAYER_TOOL_ID, {
      ...currentState,
      activeGroupId: activeGroup?.id,
      draftStyle,
    });
  }

  onDeactivate(api: ToolApi) {
    api.clearPreviewObjects();
  }

  registerCapabilities(
    api: Parameters<NonNullable<ToolDefinition["registerCapabilities"]>>[0],
  ) {
    api.registerObjectRenderer(PLAYER_OBJECT_TYPE, this.renderer);
    api.registerObjectHitTester(PLAYER_OBJECT_TYPE, hitTestPlayer);
    api.registerObjectDefinition(playerObjectDefinition);
  }

  onPointerDown(
    event: Parameters<NonNullable<ToolDefinition["onPointerDown"]>>[0],
    api: ToolApi,
  ) {
    const state = api.getState();
    const playerState = getPlayerToolState(state.toolState);
    const playerId = createPlayerId(state.board.objects.byId);
    const label = this.getNextPlayerLabel(state.board, playerState);

    clearSelection(api);
    api.addObjects([
      createPlayerPreviewObject({
        id: playerId,
        point: event.point,
        draftStyle: playerState.draftStyle,
        groupId: playerState.activeGroupId,
        label,
      }),
    ]);
  }

  onPointerMove(
    event: Parameters<NonNullable<ToolDefinition["onPointerMove"]>>[0],
    api: ToolApi,
  ) {
    const state = api.getState();
    const playerState = getPlayerToolState(state.toolState);
    const label = this.getNextPlayerLabel(state.board, playerState);

    api.setPreviewObjects([
      createPlayerPreviewObject({
        id: "player-preview",
        point: event.point,
        draftStyle: playerState.draftStyle,
        groupId: playerState.activeGroupId,
        label,
      }),
    ]);
  }

  private getNextPlayerLabel(
    board: Pick<Board, "objects" | "playerGroups">,
    playerState: PlayerToolState,
  ) {
    const activeGroup = getBoardPlayerGroup(board, playerState.activeGroupId);

    if (
      this.labelStrategy !== "numeric-by-color" ||
      !isBoardPlayerGroupAutoNumberingEnabled(activeGroup)
    ) {
      return undefined;
    }

    return getNextNumericPlayerLabel(
      board,
      playerState.draftStyle.color,
      playerState.activeGroupId,
    );
  }
}

function isDefaultBoardPlayerGroup(
  group: NonNullable<ReturnType<typeof getBoardPlayerGroup>>,
  index: number,
) {
  const defaultGroup = createDefaultBoardPlayerGroups(index + 1)[index];

  return (
    group.id === defaultGroup.id &&
    group.name === defaultGroup.name &&
    group.autoNumbering === defaultGroup.autoNumbering &&
    group.style.color === defaultGroup.style.color &&
    group.style.size === defaultGroup.style.size &&
    group.style.fontSize === defaultGroup.style.fontSize &&
    group.style.appearanceId === undefined &&
    group.style.colors === undefined &&
    group.style.options === undefined &&
    group.style.asset === undefined &&
    group.style.caption === undefined
  );
}

function hasStoredPlayerDraftStyle(
  value: unknown,
): value is Pick<Partial<PlayerToolState>, "draftStyle"> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, "draftStyle")
  );
}

function createPlayerPreviewObject({
  id,
  point,
  draftStyle,
  groupId,
  label,
}: {
  id: string;
  point: Parameters<NonNullable<ToolDefinition["onPointerMove"]>>[0]["point"];
  draftStyle: ReturnType<typeof getPlayerToolState>["draftStyle"];
  groupId?: string;
  label?: string;
}) {
  return createPlayerObject({
    id,
    position: point,
    rotation: 0,
    size: {
      width: draftStyle.size,
      height: draftStyle.size,
    },
    groupId,
    color: draftStyle.color,
    colors: draftStyle.colors,
    fontSize: draftStyle.fontSize,
    appearanceId: draftStyle.appearanceId,
    options: draftStyle.options,
    asset: draftStyle.asset,
    caption: draftStyle.caption ? { style: draftStyle.caption } : undefined,
    label,
  });
}

export function getContrastingPlayerLabelColor(color: string) {
  return getContrastingTextColor(color);
}

function getContrastingTextColor(color: string) {
  const normalized = color.trim().replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => part + part)
          .join("")
      : normalized;

  if (!/^[\da-f]{6}$/i.test(expanded)) {
    return "#ffffff";
  }

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 160 ? "#111827" : "#ffffff";
}

function createPlayerId(existingIds: Record<string, unknown>) {
  let index = 1;

  while (existingIds[`player-${index}`]) {
    index += 1;
  }

  return `player-${index}`;
}

function getPlayerAssetImage(src: string, requestRender: () => void) {
  const cached = playerAssetImageCache.get(src);

  if (cached) {
    return cached;
  }

  const image = new Image();
  const entry = {
    image,
    loaded: false,
  };

  image.onload = () => {
    entry.loaded = true;
    requestRender();
  };
  image.src = src;
  playerAssetImageCache.set(src, entry);

  return entry;
}

function renderPlayerAsset(
  input: CanvasObjectRenderInput,
  player: PlayerObject,
) {
  const asset = player.props.asset;

  if (!asset) {
    return false;
  }

  if (typeof Image === "undefined") {
    return true;
  }

  const { context, object, appearance, frameTransform, requestRender } = input;
  const src = input.assetResolver?.getAssetSrc?.(asset, object) ?? asset.src;
  const entry = getPlayerAssetImage(src, requestRender);

  if (!entry.loaded) {
    return true;
  }

  const bounds = frameTransform.getObjectCanvasBounds(player);
  const width = getAbsoluteCanvasExtent(bounds.width);
  const height = getAbsoluteCanvasExtent(bounds.height);
  const radius = Math.min(width, height) / 2;
  const canvasFontSize = getCanvasFontSizeForPlayerLabel(
    radius,
    player.props.fontSize ?? DEFAULT_PLAYER_FONT_SIZE,
    frameTransform.scale,
  );

  context.save();
  context.globalAlpha = appearance === "preview" ? PREVIEW_OPACITY : 1;
  context.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  context.rotate(((player.rotation ?? 0) * Math.PI) / 180);
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.clip();
  context.drawImage(entry.image, -width / 2, -height / 2, width, height);

  if (player.props.label) {
    const labelOffsetY = 1 - getPlayerLabelVerticalOffset(frameTransform.scale);

    context.fillStyle = "#ffffff";
    context.font = `700 ${canvasFontSize}px "ui-rounded", "SF Pro Display", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "rgba(0, 0, 0, 0.55)";
    context.shadowBlur = 3;
    context.fillText(String(player.props.label), 0, labelOffsetY);
  }

  context.restore();

  return true;
}

export function renderPlayerMarker(
  input: CanvasObjectRenderInput,
  player: PlayerObject,
) {
  const { context, appearance, frameTransform } = input;

  if (renderPlayerAsset(input, player)) {
    return;
  }

  const bounds = frameTransform.getObjectCanvasBounds(player);
  const width = getAbsoluteCanvasExtent(bounds.width);
  const height = getAbsoluteCanvasExtent(bounds.height);
  const radius = Math.min(width, height) / 2;
  const textColor = getContrastingTextColor(player.props.color);
  const canvasFontSize = getCanvasFontSizeForPlayerLabel(
    radius,
    player.props.fontSize ?? DEFAULT_PLAYER_FONT_SIZE,
    frameTransform.scale,
  );

  context.save();
  context.globalAlpha = appearance === "preview" ? PREVIEW_OPACITY : 1;
  context.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  context.rotate(((player.rotation ?? 0) * Math.PI) / 180);

  context.fillStyle = player.props.color;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = DEFAULT_PLAYER_BORDER_COLOR;
  context.lineWidth = getPlayerBorderWidth(radius);
  context.stroke();

  if (player.props.label) {
    const labelOffsetY = 1 - getPlayerLabelVerticalOffset(frameTransform.scale);

    context.fillStyle = textColor;
    context.font = `700 ${canvasFontSize}px "ui-rounded", "SF Pro Display", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(player.props.label), 0, labelOffsetY);
  }

  context.restore();
}

function renderPlayerCaption(
  input: CanvasObjectRenderInput,
  player: PlayerObject,
) {
  const text = getPlayerCaptionText(player);
  const bounds = getPlayerCaptionCanvasBounds(player, input.frameTransform);

  if (!text || !bounds) {
    return;
  }

  const { context, appearance } = input;
  const fontSize = getPlayerCaptionCanvasFontSize(player, input.frameTransform);

  context.save();
  context.globalAlpha = appearance === "preview" ? PREVIEW_OPACITY : 1;
  context.fillStyle = player.props.caption?.style?.color ?? "#111827";
  context.font = `600 ${fontSize}px "ui-rounded", "SF Pro Display", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    text,
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  context.restore();
}

export function createPlayerRenderer(
  appearanceRenderers: PlayerAppearanceRendererRegistry = {},
): CanvasObjectRenderer {
  return (input) => {
    const player = input.object as PlayerObject;
    const appearanceId =
      player.props.appearanceId ?? DEFAULT_PLAYER_APPEARANCE_ID;
    const appearanceRenderer = appearanceRenderers[appearanceId];

    if (appearanceRenderer) {
      appearanceRenderer({ ...input, player });
    } else {
      renderPlayerMarker(input, player);
    }

    renderPlayerCaption(input, player);
  };
}

export const renderPlayer = createPlayerRenderer();

function hitTestPlayer({
  object,
  canvasPoint,
  frameTransform,
  minimumHitRadiusPx,
}: CanvasObjectHitTestInput) {
  const player = object as PlayerObject;
  const center = frameTransform.boardToCanvas(player.position);
  const bounds = frameTransform.getObjectCanvasBounds(player);
  const radius = Math.max(
    Math.min(bounds.width, bounds.height) / 2,
    minimumHitRadiusPx,
  );

  return (
    Math.hypot(canvasPoint.x - center.x, canvasPoint.y - center.y) <= radius ||
    hitTestPlayerCaption(player, frameTransform, canvasPoint)
  );
}
