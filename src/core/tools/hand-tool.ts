import type { ToolApi, ToolDefinition } from "./types";

type HandToolState = {
  lastClientPoint: {
    x: number;
    y: number;
  };
};

export class HandTool implements ToolDefinition {
  readonly id = "hand";
  readonly label = "Hand";

  getCursor(
    _event: Parameters<NonNullable<ToolDefinition["getCursor"]>>[0],
    api: ToolApi,
  ) {
    return api.getState().toolState.hand ? "grabbing" : "grab";
  }

  onPointerDown(
    event: Parameters<NonNullable<ToolDefinition["onPointerDown"]>>[0],
    api: ToolApi,
  ) {
    api.setToolState("hand", {
      lastClientPoint: event.clientPoint,
    } satisfies HandToolState);
  }

  onPointerMove(
    event: Parameters<NonNullable<ToolDefinition["onPointerMove"]>>[0],
    api: ToolApi,
  ) {
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
  }

  onPointerUp(
    _event: Parameters<NonNullable<ToolDefinition["onPointerUp"]>>[0],
    api: ToolApi,
  ) {
    api.clearToolState("hand");
  }
}
