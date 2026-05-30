import type { ReactNode } from "react";
import {
  BoardEditorArrowToolControl,
  BoardEditorEquipmentToolControl,
  BoardEditorHandToolControl,
  BoardEditorPlayerToolControl,
  BoardEditorSelectToolControl,
  BoardEditorShapeToolControl,
  BoardEditorTextToolControl,
} from "../editor/toolbar/tool-control";
import {
  BoardEditorToolbar,
  BoardEditorToolbarSeparator,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import type { BoardThemeAdapters, BoardTheme } from "../theme/board-theme";

export type BoardPrimaryToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  theme?: Pick<BoardTheme, "objects">;
  adapters?: BoardThemeAdapters;
  showEquipment?: boolean;
  children?: ReactNode;
};

export function BoardPrimaryToolbar({
  children,
  orientation = "vertical",
  showEquipment = false,
  adapters,
  theme,
  ...toolbarProps
}: BoardPrimaryToolbarProps) {
  return (
    <BoardEditorToolbar
      {...toolbarProps}
      orientation={orientation}
      tooltipSide="right"
    >
      <BoardEditorSelectToolControl />
      <BoardEditorHandToolControl />
      <BoardEditorPlayerToolControl />
      {showEquipment ? (
        <BoardEditorEquipmentToolControl adapters={adapters} theme={theme} />
      ) : null}
      <BoardEditorTextToolControl />
      <BoardEditorArrowToolControl />
      <BoardEditorShapeToolControl />
      {children ? (
        <>
          <BoardEditorToolbarSeparator />
          {children}
        </>
      ) : null}
    </BoardEditorToolbar>
  );
}
