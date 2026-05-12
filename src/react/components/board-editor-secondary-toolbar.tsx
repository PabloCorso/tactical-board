import { CopyIcon, TrashIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import type { BoardEditorState } from "../../core/editor/types";
import { createToolApi } from "../../core/editor/create-tool-api";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import { BoardEditorToolbar } from "./board-editor-toolbar";
import { BoardEditorToolbarButton } from "./board-editor-toolbar-button";
import type { IconProps } from "./ui/icon";

export type BoardEditorSecondaryToolbarProps = {
  className?: string;
};

const EMPTY_SECONDARY_ACTIONS: [] = [];

function getSecondaryActionIcon(actionId: string): IconProps["children"] {
  switch (actionId) {
    case "duplicate-selection":
      return <CopyIcon aria-hidden="true" className="size-4" weight="bold" />;
    case "delete-selection":
      return <TrashIcon aria-hidden="true" className="size-4" weight="bold" />;
    default:
      return undefined;
  }
}

export function BoardEditorSecondaryToolbar({
  className,
}: BoardEditorSecondaryToolbarProps) {
  const store = useBoardEditorContext();
  const toolApi = useMemo(() => createToolApi(store), [store]);
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const currentTool = state.toolRegistry.definitions[state.ui.activeToolId];
  const secondaryActions = useMemo(
    () =>
      currentTool?.getSecondaryActions?.(state as BoardEditorState) ??
      EMPTY_SECONDARY_ACTIONS,
    [currentTool, state],
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
            active={action.active}
            disabled={action.disabled}
            iconBefore={icon}
            key={action.id}
            onClick={() => action.onSelect(toolApi)}
            tooltip={action.tooltip ?? action.label}
          >
            {action.label}
          </BoardEditorToolbarButton>
        );
      })}
    </BoardEditorToolbar>
  );
}
