import type { ObjectId } from "../core/board/types";
import type { ToolApi } from "../core/tools/types";

export function setSelectedObjectIds(api: ToolApi, objectIds: ObjectId[]) {
  api.setSelectedObjectIds(objectIds);
}

export function clearSelection(api: ToolApi) {
  api.clearSelection();
}

export function selectAllObjects(api: ToolApi) {
  setSelectedObjectIds(api, api.getState().board.objects.order);
}

export function deleteSelectedObjects(api: ToolApi) {
  const selectedObjectIds = api.getState().selection.selectedObjectIds;

  if (selectedObjectIds.length === 0) {
    return;
  }

  api.deleteObjects(selectedObjectIds);
  clearSelection(api);
}
