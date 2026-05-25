import type { ReactNode } from "react";
import { BoardEditorToolControl } from "../editor/toolbar/tool-control";
import {
  BoardEditorToolbar,
  BoardEditorToolbarSeparator,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import type { BoardTheme } from "../theme/board-theme";
import {
  BoardArrowToolIcon,
  BoardEquipmentToolIcon,
  BoardPlayerToolIcon,
  BoardShapeToolIcon,
} from "./tool-icons";

export type BoardPrimaryToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  theme?: Pick<BoardTheme, "equipment">;
  showEquipment?: boolean;
  children?: ReactNode;
};

export function BoardPrimaryToolbar({
  children,
  orientation = "vertical",
  showEquipment = false,
  theme,
  ...toolbarProps
}: BoardPrimaryToolbarProps) {
  const equipmentDefinitions = theme?.equipment?.definitions ?? [];

  return (
    <BoardEditorToolbar {...toolbarProps} orientation={orientation}>
      <BoardEditorToolControl toolId="select" />
      <BoardEditorToolControl toolId="hand" />
      <BoardEditorToolControl toolId="player" icon={<BoardPlayerToolIcon />} />
      {showEquipment ? (
        <BoardEditorToolControl
          toolId="equipment"
          icon={
            <BoardEquipmentToolIcon
              definitions={equipmentDefinitions}
              renderersByKind={theme?.equipment?.renderersByKind}
            />
          }
        />
      ) : null}
      <BoardEditorToolControl toolId="text" />
      <BoardEditorToolControl toolId="arrow" icon={<BoardArrowToolIcon />} />
      <BoardEditorToolControl toolId="shape" icon={<BoardShapeToolIcon />} />
      {children ? (
        <>
          <BoardEditorToolbarSeparator />
          {children}
        </>
      ) : null}
    </BoardEditorToolbar>
  );
}
