import type { BoardEditorState } from "../editor/types";
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
import {
  DEFAULT_PLAYER_TOOL_STATE,
  getPlayerToolState,
  PLAYER_TOOL_ID,
  type PlayerDraftStyle,
} from "./player-tool-state";
import {
  getAbsoluteCanvasExtent,
  getPlayerBorderWidth,
} from "../rendering/canvas/object-render-scale";

type PlayerToolLabelStrategy = "numeric-by-color" | "none";

export type PlayerToolPreset = {
  id: string;
  label: string;
  tooltip?: string;
  draftStyle: Partial<PlayerDraftStyle>;
};

type CreatePlayerToolOptions = {
  presets?: PlayerToolPreset[];
  labelStrategy?: PlayerToolLabelStrategy;
  renderer?: CanvasObjectRenderer;
};

const playerObjectDefinition = defineObjectDefinition({
  type: PLAYER_OBJECT_TYPE,
  selection: playerSelectionAdapter,
});

const PREVIEW_OPACITY = 0.55;
const DEFAULT_PLAYER_BORDER_COLOR = "#000000";

export class PlayerTool extends BoardEditorTool implements ToolDefinition {
  readonly id = PLAYER_TOOL_ID;
  readonly label = "Player";

  private readonly labelStrategy: PlayerToolLabelStrategy;
  private readonly presets: PlayerToolPreset[];
  private readonly renderer: CanvasObjectRenderer;

  constructor(options: CreatePlayerToolOptions = {}) {
    super();
    this.labelStrategy = options.labelStrategy ?? "numeric-by-color";
    this.presets = options.presets ?? [];
    this.renderer = options.renderer ?? renderPlayer;
  }

  onActivate(api: ToolApi) {
    const currentState = getPlayerToolState(api.getState().toolState);
    const nextDraftStyle = {
      ...DEFAULT_PLAYER_TOOL_STATE.draftStyle,
      ...currentState.draftStyle,
    };

    if (this.presets.length > 0) {
      Object.assign(nextDraftStyle, this.presets[0].draftStyle);
    }

    api.setToolState(PLAYER_TOOL_ID, {
      ...currentState,
      draftStyle: nextDraftStyle,
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
    const label =
      this.labelStrategy === "numeric-by-color"
        ? getNextNumericLabel(api, playerState, playerState.draftStyle.color)
        : undefined;

    clearSelection(api);
    api.addObjects([
      createPlayerPreviewObject({
        id: playerId,
        point: event.point,
        draftStyle: playerState.draftStyle,
        label,
      }),
    ]);

    if (this.labelStrategy === "numeric-by-color") {
      api.setToolState(PLAYER_TOOL_ID, {
        ...playerState,
        nextNumericLabelByColor: incrementNumericLabelForColor(
          playerState,
          playerState.draftStyle.color,
          label,
        ),
      });
    }
  }

  onPointerMove(
    event: Parameters<NonNullable<ToolDefinition["onPointerMove"]>>[0],
    api: ToolApi,
  ) {
    const state = api.getState();
    const playerState = getPlayerToolState(state.toolState);
    const label =
      this.labelStrategy === "numeric-by-color"
        ? getNextNumericLabel(api, playerState, playerState.draftStyle.color)
        : undefined;

    api.setPreviewObjects([
      createPlayerPreviewObject({
        id: "player-preview",
        point: event.point,
        draftStyle: playerState.draftStyle,
        label,
      }),
    ]);
  }
}

function createPlayerPreviewObject({
  id,
  point,
  draftStyle,
  label,
}: {
  id: string;
  point: Parameters<NonNullable<ToolDefinition["onPointerMove"]>>[0]["point"];
  draftStyle: ReturnType<typeof getPlayerToolState>["draftStyle"];
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
    color: draftStyle.color,
    label,
  });
}

function normalizeColorKey(color: string) {
  return color.trim().toLowerCase();
}

function parseNumericLabel(label: unknown) {
  if (typeof label !== "string" || label.trim() === "") {
    return undefined;
  }

  const value = Number.parseInt(label, 10);
  if (!Number.isFinite(value) || String(value) !== label.trim()) {
    return undefined;
  }

  return value;
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

export function renderPlayer({
  context,
  object,
  appearance,
  frameTransform,
}: CanvasObjectRenderInput) {
  const player = object as PlayerObject;
  const bounds = frameTransform.getObjectCanvasBounds(player);
  const width = getAbsoluteCanvasExtent(bounds.width);
  const height = getAbsoluteCanvasExtent(bounds.height);
  const radius = Math.min(width, height) / 2;
  const textColor = getContrastingTextColor(player.props.color);

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
    const canvasFontSize =
      (player.props.fontSize ?? DEFAULT_PLAYER_FONT_SIZE) *
      frameTransform.scale;

    context.fillStyle = textColor;
    context.font = `700 ${canvasFontSize}px "ui-rounded", "SF Pro Display", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(player.props.label), 0, 1);
  }

  context.restore();
}

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
    Math.hypot(canvasPoint.x - center.x, canvasPoint.y - center.y) <= radius
  );
}

function getNextNumericLabelFromState(
  state: Pick<BoardEditorState, "board">,
  playerState: ReturnType<typeof getPlayerToolState>,
  color: string,
) {
  const colorKey = normalizeColorKey(color);
  const nextLabelFromState = playerState.nextNumericLabelByColor[colorKey] ?? 1;
  const nextLabelFromBoard =
    Math.max(
      0,
      ...Object.values(state.board.objects.byId)
        .filter(
          (object) =>
            object.type === PLAYER_OBJECT_TYPE &&
            typeof object.props.color === "string" &&
            normalizeColorKey(object.props.color) === colorKey,
        )
        .map((object) => parseNumericLabel(object.props.label))
        .filter((value): value is number => typeof value === "number"),
    ) + 1;

  return String(Math.max(nextLabelFromState, nextLabelFromBoard));
}

function getNextNumericLabel(
  api: ToolApi,
  playerState: ReturnType<typeof getPlayerToolState>,
  color: string,
) {
  return getNextNumericLabelFromState(api.getState(), playerState, color);
}

function incrementNumericLabelForColor(
  playerState: ReturnType<typeof getPlayerToolState>,
  color: string,
  placedLabel: string | undefined,
) {
  const colorKey = normalizeColorKey(color);
  const numericPlacedLabel = parseNumericLabel(placedLabel);

  return {
    ...playerState.nextNumericLabelByColor,
    [colorKey]:
      typeof numericPlacedLabel === "number"
        ? numericPlacedLabel + 1
        : (playerState.nextNumericLabelByColor[colorKey] ?? 1) + 1,
  };
}
