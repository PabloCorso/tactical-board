import type { BoardEditorStore } from "../store/board-editor-store";
import type { ToolApi } from "../tools/types";

export function createToolApi(store: BoardEditorStore): ToolApi {
  const actions = store.getState().actions;

  return {
    getState: () => store.getState(),
    moveObjects: actions.moveObjects,
    duplicateObjects: actions.duplicateObjects,
    deleteObjects: actions.deleteObjects,
    setPreviewObjects: actions.setPreviewObjects,
    clearPreviewObjects: actions.clearPreviewObjects,
    panViewport: actions.panViewport,
    setToolState: actions.setToolState,
    clearToolState: actions.clearToolState,
    registerObjectRenderer: actions.registerObjectRenderer,
    registerOverlayRenderer: actions.registerOverlayRenderer,
  };
}
