import type { BoardEditorState } from "../editor/types";

export type SelectionPresentation = "interactive" | "passive" | "hidden";

export function getActiveSelectionPresentation(
  state: BoardEditorState,
): SelectionPresentation {
  const activeTool = state.toolRegistry.definitions[state.ui.activeToolId];

  return (
    activeTool?.getSelectionPresentation?.(state) ??
    (state.ui.activeToolId === state.ui.defaultToolId
      ? "interactive"
      : "passive")
  );
}

export function isSelectionInteractive(state: BoardEditorState) {
  return getActiveSelectionPresentation(state) === "interactive";
}
