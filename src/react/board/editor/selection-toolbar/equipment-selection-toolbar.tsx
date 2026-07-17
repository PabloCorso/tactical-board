import type { EquipmentObject } from "../../../../core/objects/equipment-object";
import {
  BoardEditorToolbar,
  BoardEditorToolbarSeparator,
} from "../toolbar/editor-toolbar";
import { BoardEditorSelectionToolbarPositioner } from "./selection-toolbar-positioner";
import { BoardEditorSelectionActionsMenu } from "./selection-actions-menu";
import type { BoardEditorSelectionToolbarRendererProps } from "./selection-toolbar-types";
import { useBoardEditorLabels } from "../board-editor-labels";
import { BoardEditorObjectColorSelectionControl } from "./object-color-selection-control";

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
        <BoardEditorObjectColorSelectionControl
          selectedObjects={[selectedObject]}
        />
        <BoardEditorToolbarSeparator />
        <BoardEditorSelectionActionsMenu
          selectedObjectIds={[selectedObject.id]}
        />
      </BoardEditorToolbar>
    </BoardEditorSelectionToolbarPositioner>
  );
}
