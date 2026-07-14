import type { ReactNode } from "react";
import { type BoardEditorToolbarProps } from "../editor/toolbar/editor-toolbar";
import { BoardEditorArrowToolbar } from "./secondary-toolbar-arrow";
import { BoardEditorEquipmentToolbar } from "./secondary-toolbar-equipment";
import { BoardEditorPlayerGroupToolbar } from "./secondary-toolbar-player";
import { BoardEditorShapeToolbar } from "./secondary-toolbar-shape";
import type { BoardTheme, BoardThemeAdapters } from "../theme/board-theme";

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
      <BoardEditorPlayerGroupToolbar {...commonProps} adapters={adapters}>
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
