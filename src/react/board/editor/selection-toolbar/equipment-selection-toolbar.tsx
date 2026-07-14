import {
  getEquipmentDefinition,
  updateEquipmentObject,
  type EquipmentObject,
} from "../../../../core/objects/equipment-object";
import { createToolApi } from "../../../../core/editor/create-tool-api";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarSeparator,
} from "../toolbar/editor-toolbar";
import { BoardEditorSelectionToolbarPositioner } from "./selection-toolbar-positioner";
import { BoardEditorSelectionActionsMenu } from "./selection-actions-menu";
import type { BoardEditorSelectionToolbarRendererProps } from "./selection-toolbar-types";
import {
  ColorPicker,
  ColorSwatch,
  DEFAULT_BOARD_COLORS,
} from "../../../ui/color-picker";
import { DEFAULT_BOARD_COLOR } from "../../../../core/colors/default-colors";
import { useBoardEditorLabels } from "../board-editor-labels";
import {
  BoardEditorSelectionToolbarPopover,
  BoardEditorSelectionToolbarPopoverContent,
  BoardEditorSelectionToolbarPopoverTrigger,
} from "./selection-toolbar-popover";

export function BoardEditorEquipmentSelectionToolbar({
  className,
  selectedObject,
  toolbarLeft,
  toolbarTop,
  toolbarBottom,
  viewportWidth,
  viewportHeight,
}: BoardEditorSelectionToolbarRendererProps<EquipmentObject>) {
  const labels = useBoardEditorLabels();
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);
  const definition = getEquipmentDefinition(selectedObject);
  const capabilities = definition?.capabilities ?? {};
  const color =
    selectedObject.props.color ??
    definition?.color ??
    DEFAULT_BOARD_COLOR.black;

  const updateEquipment = (
    input: Parameters<typeof updateEquipmentObject>[1],
  ) => {
    toolApi.updateObjects([selectedObject.id], (object) =>
      updateEquipmentObject(object as EquipmentObject, input),
    );
  };

  return (
    <BoardEditorSelectionToolbarPositioner
      anchorLeft={toolbarLeft}
      anchorTop={toolbarTop}
      anchorBottom={toolbarBottom}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
    >
      <BoardEditorToolbar
        aria-label={labels.selectionToolbar.equipmentProperties}
        className={className}
        controlSize="sm"
      >
        {capabilities.color ? (
          <BoardEditorSelectionToolbarPopover>
            <BoardEditorSelectionToolbarPopoverTrigger
              aria-label={labels.selectionToolbar.equipmentColor}
              tooltip={labels.selectionToolbar.color}
            >
              <ColorSwatch value={color} className="size-6" />
            </BoardEditorSelectionToolbarPopoverTrigger>
            <BoardEditorSelectionToolbarPopoverContent>
              <ColorPicker
                value={color}
                onChange={(value) => updateEquipment({ color: value })}
                chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
                defaultColors={[...DEFAULT_BOARD_COLORS]}
              />
            </BoardEditorSelectionToolbarPopoverContent>
          </BoardEditorSelectionToolbarPopover>
        ) : null}
        {capabilities.color ? <BoardEditorToolbarSeparator /> : null}
        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        />
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}
