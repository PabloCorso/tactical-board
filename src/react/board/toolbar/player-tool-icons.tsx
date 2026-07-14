import { useMemo } from "react";
import { DEFAULT_BOARD_COLOR } from "../../../core/colors/default-colors";
import type { BoardEditorState } from "../../../core/editor/types";
import {
  createPlayerObject,
  DEFAULT_PLAYER_FONT_SIZE,
  DEFAULT_PLAYER_SIZE,
} from "../../../core/objects/player-object";
import type { PlayerAppearanceRendererRegistry } from "../../../core/tools/player-appearance";
import { getNextNumericPlayerLabel } from "../../../core/tools/player-labels";
import {
  createPlayerRenderer,
  PlayerTool,
  renderPlayer,
} from "../../../core/tools/player-tool";
import {
  getPlayerToolState,
  PLAYER_TOOL_ID,
  type PlayerDraftStyle,
} from "../../../core/tools/player-tool-state";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { cn } from "../../ui/misc";
import { BoardToolIconCanvas } from "./tool-icon-canvas";
import { getThemeAwareToolIconColor } from "./tool-icon-color";

const PLAYER_ICON_FONT_SIZE_RATIO =
  DEFAULT_PLAYER_FONT_SIZE / DEFAULT_PLAYER_SIZE;

export function BoardPlayerDefaultIcon({
  appearanceRenderers,
  draftStyle,
  label,
  className,
  width = 24,
  height = 24,
}: {
  appearanceRenderers?: PlayerAppearanceRendererRegistry;
  draftStyle: PlayerDraftStyle;
  label?: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const player = useMemo(
    () => createPlayerToolIconPreviewObject({ draftStyle, label }),
    [draftStyle, label],
  );
  const renderer = useMemo(
    () =>
      appearanceRenderers
        ? createPlayerRenderer(appearanceRenderers)
        : renderPlayer,
    [appearanceRenderers],
  );

  return (
    <BoardToolIconCanvas
      object={player}
      renderer={renderer}
      className={cn("h-6 w-6", className)}
      width={width}
      height={height}
    />
  );
}

export function BoardPlayerToolIcon({
  appearanceRenderers,
  fallbackColor = DEFAULT_BOARD_COLOR.black,
}: {
  appearanceRenderers?: PlayerAppearanceRendererRegistry;
  fallbackColor?: string;
} = {}) {
  const store = useBoardEditorContext();
  const toolRegistry = useBoardEditorStore(
    store,
    (state) => state.toolRegistry,
  );
  const playerTool = toolRegistry.definitions[PLAYER_TOOL_ID];
  const toolState = useBoardEditorStore(store, (state) => state.toolState);
  const board = useBoardEditorStore(store, (state) => state.board);
  const draftStyle = useMemo(
    () => getPlayerToolIconDraftStyle({ toolRegistry, toolState }),
    [toolRegistry, toolState],
  );
  const color = draftStyle.color || fallbackColor;
  const label = useMemo(
    () =>
      playerTool instanceof PlayerTool &&
      playerTool.labelStrategy === "numeric-by-color"
        ? getNextNumericPlayerLabel(
            board,
            color,
            getPlayerToolState(toolState).activeGroupId,
          )
        : undefined,
    [board, color, playerTool, toolState],
  );

  return (
    <BoardPlayerDefaultIcon
      appearanceRenderers={appearanceRenderers}
      draftStyle={draftStyle}
      label={label}
    />
  );
}

export function createPlayerToolIconPreviewObject({
  draftStyle,
  label,
}: {
  draftStyle: PlayerDraftStyle;
  label?: string;
}) {
  const color =
    getThemeAwareToolIconColor(draftStyle.color) ?? draftStyle.color;

  return createPlayerObject({
    id: "player-icon-preview",
    position: { x: 0, y: 0 },
    size: { width: draftStyle.size, height: draftStyle.size },
    color,
    colors: draftStyle.colors,
    fontSize: Math.min(
      draftStyle.fontSize,
      draftStyle.size * PLAYER_ICON_FONT_SIZE_RATIO,
    ),
    appearanceId: draftStyle.appearanceId,
    options: draftStyle.options,
    asset: draftStyle.asset,
    label,
  });
}

export function getPlayerToolIconDraftStyle(
  state: Pick<BoardEditorState, "toolRegistry" | "toolState">,
) {
  const playerTool = state.toolRegistry.definitions[PLAYER_TOOL_ID];

  if (
    !(PLAYER_TOOL_ID in state.toolState) &&
    playerTool instanceof PlayerTool
  ) {
    return playerTool.getActivatedDraftStyle(state.toolState);
  }

  return getPlayerToolState(state.toolState).draftStyle;
}
