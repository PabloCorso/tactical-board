import type { ReactNode } from "react";
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
import { useBoardEditorToolbarFloatingPortal } from "../toolbar/toolbar-dock";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";
import { useBoardEditorLabels } from "../board-editor-labels";

export type BoardEditorSelectionActionsMenuProps = {
  children?: ReactNode;
  selectedObjectIds: ObjectId[];
};

export function BoardEditorSelectionActionsMenu({
  children,
  selectedObjectIds,
}: BoardEditorSelectionActionsMenuProps) {
  const labels = useBoardEditorLabels();
  const store = useBoardEditorContext();
  const floatingPortal = useBoardEditorToolbarFloatingPortal();
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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger>
        {(triggerProps) => (
          <BoardEditorToolbarButton
            aria-label={labels.selectionActions.moreActions}
            iconBefore={<DotsThreeVerticalIcon weight="bold" />}
            tooltip={labels.selectionActions.moreActions}
            {...triggerProps}
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={8}
        portalContainer={floatingPortal.container}
        positionMethod={floatingPortal.positionMethod}
      >
        <DropdownMenuItem onClick={handleDuplicate}>
          {labels.selectionActions.duplicate}
        </DropdownMenuItem>
        {children}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canBringToFront}
          onClick={() => toolApi.bringObjectsToFront(selectedObjectIds)}
        >
          {labels.selectionActions.bringToFront}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canSendToBack}
          onClick={() => toolApi.sendObjectsToBack(selectedObjectIds)}
        >
          {labels.selectionActions.sendToBack}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          color="danger"
          onClick={() => deleteSelectedObjects(toolApi)}
        >
          {labels.selectionActions.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
