import type { BoardObject } from "../../../../core/board/types";
import {
  getObjectColorSelectionState,
  updateObjectColor,
} from "../../../../core/objects/object-properties";
import { createToolApi } from "../../../../core/editor/create-tool-api";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../../adapter/editor/use-board-editor-store";
import {
  ColorPicker,
  ColorSwatch,
  DEFAULT_BOARD_COLORS,
} from "../../../ui/color-picker";
import { useBoardEditorLabels } from "../board-editor-labels";
import {
  BoardEditorSelectionToolbarPopover,
  BoardEditorSelectionToolbarPopoverContent,
  BoardEditorSelectionToolbarPopoverTrigger,
} from "./selection-toolbar-popover";

export type BoardEditorObjectColorSelectionControlProps = {
  selectedObjects: BoardObject[];
};

export function BoardEditorObjectColorSelectionControl({
  selectedObjects,
}: BoardEditorObjectColorSelectionControlProps) {
  const labels = useBoardEditorLabels();
  const store = useBoardEditorContext();
  const board = useBoardEditorStore(store, (state) => state.board);
  const toolApi = createToolApi(store);
  const selectionColor = getObjectColorSelectionState(board, selectedObjects);

  if (!selectionColor) {
    return null;
  }

  return (
    <BoardEditorSelectionToolbarPopover>
      <BoardEditorSelectionToolbarPopoverTrigger
        aria-label={
          selectionColor.mixed
            ? labels.selectionToolbar.colorMixed
            : labels.selectionToolbar.color
        }
        tooltip={labels.selectionToolbar.color}
      >
        <ColorSwatch
          value={selectionColor.color}
          mixed={selectionColor.mixed}
          className="size-6"
        />
      </BoardEditorSelectionToolbarPopoverTrigger>
      <BoardEditorSelectionToolbarPopoverContent>
        <ColorPicker
          value={selectionColor.color}
          mixed={selectionColor.mixed}
          onChange={(color) =>
            toolApi.updateObjects(
              selectedObjects.map((object) => object.id),
              (object) => updateObjectColor(object, color),
            )
          }
          chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
          defaultColors={[...DEFAULT_BOARD_COLORS]}
        />
      </BoardEditorSelectionToolbarPopoverContent>
    </BoardEditorSelectionToolbarPopover>
  );
}
