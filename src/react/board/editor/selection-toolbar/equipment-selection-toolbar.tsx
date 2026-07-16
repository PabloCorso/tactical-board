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
        <BoardEditorEquipmentSelectionControls
          selectedObjects={[selectedObject]}
        />
        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        />
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}

export type BoardEditorEquipmentSelectionControlsProps = {
  selectedObjects: EquipmentObject[];
};

export function BoardEditorEquipmentSelectionControls({
  selectedObjects,
}: BoardEditorEquipmentSelectionControlsProps) {
  const labels = useBoardEditorLabels();
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);
  const colors = selectedObjects.map(getEquipmentColor);
  const mixed = new Set(colors.map(normalizeColor)).size > 1;

  if (
    selectedObjects.length === 0 ||
    selectedObjects.some(
      (equipment) => !getEquipmentDefinition(equipment)?.capabilities?.color,
    )
  ) {
    return null;
  }

  const color = colors[0] ?? DEFAULT_BOARD_COLOR.black;
  const accessibleLabel = mixed
    ? labels.selectionToolbar.equipmentColorMixed
    : labels.selectionToolbar.equipmentColor;

  return (
    <>
      <BoardEditorSelectionToolbarPopover>
        <BoardEditorSelectionToolbarPopoverTrigger
          aria-label={accessibleLabel}
          tooltip={labels.selectionToolbar.color}
        >
          <ColorSwatch value={color} mixed={mixed} className="size-6" />
        </BoardEditorSelectionToolbarPopoverTrigger>
        <BoardEditorSelectionToolbarPopoverContent>
          <ColorPicker
            value={color}
            mixed={mixed}
            onChange={(value) => {
              toolApi.updateObjects(
                selectedObjects.map((equipment) => equipment.id),
                (object) =>
                  updateEquipmentObject(object as EquipmentObject, {
                    color: value,
                  }),
              );
            }}
            chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
            defaultColors={[...DEFAULT_BOARD_COLORS]}
          />
        </BoardEditorSelectionToolbarPopoverContent>
      </BoardEditorSelectionToolbarPopover>
      <BoardEditorToolbarSeparator />
    </>
  );
}

function getEquipmentColor(equipment: EquipmentObject) {
  return (
    equipment.props.color ??
    getEquipmentDefinition(equipment)?.color ??
    DEFAULT_BOARD_COLOR.black
  );
}

function normalizeColor(color: string) {
  return color.trim().toLowerCase();
}
