import { describe, expect, it } from "vitest";
import type { Board, BoardObject, Document, Shape } from "../board/types";
import { createBoard, createDocument } from "../board/create-board";
import {
  createBoardEditorStore,
  createEditorStore,
} from "../store/board-editor-store";
import { defineShapeDefinition } from "../objects/types";
import {
  serializeBoard,
  serializeDocument,
} from "../serialization/board-schema";

describe("Document and Shape compatibility vocabulary", () => {
  const shape: Shape = {
    id: "shape-1",
    type: "token",
    position: { x: 10, y: 12 },
    props: {},
  };

  const document: Document = {
    id: "document-1",
    version: 1,
    metadata: {},
    surface: {
      width: 100,
      height: 50,
    },
    objects: {
      byId: {
        [shape.id]: shape,
      },
      order: [shape.id],
    },
    style: {},
  };

  it("accepts Document data through the preferred editor store API", () => {
    const shapeDefinition = defineShapeDefinition({
      type: "token",
      behaviors: {
        move: (object, delta) => ({
          ...object,
          position: {
            x: object.position.x + delta.x * 2,
            y: object.position.y + delta.y * 2,
          },
        }),
      },
    });
    const store = createEditorStore({
      initialDocument: document,
      objectDefinitions: [shapeDefinition],
      tools: [{ id: "select", label: "Select" }],
    });

    store.getState().actions.moveObjects(["shape-1"], { x: 1, y: 2 });

    expect(store.getState().board.objects.byId["shape-1"]?.position).toEqual({
      x: 12,
      y: 16,
    });
    expect(store.getState().history.past[0]?.board).toBe(document);
  });

  it("keeps Board-compatible data flowing through existing APIs", () => {
    const boardObject: BoardObject = shape;
    const board: Board = {
      ...document,
      id: "board-1",
      objects: {
        byId: {
          [boardObject.id]: boardObject,
        },
        order: [boardObject.id],
      },
    };
    const store = createBoardEditorStore({
      initialBoard: createBoard(board),
      tools: [{ id: "select", label: "Select" }],
    });

    const duplicateIds = store.getState().actions.duplicateObjects(["shape-1"]);

    expect(duplicateIds).toEqual(["shape-1-copy"]);
    expect(store.getState().board.objects.order).toEqual([
      "shape-1",
      "shape-1-copy",
    ]);
  });

  it("serializes preferred Document and compatibility Board data identically", () => {
    expect(serializeDocument(createDocument(document))).toBe(
      serializeBoard(createBoard(document)),
    );
  });
});
