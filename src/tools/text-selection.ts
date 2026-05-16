import colors from "tailwindcss/colors";
import type { ObjectSelectionAdapter } from "../core/objects/object-selection";
import { type TextObject } from "../core/objects/text-object";
import { BoardEditorTextSelectionToolbar } from "../react/components/board-editor-selection-toolbar-text";
import {
  drawClosedCanvasPath,
  getBoundsFromCanvasPoints,
  getSelectionToolbarAnchorFromSelectionChrome,
  rotateOffset,
} from "./selection-geometry";

const TEXT_SELECTION_PADDING_PX = 6;

function getTextSelectionOutlineCanvasPoints(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<TextObject>["renderSelection"]>
  >[0]["projection"],
  object: TextObject,
) {
  const bounds = projection.getObjectCanvasBounds(object);
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const halfWidth = bounds.width / 2 + TEXT_SELECTION_PADDING_PX;
  const halfHeight = bounds.height / 2 + TEXT_SELECTION_PADDING_PX;

  return [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ].map((point) => {
    const rotated = rotateOffset(point.x, point.y, object.rotation);

    return {
      x: center.x + rotated.x,
      y: center.y + rotated.y,
    };
  });
}

export const textSelectionAdapter: ObjectSelectionAdapter<TextObject> = {
  getTransformCapabilities: () => ({
    move: true,
    resize: false,
    rotate: false,
  }),
  getCanvasBounds: ({ object, projection }) =>
    getBoundsFromCanvasPoints(
      getTextSelectionOutlineCanvasPoints(projection, object),
    ),
  renderSelection: ({ context, object, projection, color }) => {
    context.save();
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.fillStyle = colors.white;
    drawClosedCanvasPath(
      context,
      getTextSelectionOutlineCanvasPoints(projection, object),
    );
    context.stroke();
    context.restore();
  },
  getToolbarAnchor: ({ object, projection }) =>
    getSelectionToolbarAnchorFromSelectionChrome({
      left: projection.worldToCanvas(object.position).x,
      outlinePoints: getTextSelectionOutlineCanvasPoints(projection, object),
    }),
  toolbarRenderer: BoardEditorTextSelectionToolbar,
};
