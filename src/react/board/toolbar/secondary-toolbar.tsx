import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { type BoardEditorToolbarProps } from "../editor/toolbar/editor-toolbar";
import {
  BOARD_ARROW_DEFAULTS,
  BOARD_PLAYER_DEFAULTS,
  BOARD_SHAPE_DEFAULTS,
} from "../theme/board-tool-defaults";
import { BoardEditorArrowToolbar } from "./secondary-toolbar-arrow";
import { BoardEditorEquipmentToolbar } from "./secondary-toolbar-equipment";
import { BoardEditorPlayerGroupToolbar } from "./secondary-toolbar-player";
import { BoardEditorShapeToolbar } from "./secondary-toolbar-shape";
import { ARROW_TOOL_ID } from "../../../core/tools/arrow-tool-state";
import { EQUIPMENT_TOOL_ID } from "../../../core/tools/equipment-tool-state";
import { PLAYER_TOOL_ID } from "../../../core/tools/player-tool-state";
import { SHAPE_TOOL_ID } from "../../../core/tools/shape-tool-state";
import type { BoardTheme, BoardThemeAdapters } from "../theme/board-theme";
import type { ArrowToolDefault } from "../../../core/tools/arrow-tool";
import type { PlayerToolDefault } from "../../../core/tools/player-tool";
import type { ShapeToolDefault } from "../../../core/tools/shape-tool";

export type BoardEditorSecondaryToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  arrowDefaults?: ArrowToolDefault[];
  playerDefaults?: PlayerToolDefault[];
  shapeDefaults?: ShapeToolDefault[];
  theme?: Pick<BoardTheme, "objects" | "playerAppearances">;
  adapters?: BoardThemeAdapters;
};

export function BoardEditorSecondaryToolbar({
  arrowDefaults: arrowDefaultsProp,
  contentClassName,
  orientation = "vertical",
  playerDefaults: playerDefaultsProp,
  shapeDefaults: shapeDefaultsProp,
  adapters,
  theme,
  ...toolbarProps
}: BoardEditorSecondaryToolbarProps) {
  const editorStore = useBoardEditorContext();
  const activeToolId = useBoardEditorStore(
    editorStore,
    (state) => state.ui.activeToolId,
  );

  const arrowDefaults = arrowDefaultsProp ?? BOARD_ARROW_DEFAULTS;
  const playerDefaults = playerDefaultsProp ?? BOARD_PLAYER_DEFAULTS;
  const shapeDefaults = shapeDefaultsProp ?? BOARD_SHAPE_DEFAULTS;

  const commonProps = {
    ...toolbarProps,
    orientation,
  } as Omit<BoardEditorToolbarProps, "children">;

  if (activeToolId === PLAYER_TOOL_ID && playerDefaults.length > 0) {
    return (
      <BoardEditorPlayerGroupToolbar
        {...commonProps}
        adapters={adapters}
        contentClassName={contentClassName}
        theme={theme}
      />
    );
  }

  if (activeToolId === EQUIPMENT_TOOL_ID) {
    return (
      <BoardEditorEquipmentToolbar
        {...commonProps}
        adapters={adapters}
        theme={theme}
      />
    );
  }

  if (activeToolId === ARROW_TOOL_ID && arrowDefaults.length > 0) {
    return (
      <BoardEditorArrowToolbar defaults={arrowDefaults} {...commonProps} />
    );
  }

  if (activeToolId === SHAPE_TOOL_ID && shapeDefaults.length > 0) {
    return (
      <BoardEditorShapeToolbar defaults={shapeDefaults} {...commonProps} />
    );
  }

  return null;
}
