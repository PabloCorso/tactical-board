import type { Point } from "../board/types";
import type { BoardEditorState } from "../editor/types";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import {
  TEXT_HORIZONTAL_PADDING_PX,
  TEXT_VERTICAL_PADDING_PX,
  createTextObject,
  updateTextObject,
  type TextObject,
} from "../objects/text-object";

const SURFACE_INSET = 14;

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

  return projection.canvasToBoard({
    x: bounds.x + (TEXT_HORIZONTAL_PADDING_PX * projection.scale) / 2,
    y: bounds.y + (TEXT_VERTICAL_PADDING_PX * projection.scale) / 2,
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
  const anchorCanvasPoint = projection.boardToCanvas(anchorPosition);
  const nextSize = nextObject.size ?? { width: 0, height: 0 };
  const horizontalPadding = TEXT_HORIZONTAL_PADDING_PX * projection.scale;
  const verticalPadding = TEXT_VERTICAL_PADDING_PX * projection.scale;

  return updateTextObject(nextObject, {
    position: projection.canvasToBoard({
      x:
        anchorCanvasPoint.x +
        (nextSize.width * projection.scale - horizontalPadding) / 2,
      y:
        anchorCanvasPoint.y +
        (nextSize.height * projection.scale - verticalPadding) / 2,
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
    }),
    {},
    anchorPosition,
    state,
    canvasRect,
  );
}
