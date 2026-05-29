import { DotsThreeVerticalIcon } from "@phosphor-icons/react";
import type { ObjectId } from "../../../../core/board/types";
import {
  canBringObjectToFront,
  canSendObjectToBack,
} from "../../../../core/board/object-order";
import { createToolApi } from "../../../../core/editor/create-tool-api";
import {
  deleteSelectedObjects,
  setSelectedObjectIds,
} from "../../../../core/tools/select-tool-actions";
import { useBoardEditorStore } from "../../../adapter/editor/use-board-editor-store";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import { BoardEditorToolbarButton } from "../toolbar/editor-toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";

export type BoardEditorSelectionActionsMenuProps = {
  selectedObjectIds: ObjectId[];
};

export function BoardEditorSelectionActionsMenu({
  selectedObjectIds,
}: BoardEditorSelectionActionsMenuProps) {
  const store = useBoardEditorContext();
  const board = useBoardEditorStore(store, (state) => state.board);
  const toolApi = createToolApi(store);
  const canBringToFront = selectedObjectIds.some((objectId) =>
    canBringObjectToFront(board, objectId),
  );
  const canSendToBack = selectedObjectIds.some((objectId) =>
    canSendObjectToBack(board, objectId),
  );

  const handleDuplicate = () => {
    const duplicateIds = toolApi.duplicateObjects(selectedObjectIds);

    if (duplicateIds.length > 0) {
      setSelectedObjectIds(toolApi, duplicateIds);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {(triggerProps) => (
          <BoardEditorToolbarButton
            aria-label="More actions"
            iconBefore={<DotsThreeVerticalIcon weight="bold" />}
            tooltip="More actions"
            {...triggerProps}
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" sideOffset={8}>
        <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={() => deleteSelectedObjects(toolApi)}>
          Delete
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canBringToFront}
          onClick={() => toolApi.bringObjectsToFront(selectedObjectIds)}
        >
          Bring to front
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canSendToBack}
          onClick={() => toolApi.sendObjectsToBack(selectedObjectIds)}
        >
          Send to back
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
