import { DotsThreeVerticalIcon } from "@phosphor-icons/react";
import type { ObjectId } from "../../core/board/types";
import {
  canBringObjectToFront,
  canSendObjectToBack,
} from "../../core/board/object-order";
import { createToolApi } from "../../core/editor/create-tool-api";
import {
  deleteSelectedObjects,
  setSelectedObjectIds,
} from "../../tools/select-tool-actions";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import {
  BoardEditorToolbarButton,
  BoardEditorToolbarSeparator,
} from "./board-editor-toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export type BoardEditorSelectionActionsMenuProps = {
  selectedObjectIds: ObjectId[];
  showSeparator?: boolean;
};

export function BoardEditorSelectionActionsMenu({
  selectedObjectIds,
  showSeparator = true,
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
    <>
      {showSeparator ? <BoardEditorToolbarSeparator /> : null}
      <DropdownMenu>
        <DropdownMenuTrigger>
          {(triggerProps) => (
            <BoardEditorToolbarButton
              aria-label="More actions"
              iconSize="xl"
              iconBefore={<DotsThreeVerticalIcon weight="bold" />}
              tooltip="More actions"
              {...triggerProps}
            />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          <DropdownMenuItem onClick={handleDuplicate}>
            Duplicate
          </DropdownMenuItem>
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
    </>
  );
}
