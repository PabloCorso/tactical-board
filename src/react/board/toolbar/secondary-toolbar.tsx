import type { ReactNode } from "react";
import { type BoardEditorToolbarProps } from "../editor/toolbar/editor-toolbar";
import { BOARD_PLAYER_DEFAULTS } from "../theme/board-tool-defaults";
import { BoardEditorArrowToolbar } from "./secondary-toolbar-arrow";
import { BoardEditorEquipmentToolbar } from "./secondary-toolbar-equipment";
import { BoardEditorPlayerGroupToolbar } from "./secondary-toolbar-player";
import { BoardEditorShapeToolbar } from "./secondary-toolbar-shape";
import type { BoardTheme, BoardThemeAdapters } from "../theme/board-theme";
import type { ArrowToolDefault } from "../../../core/tools/arrow-tool";
import type { PlayerToolDefault } from "../../../core/tools/player-tool";
import type { ShapeToolDefault } from "../../../core/tools/shape-tool";

type BoardEditorSecondaryToolbarChromeProps = Omit<
  BoardEditorToolbarProps,
  "children"
>;

export type BoardEditorSecondaryToolbarsProps =
  BoardEditorSecondaryToolbarChromeProps & {
    adapters?: BoardThemeAdapters;
    children?: ReactNode;
    theme?: Pick<BoardTheme, "objects" | "playerAppearances">;
  };

/**
 * The standard set of Board secondary toolbars. Each child toolbar owns its
 * active Tool check, so Host Apps can expand this recipe and configure each
 * toolbar independently when needed.
 */
export function BoardEditorSecondaryToolbars({
  adapters,
  children,
  orientation = "vertical",
  theme,
  ...toolbarProps
}: BoardEditorSecondaryToolbarsProps) {
  const commonProps = { ...toolbarProps, orientation };

  return (
    <>
      <BoardEditorPlayerGroupToolbar
        {...commonProps}
        adapters={adapters}
      >
        {children}
      </BoardEditorPlayerGroupToolbar>
      <BoardEditorEquipmentToolbar
        {...commonProps}
        adapters={adapters}
        theme={theme}
      />
      <BoardEditorArrowToolbar {...commonProps} />
      <BoardEditorShapeToolbar {...commonProps} />
    </>
  );
}

export type BoardEditorSecondaryToolbarProps =
  BoardEditorSecondaryToolbarChromeProps & {
    arrowDefaults?: readonly ArrowToolDefault[];
    playerDefaults?: readonly PlayerToolDefault[];
    playerGroupPanelSections?: ReactNode;
    shapeDefaults?: readonly ShapeToolDefault[];
    theme?: Pick<BoardTheme, "objects" | "playerAppearances">;
    adapters?: BoardThemeAdapters;
  };

/**
 * @deprecated Compose the individual self-gating toolbar modules, or use
 * BoardEditorSecondaryToolbars for the standard recipe.
 */
export function BoardEditorSecondaryToolbar({
  adapters,
  arrowDefaults,
  orientation = "vertical",
  playerDefaults = BOARD_PLAYER_DEFAULTS,
  playerGroupPanelSections,
  shapeDefaults,
  theme,
  ...toolbarProps
}: BoardEditorSecondaryToolbarProps) {
  const commonProps = { ...toolbarProps, orientation };

  return (
    <>
      {playerDefaults.length > 0 ? (
        <BoardEditorPlayerGroupToolbar
          {...commonProps}
          adapters={adapters}
        >
          {playerGroupPanelSections}
        </BoardEditorPlayerGroupToolbar>
      ) : null}
      <BoardEditorEquipmentToolbar
        {...commonProps}
        adapters={adapters}
        theme={theme}
      />
      <BoardEditorArrowToolbar {...commonProps} defaults={arrowDefaults} />
      <BoardEditorShapeToolbar {...commonProps} defaults={shapeDefaults} />
    </>
  );
}
