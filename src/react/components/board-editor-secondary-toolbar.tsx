import { CopyIcon, TrashIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { createToolApi } from "../../core/editor/create-tool-api";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import { BoardEditorToolbar } from "./board-editor-toolbar";
import { BoardEditorToolbarButton } from "./board-editor-toolbar-button";

export interface BoardEditorSecondaryToolbarProps {
  className?: string;
}

const EMPTY_SECONDARY_ACTIONS: [] = [];

function getSecondaryActionIcon(actionId: string) {
  switch (actionId) {
    case "duplicate-selection":
      return <CopyIcon aria-hidden="true" className="size-4" weight="bold" />;
    case "delete-selection":
      return <TrashIcon aria-hidden="true" className="size-4" weight="bold" />;
    default:
      return null;
  }
}

export function BoardEditorSecondaryToolbar({
  className,
}: BoardEditorSecondaryToolbarProps) {
  const store = useBoardEditorContext();
  const toolApi = useMemo(() => createToolApi(store), [store]);
  const currentTool = useBoardEditorStore(
    store,
    (state) => state.toolRegistry.definitions[state.ui.activeToolId],
  );
  const secondaryActions = useBoardEditorStore(store, (state) =>
    currentTool?.getSecondaryActions?.(state) ?? EMPTY_SECONDARY_ACTIONS,
  );

  if (secondaryActions.length === 0) {
    return null;
  }

  return (
    <BoardEditorToolbar className={className}>
      {secondaryActions.map((action) => {
        const icon = getSecondaryActionIcon(action.id);

        return (
          <BoardEditorToolbarButton
            aria-label={action.label}
            disabled={action.disabled}
            key={action.id}
            onClick={() => action.onSelect(toolApi)}
            tooltip={action.tooltip ?? action.label}
          >
            <span className="inline-flex items-center gap-2 px-1 text-sm font-medium">
              {icon}
              <span>{action.label}</span>
            </span>
          </BoardEditorToolbarButton>
        );
      })}
    </BoardEditorToolbar>
  );
}
