import { createBoardSpaceProjection } from "../../core/geometry/board-space-projection";
import { createToolApi } from "../../core/editor/create-tool-api";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import { Button } from "./ui/button";
import { getShapeToolState, SHAPE_TOOL_ID } from "../../tools/shape-tool-state";
import { completePendingPolygon } from "../../tools/shape-tool";

const BUTTON_OFFSET_PX = 12;

export function BoardEditorShapePolygonDone() {
  const store = useBoardEditorContext();
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const shapeState = getShapeToolState(state.toolState);

  if (
    state.ui.activeToolId !== SHAPE_TOOL_ID ||
    shapeState.draftStyle.kind !== "polygon" ||
    shapeState.pendingPoints.length < 3 ||
    !state.ui.canvasRect
  ) {
    return null;
  }

  const projection = createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect: state.ui.canvasRect,
    surfaceInset: 14,
  });
  const tip = projection.worldToCanvas(
    shapeState.pendingPoints[shapeState.pendingPoints.length - 1],
  );
  const toolApi = createToolApi(store);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 10 }}
    >
      <div
        className="pointer-events-auto absolute"
        style={{
          left: tip.x,
          top: tip.y - BUTTON_OFFSET_PX,
          transform: "translate(-50%, -100%)",
        }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => completePendingPolygon(toolApi)}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
