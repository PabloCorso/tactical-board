import type { ToolId } from "../../core/board/types";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import { getDefaultToolIcon } from "./board-editor-tool-icons";
import { BoardEditorToolbarButton } from "./board-editor-toolbar";
import type { IconRender } from "./ui/icon";

export type BoardEditorToolControlProps = {
  toolId: ToolId;
  label?: string;
  icon?: IconRender;
  className?: string;
};

export function BoardEditorToolControl({
  toolId,
  label,
  icon,
  className,
}: BoardEditorToolControlProps) {
  const store = useBoardEditorContext();
  const activeToolId = useBoardEditorStore(
    store,
    (state) => state.ui.activeToolId,
  );
  const tool = useBoardEditorStore(
    store,
    (state) => state.toolRegistry.definitions[toolId],
  );
  const actions = useBoardEditorStore(store, (state) => state.actions);

  if (!tool) {
    return null;
  }

  const resolvedLabel = label ?? tool.label;
  const resolvedIcon = icon ?? getDefaultToolIcon(toolId);

  return (
    <BoardEditorToolbarButton
      active={activeToolId === toolId}
      aria-label={resolvedLabel}
      className={className}
      iconBefore={resolvedIcon}
      onClick={() => actions.setActiveTool(toolId)}
      tooltip={resolvedLabel}
    />
  );
}
