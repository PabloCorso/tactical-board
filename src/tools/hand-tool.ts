import type { ToolDefinition } from "../core/tools/types";

interface HandToolState {
  lastClientPoint: {
    x: number;
    y: number;
  };
}

export const handTool: ToolDefinition = {
  id: "hand",
  label: "Hand",
  onPointerDown: (event, api) => {
    api.setToolState("hand", {
      lastClientPoint: event.clientPoint,
    } satisfies HandToolState);
  },
  onPointerMove: (event, api) => {
    const toolState = api.getState().toolState.hand as
      | HandToolState
      | undefined;
    if (!toolState) {
      return;
    }

    api.panViewport({
      x: event.clientPoint.x - toolState.lastClientPoint.x,
      y: event.clientPoint.y - toolState.lastClientPoint.y,
    });
    api.setToolState("hand", {
      lastClientPoint: event.clientPoint,
    } satisfies HandToolState);
  },
  onPointerUp: (_event, api) => {
    api.clearToolState("hand");
  },
};
