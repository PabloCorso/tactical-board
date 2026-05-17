import type { BoardEditorStore } from "../store/board-editor-store";
import type { ToolApi } from "../tools/types";

export function createToolApi(store: BoardEditorStore): ToolApi {
  const actions = store.getState().actions;

  return {
    getState: () => store.getState(),
    beginHistoryBatch: actions.beginHistoryBatch,
    endHistoryBatch: actions.endHistoryBatch,
    addObjects: actions.addObjects,
    bringObjectsToFront: actions.bringObjectsToFront,
    moveObjects: actions.moveObjects,
    duplicateObjects: actions.duplicateObjects,
    deleteObjects: actions.deleteObjects,
    sendObjectsToBack: actions.sendObjectsToBack,
    updateObjects: actions.updateObjects,
    setPreviewObjects: actions.setPreviewObjects,
    clearPreviewObjects: actions.clearPreviewObjects,
    panViewport: actions.panViewport,
    setSelectedObjectIds: actions.setSelectedObjectIds,
    clearSelection: actions.clearSelection,
    setToolState: actions.setToolState,
    clearToolState: actions.clearToolState,
    registerObjectRenderer: actions.registerObjectRenderer,
    registerObjectHitTester: actions.registerObjectHitTester,
    registerOverlayRenderer: actions.registerOverlayRenderer,
    registerObjectDefinition: actions.registerObjectDefinition,
  };
}
