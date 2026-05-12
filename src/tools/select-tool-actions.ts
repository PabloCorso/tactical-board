import type { ObjectId } from "../core/board/types";
import type { ToolApi } from "../core/tools/types";
import { getSelectToolState, SELECT_TOOL_ID } from "./select-tool-state";

export function setSelectedObjectIds(api: ToolApi, objectIds: ObjectId[]) {
  const selectState = getSelectToolState(api.getState().toolState);

  api.setToolState(SELECT_TOOL_ID, {
    ...selectState,
    selectedObjectIds: [...objectIds],
  });
}

export function clearSelection(api: ToolApi) {
  const selectState = getSelectToolState(api.getState().toolState);

  api.setToolState(SELECT_TOOL_ID, {
    ...selectState,
    selectedObjectIds: [],
    interaction: undefined,
  });
}
