import {
  getEquipmentDefinition,
  updateEquipmentObject,
  type EquipmentObject,
} from "../../core/objects/equipment-object";
import { createToolApi } from "../../core/editor/create-tool-api";
import { useBoardEditorContext } from "./board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarPopoverButton,
  BoardEditorToolbarSeparator,
} from "./board-editor-toolbar";
import { BoardEditorSelectionToolbarPositioner } from "./board-editor-selection-toolbar-positioner";
import { BoardEditorSelectionActionsMenu } from "./board-editor-selection-actions-menu";
import type { BoardEditorSelectionToolbarRendererProps } from "./board-editor-selection-toolbar-types";
import { ColorPicker, DEFAULT_PRESET_COLORS } from "./ui/color-picker";
import { DEFAULT_PRESET_COLOR } from "../../core/colors/preset-colors";

export function BoardEditorEquipmentSelectionToolbar({
  className,
  selectedObject,
  toolbarLeft,
  toolbarTop,
  toolbarBottom,
  viewportWidth,
  viewportHeight,
}: BoardEditorSelectionToolbarRendererProps<EquipmentObject>) {
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);
  const definition = getEquipmentDefinition(selectedObject);
  const capabilities = definition?.capabilities ?? {};
  const color =
    selectedObject.props.color ??
    definition?.color ??
    DEFAULT_PRESET_COLOR.black;

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
      <BoardEditorToolbar className={className}>
        {capabilities.color ? (
          <BoardEditorToolbarPopoverButton
            ariaLabel="Equipment color"
            tooltip={`Color: ${color}`}
            content={
              <ColorPicker
                value={color}
                onChange={(value) => updateEquipment({ color: value })}
                presetColors={[...DEFAULT_PRESET_COLORS]}
              />
            }
            icon={
              <span
                className="border-default inline-flex h-5 w-5 rounded-full border"
                style={{
                  backgroundColor: color,
                }}
              >
                <span className="sr-only">{color}</span>
              </span>
            }
          />
        ) : null}
        {capabilities.color ? <BoardEditorToolbarSeparator /> : null}
        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        />
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}
