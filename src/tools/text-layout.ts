import type { Point } from "../core/board/types";
import type { BoardEditorState } from "../core/editor/types";
import { createBoardSpaceProjection } from "../core/geometry/board-space-projection";
import {
  TEXT_HORIZONTAL_PADDING_PX,
  TEXT_VERTICAL_PADDING_PX,
  createTextObject,
  updateTextObject,
  type TextObject,
} from "../core/objects/text-object";

const SURFACE_INSET = 14;

function getTextCanvasScale(
  object: TextObject,
  projection: ReturnType<typeof createTextToolProjection>,
) {
  return projection.pixelsPerUnit / object.props.referencePixelsPerUnit;
}

export function createTextToolProjection(
  state: Pick<BoardEditorState, "board" | "ui">,
  canvasRect: { width: number; height: number },
) {
  return createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect,
    surfaceInset: SURFACE_INSET,
  });
}

export function getTextAnchorPosition(
  object: TextObject,
  state: Pick<BoardEditorState, "board" | "ui">,
  canvasRect: { width: number; height: number },
) {
  const projection = createTextToolProjection(state, canvasRect);
  const bounds = projection.getObjectCanvasBounds(object);
  const scale = getTextCanvasScale(object, projection);

  return projection.canvasToWorld({
    x: bounds.x + (TEXT_HORIZONTAL_PADDING_PX * scale) / 2,
    y: bounds.y + (TEXT_VERTICAL_PADDING_PX * scale) / 2,
  });
}

export function updateAnchoredTextObject(
  object: TextObject,
  input: Parameters<typeof updateTextObject>[1],
  anchorPosition: Point,
  state: Pick<BoardEditorState, "board" | "ui">,
  canvasRect: { width: number; height: number },
) {
  const projection = createTextToolProjection(state, canvasRect);
  const nextObject = updateTextObject(object, input);
  const anchorCanvasPoint = projection.worldToCanvas(anchorPosition);
  const nextSize = nextObject.size ?? { width: 0, height: 0 };
  const scale = getTextCanvasScale(nextObject, projection);
  const horizontalPadding = TEXT_HORIZONTAL_PADDING_PX * scale;
  const verticalPadding = TEXT_VERTICAL_PADDING_PX * scale;

  return updateTextObject(nextObject, {
    position: projection.canvasToWorld({
      x:
        anchorCanvasPoint.x +
        (nextSize.width * projection.pixelsPerUnit - horizontalPadding) / 2,
      y:
        anchorCanvasPoint.y +
        (nextSize.height * projection.pixelsPerUnit - verticalPadding) / 2,
    }),
  });
}

export function createAnchoredTextObject(
  input: Omit<Parameters<typeof createTextObject>[0], "position"> & {
    anchorPosition: Point;
  },
  state: Pick<BoardEditorState, "board" | "ui">,
  canvasRect: { width: number; height: number },
) {
  const { anchorPosition, ...objectInput } = input;

  return updateAnchoredTextObject(
    createTextObject({
      ...objectInput,
      position: anchorPosition,
      referencePixelsPerUnit:
        createTextToolProjection(state, canvasRect).pixelsPerUnit /
        Math.max(state.ui.viewport.zoom, 1e-9),
    }),
    {},
    anchorPosition,
    state,
    canvasRect,
  );
}
