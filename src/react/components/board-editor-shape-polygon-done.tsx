import { createBoardSpaceProjection } from "../../core/geometry/board-space-projection";
import { createToolApi } from "../../core/editor/create-tool-api";
import { createShapeObject } from "../../core/objects/shape-object";
import { completePendingPolygon } from "../../tools/shape-tool";
import { getShapeToolState, SHAPE_TOOL_ID } from "../../tools/shape-tool-state";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import { cn } from "./misc";

const CLOSE_MARKER_SIZE_PX = 16;

export function BoardEditorShapePolygonDone() {
  const store = useBoardEditorContext();
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const shapeState = getShapeToolState(state.toolState);
  const toolApi = createToolApi(store);

  if (
    state.ui.activeToolId !== SHAPE_TOOL_ID ||
    shapeState.draftStyle.kind !== "polygon" ||
    shapeState.pendingPoints.length < 2 ||
    !state.ui.canvasRect
  ) {
    return null;
  }

  const canClose = shapeState.pendingPoints.length >= 3;

  const projection = createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect: state.ui.canvasRect,
    surfaceInset: 14,
  });
  const firstPoint = projection.worldToCanvas(shapeState.pendingPoints[0]);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 10 }}
    >
      <button
        type="button"
        aria-label={canClose ? "Close polygon" : "Add one more vertex to close"}
        className={cn(
          "absolute flex items-center justify-center rounded-full border bg-transparent text-black transition-all duration-150",
          canClose
            ? "pointer-events-auto cursor-pointer border-black/70 hover:scale-110 hover:border-black hover:shadow-sm"
            : "border-black/35 opacity-70",
        )}
        disabled={!canClose}
        onClick={() => {
          if (canClose) {
            completePendingPolygon(toolApi);
          }
        }}
        onPointerEnter={() => {
          if (!canClose) {
            return;
          }

          toolApi.setPreviewObjects([
            createShapeObject({
              id: "shape-preview",
              points: shapeState.pendingPoints,
              ...shapeState.draftStyle,
            }),
          ]);
        }}
        style={{
          left: firstPoint.x,
          top: firstPoint.y,
          width: CLOSE_MARKER_SIZE_PX,
          height: CLOSE_MARKER_SIZE_PX,
          transform: "translate(-50%, -50%)",
        }}
        title={canClose ? "Close polygon" : "Add one more vertex to close"}
      >
        <svg
          className="block size-full"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6.5 6.5 13.5 13.5" />
          <path d="M13.5 6.5 6.5 13.5" />
        </svg>
      </button>
    </div>
  );
}
