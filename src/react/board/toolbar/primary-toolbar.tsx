import { useMemo, type ReactNode } from "react";
import { EQUIPMENT_OBJECT_TYPE } from "../../../core/objects/equipment-object";
import { BoardEditorToolControl } from "../editor/toolbar/tool-control";
import {
  BoardEditorToolbar,
  BoardEditorToolbarSeparator,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import {
  createThemeObjectRenderer,
  type BoardThemeAdapters,
  type BoardTheme,
} from "../theme/board-theme";
import { getThemeEquipmentDefinitions } from "../theme/equipment-object-adapter";
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
  const equipmentDefinitions = getThemeEquipmentDefinitions(theme);
  const equipmentRenderer = useMemo(
    () =>
      createThemeObjectRenderer({
        adapters,
        theme,
        type: EQUIPMENT_OBJECT_TYPE,
      }),
    [adapters, theme],
  );

  return (
    <BoardEditorToolbar
      {...toolbarProps}
      orientation={orientation}
      tooltipSide="right"
    >
      <BoardEditorToolControl toolId="select" />
      <BoardEditorToolControl toolId="hand" />
      <BoardEditorToolControl toolId="player" icon={<BoardPlayerToolIcon />} />
      {showEquipment ? (
        <BoardEditorToolControl
          toolId="equipment"
          icon={
            equipmentRenderer ? (
              <BoardEquipmentToolIcon
                definitions={equipmentDefinitions}
                renderer={equipmentRenderer}
              />
            ) : undefined
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
