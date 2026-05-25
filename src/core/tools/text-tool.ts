import { defineObjectDefinition } from "../objects/types";
import {
  getTextLineMetrics,
  getWrappedTextLines,
  TEXT_FONT_FAMILY,
  TEXT_FONT_WEIGHT,
  TEXT_HORIZONTAL_PADDING_PX,
  TEXT_LINE_HEIGHT_RATIO,
  TEXT_VERTICAL_PADDING_PX,
  TEXT_OBJECT_TYPE,
  type TextObject,
} from "../objects/text-object";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
} from "../rendering/canvas/types";
import { BoardEditorTool } from "./tool";
import type { ToolApi, ToolDefinition } from "./types";
import { clearSelection, setSelectedObjectIds } from "./select-tool-actions";
import {
  DEFAULT_TEXT_TOOL_STATE,
  getTextToolState,
  TEXT_TOOL_ID,
} from "./text-tool-state";
import { createAnchoredTextObject } from "./text-layout";
import { textSelectionAdapter } from "./text-selection";
import {
  beginTextEditingSession,
  finishTextEditingSession,
} from "./text-editing";

const textObjectDefinition = defineObjectDefinition({
  type: TEXT_OBJECT_TYPE,
  selection: textSelectionAdapter,
  beginEditing: ({ object, state, canvasRect }) => {
    const textObject = object as TextObject;

    beginTextEditingSession({
      state,
      object: textObject,
      canvasRect,
    });
  },
});

export class TextTool extends BoardEditorTool implements ToolDefinition {
  readonly id = TEXT_TOOL_ID;
  readonly label = "Text";

  onActivate(api: ToolApi) {
    const textState = getTextToolState(api.getState().toolState);

    api.setToolState(TEXT_TOOL_ID, {
      ...DEFAULT_TEXT_TOOL_STATE,
      ...textState,
      draftStyle: {
        ...DEFAULT_TEXT_TOOL_STATE.draftStyle,
        ...textState.draftStyle,
      },
    });
  }

  onDeactivate(api: ToolApi) {
    api.clearPreviewObjects();
    finishTextEditingSession(api);
  }

  shouldFocusCanvasOnPointerDown() {
    return false;
  }

  registerCapabilities(
    api: Parameters<NonNullable<ToolDefinition["registerCapabilities"]>>[0],
  ) {
    api.registerObjectRenderer(TEXT_OBJECT_TYPE, renderText);
    api.registerObjectHitTester(TEXT_OBJECT_TYPE, hitTestText);
    api.registerObjectDefinition(textObjectDefinition);
  }

  onPointerDown(
    event: Parameters<NonNullable<ToolDefinition["onPointerDown"]>>[0],
    api: ToolApi,
  ) {
    const state = api.getState();
    const targetObject = event.targetObjectId
      ? state.board.objects.byId[event.targetObjectId]
      : undefined;

    finishTextEditingSession(api);

    if (targetObject?.type === TEXT_OBJECT_TYPE) {
      setSelectedObjectIds(api, [targetObject.id]);
      beginTextEditingSession({
        state,
        object: targetObject as TextObject,
        canvasRect: event.canvasRect,
      });
      return;
    }

    clearSelection(api);
    const nextState = api.getState();
    const textState = getTextToolState(nextState.toolState);
    const textObject = createAnchoredTextObject(
      {
        id: createTextId(nextState.board.objects.byId),
        anchorPosition: event.point,
        color: textState.draftStyle.color,
        fontSize: textState.draftStyle.fontSize,
        text: "",
      },
      nextState,
      event.canvasRect,
    );

    api.addObjects([textObject]);
    setSelectedObjectIds(api, [textObject.id]);
    beginTextEditingSession({
      state: api.getState(),
      object: textObject,
      canvasRect: event.canvasRect,
    });
  }

  onPointerMove(
    _event: Parameters<NonNullable<ToolDefinition["onPointerMove"]>>[0],
    api: ToolApi,
  ) {
    api.clearPreviewObjects();
  }
}

function createTextId(existingIds: Record<string, unknown>) {
  let index = 1;

  while (existingIds[`text-${index}`]) {
    index += 1;
  }

  return `text-${index}`;
}

export function renderText({
  context,
  object,
  appearance,
  frameTransform,
}: CanvasObjectRenderInput) {
  const textObject = object as TextObject;
  const bounds = frameTransform.getObjectCanvasBounds(textObject);
  const scale = frameTransform.scale;
  const canvasFontSize = textObject.props.fontSize * scale;
  const canvasWrapWidth =
    typeof textObject.props.wrapWidth === "number"
      ? textObject.props.wrapWidth * scale
      : undefined;
  const lines = getWrappedTextLines(
    textObject.props.text,
    canvasFontSize,
    canvasWrapWidth,
  );
  const lineHeight = canvasFontSize * TEXT_LINE_HEIGHT_RATIO;
  const lineMetrics = getTextLineMetrics(canvasFontSize);
  const horizontalPadding = (TEXT_HORIZONTAL_PADDING_PX * scale) / 2;
  const verticalPadding = (TEXT_VERTICAL_PADDING_PX * scale) / 2;
  const firstBaselineOffset =
    verticalPadding + lineMetrics.topInset + lineMetrics.ascent;

  context.save();
  context.globalAlpha = appearance === "preview" ? 0.55 : 1;
  context.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  context.rotate(((textObject.rotation ?? 0) * Math.PI) / 180);
  context.fillStyle = textObject.props.color;
  context.font = `${TEXT_FONT_WEIGHT} ${canvasFontSize}px ${TEXT_FONT_FAMILY}`;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  lines.forEach((line, index) => {
    context.fillText(
      line,
      -bounds.width / 2 + horizontalPadding,
      -bounds.height / 2 + firstBaselineOffset + index * lineHeight,
    );
  });

  context.restore();
}

export function hitTestText({
  object,
  canvasPoint,
  frameTransform,
  minimumHitRadiusPx,
}: CanvasObjectHitTestInput) {
  const textObject = object as TextObject;
  const center = frameTransform.boardToCanvas(textObject.position);
  const bounds = frameTransform.getObjectCanvasBounds(textObject);
  const localX = canvasPoint.x - center.x;
  const localY = canvasPoint.y - center.y;
  const inverseRotation = -((textObject.rotation ?? 0) * Math.PI) / 180;
  const rotatedPoint = {
    x: localX * Math.cos(inverseRotation) - localY * Math.sin(inverseRotation),
    y: localX * Math.sin(inverseRotation) + localY * Math.cos(inverseRotation),
  };
  const hitPadding = Math.max(4, minimumHitRadiusPx / 4);

  return (
    Math.abs(rotatedPoint.x) <= bounds.width / 2 + hitPadding &&
    Math.abs(rotatedPoint.y) <= bounds.height / 2 + hitPadding
  );
}
