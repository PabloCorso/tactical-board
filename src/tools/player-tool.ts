import type { BoardEditorState } from "../core/editor/types";
import type {
  ToolActionDefinition,
  ToolActionIcon,
  ToolApi,
  ToolDefinition,
} from "../core/tools/types";
import { BoardEditorTool } from "../core/tools/tool";
import { defineObjectDefinition } from "../core/objects/types";
import {
  createPlayerObject,
  PLAYER_OBJECT_TYPE,
  type PlayerObject,
} from "../core/objects/player-object";
import { renderObjectAppearanceAsset } from "../rendering/canvas/object-appearance-renderer";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
} from "../rendering/canvas/types";
import { clearSelection } from "./select-tool-actions";
import { playerSelectionAdapter } from "./player-selection";
import {
  DEFAULT_PLAYER_TOOL_STATE,
  getPlayerToolState,
  PLAYER_TOOL_ID,
  type PlayerDraftStyle,
} from "./player-tool-state";

type PlayerToolLabelStrategy = "numeric-by-color" | "none";

interface PlayerToolPreset {
  id: string;
  label: string;
  icon?: ToolActionIcon;
  tooltip?: string;
  draftStyle: Partial<PlayerDraftStyle>;
}

interface CreatePlayerToolOptions {
  presets?: PlayerToolPreset[];
  labelStrategy?: PlayerToolLabelStrategy;
}

const playerObjectDefinition = defineObjectDefinition({
  type: PLAYER_OBJECT_TYPE,
  selection: playerSelectionAdapter,
});

const PREVIEW_OPACITY = 0.55;
const DEFAULT_PLAYER_BORDER_WIDTH_PX = 3;
const DEFAULT_PLAYER_BORDER_COLOR = "#000000";

export class PlayerTool extends BoardEditorTool implements ToolDefinition {
  readonly id = PLAYER_TOOL_ID;
  readonly label = "Player";

  private readonly labelStrategy: PlayerToolLabelStrategy;
  private readonly presets: PlayerToolPreset[];
  private readonly getPresetActions?;

  constructor(options: CreatePlayerToolOptions = {}) {
    super();
    this.labelStrategy = options.labelStrategy ?? "numeric-by-color";
    this.presets = options.presets ?? [];
    this.getPresetActions =
      this.presets.length > 0
        ? createPresetSecondaryActions(this.presets, this.labelStrategy)
        : undefined;
  }

  getSecondaryActions(state: BoardEditorState) {
    return this.getPresetActions?.(state) ?? [];
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

  registerCapabilities(
    api: Parameters<NonNullable<ToolDefinition["registerCapabilities"]>>[0],
  ) {
    api.registerObjectRenderer(PLAYER_OBJECT_TYPE, renderPlayer);
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
      createPlayerObject({
        id: playerId,
        position: event.point,
        rotation: 0,
        size: {
          width: playerState.draftStyle.size,
          height: playerState.draftStyle.size,
          mode: "world",
          unit: state.board.surface.unit,
        },
        color: playerState.draftStyle.color,
        appearance: playerState.draftStyle.appearance,
        label,
        unit: state.board.surface.unit,
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

function isPlayerPresetActive(
  draftStyle: PlayerDraftStyle,
  presetDraftStyle: Partial<PlayerDraftStyle>,
) {
  return (
    Object.entries(presetDraftStyle) as Array<
      [keyof PlayerDraftStyle, PlayerDraftStyle[keyof PlayerDraftStyle]]
    >
  ).every(([key, value]) => {
    const currentValue = draftStyle[key];

    if (typeof value === "object" && value !== null) {
      return JSON.stringify(currentValue) === JSON.stringify(value);
    }

    return currentValue === value;
  });
}

function setPlayerToolState(
  api: ToolApi,
  updater: (
    state: ReturnType<typeof getPlayerToolState>,
  ) => ReturnType<typeof getPlayerToolState>,
) {
  api.setToolState(
    PLAYER_TOOL_ID,
    updater(getPlayerToolState(api.getState().toolState)),
  );
}

function setPlayerDraftStyle(
  api: ToolApi,
  draftStyle: Partial<PlayerDraftStyle>,
) {
  setPlayerToolState(api, (state) => ({
    ...state,
    draftStyle: {
      ...state.draftStyle,
      ...draftStyle,
    },
  }));
}

function applyPlayerPreset(
  api: ToolApi,
  preset: Pick<PlayerToolPreset, "draftStyle">,
) {
  setPlayerDraftStyle(api, preset.draftStyle);
}

function renderPlayer({
  context,
  object,
  appearance,
  requestRender,
  surfaceTransform,
}: CanvasObjectRenderInput) {
  const player = object as PlayerObject;
  const bounds = surfaceTransform.getObjectCanvasBounds(player);
  const width = Math.max(8, Math.abs(bounds.width));
  const height = Math.max(8, Math.abs(bounds.height));
  const radius = Math.min(width, height) / 2;
  const textColor = getContrastingTextColor(player.props.color);

  context.save();
  context.globalAlpha = appearance === "preview" ? PREVIEW_OPACITY : 1;
  context.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  context.rotate(((player.rotation ?? 0) * Math.PI) / 180);

  const renderedAsset = renderObjectAppearanceAsset({
    appearance: player.props.appearance,
    context,
    height,
    requestRender,
    width,
  });

  if (!renderedAsset) {
    context.fillStyle = player.props.color;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = DEFAULT_PLAYER_BORDER_COLOR;
    context.lineWidth = DEFAULT_PLAYER_BORDER_WIDTH_PX;
    context.stroke();
  }

  if (player.props.label) {
    context.fillStyle = textColor;
    context.font = `700 ${Math.max(12, radius * 0.95)}px "ui-rounded", "SF Pro Display", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(player.props.label), 0, 1);
  }

  context.restore();
}

function hitTestPlayer({
  object,
  canvasPoint,
  surfaceTransform,
  minimumHitRadiusPx,
}: CanvasObjectHitTestInput) {
  const player = object as PlayerObject;
  const center = surfaceTransform.worldToCanvas(player.position);
  const bounds = surfaceTransform.getObjectCanvasBounds(player);
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

function createPresetSecondaryActions(
  presets: PlayerToolPreset[],
  labelStrategy: PlayerToolLabelStrategy,
): (state: BoardEditorState) => ToolActionDefinition[] {
  return (state) => {
    const playerState = getPlayerToolState(state.toolState);

    return presets.map((preset): ToolActionDefinition => {
      const numericLabel =
        labelStrategy === "numeric-by-color" &&
        typeof preset.draftStyle.color === "string"
          ? getNextNumericLabelFromState(
              state,
              playerState,
              preset.draftStyle.color,
            )
          : undefined;

      return {
        id: preset.id,
        label: numericLabel ?? preset.label,
        icon:
          preset.icon ??
          (preset.draftStyle.color
            ? { kind: "color", value: preset.draftStyle.color }
            : undefined),
        tooltip: preset.tooltip ?? preset.label,
        disabled: false,
        active: isPlayerPresetActive(playerState.draftStyle, preset.draftStyle),
        onSelect: (api) => applyPlayerPreset(api, preset),
      };
    });
  };
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
