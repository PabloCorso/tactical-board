import { createBoardSpaceProjection } from "../../core/geometry/board-space-projection";
import { createToolApi } from "../../core/editor/create-tool-api";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import { Button } from "./ui/button";
import { ARROW_TOOL_ID, getArrowToolState } from "../../tools/arrow-tool-state";
import { finishPendingArrow } from "../../tools/arrow-tool";

const BUTTON_OFFSET_PX = 12;

export function BoardEditorArrowRouteDone() {
  const store = useBoardEditorContext();
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const arrowState = getArrowToolState(state.toolState);

  if (
    state.ui.activeToolId !== ARROW_TOOL_ID ||
    arrowState.draftStyle.geometry !== "polyline" ||
    arrowState.pendingPoints.length < 2 ||
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
    arrowState.pendingPoints[arrowState.pendingPoints.length - 1],
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
          onClick={() => finishPendingArrow(toolApi)}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
