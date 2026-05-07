import type { ToolDefinition } from "../../core/tools/types";

interface SelectToolState {
  dragObjectIds: string[];
  lastPoint: {
    x: number;
    y: number;
  };
}

export const selectTool: ToolDefinition = {
  id: "select",
  label: "Select",
  onPointerDown: (event, api) => {
    const state = api.getState();

    if (event.targetObjectId) {
      const nextSelection = state.ui.selectedObjectIds.includes(
        event.targetObjectId,
      )
        ? state.ui.selectedObjectIds
        : [event.targetObjectId];

      api.setSelectedObjectIds(nextSelection);
      api.setToolState("select", {
        dragObjectIds: nextSelection,
        lastPoint: event.point,
      } satisfies SelectToolState);
      return;
    }

    api.clearSelection();
    api.clearToolState("select");
  },
  onPointerMove: (event, api) => {
    const toolState = api.getState().toolState.select as
      | SelectToolState
      | undefined;
    if (!toolState) {
      return;
    }

    const delta = {
      x: event.point.x - toolState.lastPoint.x,
      y: event.point.y - toolState.lastPoint.y,
    };

    if (delta.x === 0 && delta.y === 0) {
      return;
    }

    api.moveObjects(toolState.dragObjectIds, delta);
    api.setToolState("select", {
      ...toolState,
      lastPoint: event.point,
    } satisfies SelectToolState);
  },
  onPointerUp: (_event, api) => {
    api.clearToolState("select");
  },
};
