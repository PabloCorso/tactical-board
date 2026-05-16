import {
  isTextObjectEmpty,
  updateTextObject,
  type TextObject,
} from "../objects/text-object";
import type { BoardEditorState } from "./types";
import type { ToolApi } from "../tools/types";
import {
  createTextToolProjection,
  getTextAnchorPosition,
  updateAnchoredTextObject,
} from "../../tools/text-layout";
import {
  getTextToolState,
  TEXT_TOOL_ID,
  type TextEditingSession,
} from "../../tools/text-tool-state";
import { setSelectedObjectIds } from "../../tools/select-tool-actions";

export type ActiveTextEditingSession = {
  object: TextObject;
  session: TextEditingSession;
};

export type TextEditorOverlayState = ActiveTextEditingSession & {
  anchorCanvasPoint: { x: number; y: number };
  objectBounds: { x: number; y: number; width: number; height: number };
  scale: number;
};

export function getActiveTextEditingSession(
  state: Pick<BoardEditorState, "board" | "toolState">,
): ActiveTextEditingSession | undefined {
  const editingSession = getTextToolState(state.toolState).editingSession;

  if (!editingSession) {
    return undefined;
  }

  const object = state.board.objects.byId[editingSession.objectId];

  if (object?.type !== "text") {
    return undefined;
  }

  return {
    object: object as TextObject,
    session: editingSession,
  };
}

export function getTextEditorOverlayState(
  state: Pick<BoardEditorState, "board" | "toolState" | "ui">,
): TextEditorOverlayState | undefined {
  const activeSession = getActiveTextEditingSession(state);

  if (!activeSession || !state.ui.canvasRect) {
    return undefined;
  }

  const projection = createTextToolProjection(state, state.ui.canvasRect);
  const objectBounds = projection.getObjectCanvasBounds(activeSession.object);

  return {
    ...activeSession,
    anchorCanvasPoint: projection.worldToCanvas(
      activeSession.session.anchorPosition,
    ),
    objectBounds,
    scale:
      projection.pixelsPerUnit /
      activeSession.object.props.referencePixelsPerUnit,
  };
}

export function beginTextEditingSession(params: {
  state: Pick<BoardEditorState, "board" | "ui" | "toolState" | "actions">;
  object: TextObject;
  canvasRect: { width: number; height: number };
}) {
  const { state, object, canvasRect } = params;
  const textState = getTextToolState(state.toolState);

  state.actions.setToolState(TEXT_TOOL_ID, {
    ...textState,
    editingSession: {
      objectId: object.id,
      anchorPosition: getTextAnchorPosition(object, state, canvasRect),
    },
  });
}

export function finishTextEditingSession(api: ToolApi) {
  const state = api.getState();
  const activeSession = getActiveTextEditingSession(state);

  if (!activeSession) {
    return;
  }

  if (isTextObjectEmpty(activeSession.object)) {
    api.deleteObjects([activeSession.object.id]);
    setSelectedObjectIds(api, []);
  }

  const textState = getTextToolState(state.toolState);
  api.setToolState(TEXT_TOOL_ID, {
    ...textState,
    editingSession: undefined,
  });
}

export function updateActiveTextEditingText(api: ToolApi, text: string) {
  const state = api.getState();
  const activeSession = getActiveTextEditingSession(state);
  const canvasRect = state.ui.canvasRect;

  if (!activeSession || !canvasRect) {
    return;
  }

  api.updateObjects([activeSession.object.id], (object) =>
    updateAnchoredTextObject(
      object as TextObject,
      { text },
      activeSession.session.anchorPosition,
      state,
      canvasRect,
    ),
  );
}

export function updateTextObjectFromAnchor(
  api: ToolApi,
  objectId: string,
  input: Parameters<typeof updateTextObject>[1],
) {
  const state = api.getState();
  const object = state.board.objects.byId[objectId];

  if (object?.type !== "text") {
    return;
  }

  const canvasRect = state.ui.canvasRect;
  const anchorPosition = canvasRect
    ? getTextAnchorPosition(object as TextObject, state, canvasRect)
    : undefined;

  api.updateObjects([objectId], (currentObject) =>
    anchorPosition && canvasRect
      ? updateAnchoredTextObject(
          currentObject as TextObject,
          input,
          anchorPosition,
          state,
          canvasRect,
        )
      : updateTextObject(currentObject as TextObject, input),
  );
}
