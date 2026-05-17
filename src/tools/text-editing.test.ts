import { describe, expect, it } from "vitest";
import { createBoardEditorStore } from "../core/store/board-editor-store";
import { createTextObject, type TextObject } from "../core/objects/text-object";
import { createToolApi } from "../core/editor/create-tool-api";
import {
  beginTextEditingSession,
  finishTextEditingSession,
  getTextEditorOverlayState,
  updateActiveTextEditingText,
} from "./text-editing";
import { getTextAnchorPosition } from "./text-layout";

describe("text-editing", () => {
  const canvasRect = {
    width: 640,
    height: 360,
  };

  it("deletes an empty editing object when editing finishes", () => {
    const text = createTextObject({
      id: "text-1",
      position: { x: 20, y: 15 },
      text: "",
    });
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
        },
        objects: {
          byId: {
            [text.id]: text,
          },
          order: [text.id],
        },
        style: {},
      },
      tools: [
        {
          id: "select",
          label: "Select",
        },
      ],
    });
    const toolApi = createToolApi(store);

    store.getState().actions.setCanvasRect(canvasRect);
    toolApi.setSelectedObjectIds([text.id]);
    beginTextEditingSession({
      state: store.getState(),
      object: text,
      canvasRect,
    });

    finishTextEditingSession(toolApi);

    expect(store.getState().board.objects.byId[text.id]).toBeUndefined();
    expect(store.getState().board.objects.order).toEqual([]);
    expect(store.getState().selection.selectedObjectIds).toEqual([]);
  });

  it("updates the active text object around the editing anchor", () => {
    const text = createTextObject({
      id: "text-1",
      position: { x: 20, y: 15 },
      text: "Hi",
    });
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
        },
        objects: {
          byId: {
            [text.id]: text,
          },
          order: [text.id],
        },
        style: {},
      },
      tools: [
        {
          id: "select",
          label: "Select",
        },
      ],
    });
    const toolApi = createToolApi(store);

    store.getState().actions.setCanvasRect(canvasRect);
    beginTextEditingSession({
      state: store.getState(),
      object: text,
      canvasRect,
    });

    const anchorPosition = getTextEditorOverlayState(store.getState())?.session
      .anchorPosition;

    updateActiveTextEditingText(toolApi, "A much longer line");

    const updatedText = store.getState().board.objects.byId[text.id] as
      | TextObject
      | undefined;

    expect(updatedText?.props.text).toBe("A much longer line");
    expect(anchorPosition).toBeDefined();
    expect(
      updatedText &&
        getTextAnchorPosition(updatedText, store.getState(), canvasRect).x,
    ).toBeCloseTo(anchorPosition?.x ?? 0);
    expect(
      updatedText &&
        getTextAnchorPosition(updatedText, store.getState(), canvasRect).y,
    ).toBeCloseTo(anchorPosition?.y ?? 0);
  });

  it("builds overlay state from the active session", () => {
    const text = createTextObject({
      id: "text-1",
      position: { x: 20, y: 15 },
      text: "Press",
    });
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
        },
        objects: {
          byId: {
            [text.id]: text,
          },
          order: [text.id],
        },
        style: {},
      },
      tools: [
        {
          id: "select",
          label: "Select",
        },
      ],
    });

    store.getState().actions.setCanvasRect(canvasRect);
    beginTextEditingSession({
      state: store.getState(),
      object: text,
      canvasRect,
    });

    expect(getTextEditorOverlayState(store.getState())).toMatchObject({
      object: {
        id: text.id,
      },
      session: {
        objectId: text.id,
      },
    });
  });
});
