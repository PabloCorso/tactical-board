import { describe, expect, it } from "vitest";
import type { Board, Shape } from "./types";
import {
  canBringObjectToFront,
  canMoveObjectIdsToBoundary,
  canSendObjectToBack,
  getOrderedBoardObjectIds,
  moveObjectIdsToBoundary,
} from "./object-order";

const objectTypes = ["shape", "equipment", "text", "arrow", "player"];

function createBoard(objects: Shape[]): Board {
  return {
    id: "board-1",
    version: 1,
    metadata: {},
    frame: { width: 100, height: 50 },
    objects: {
      byId: Object.fromEntries(objects.map((object) => [object.id, object])),
      order: objects.map((object) => object.id),
    },
    style: {},
  };
}

function createObject(id: string, type: string): Shape {
  return { id, type, position: { x: 0, y: 0 }, props: {} };
}

describe("Object order", () => {
  it("uses the canonical Object Index order across object types", () => {
    const objects = objectTypes.map((type) => createObject(type, type));
    const board = createBoard(objects);
    board.objects.order = [...board.objects.order].reverse();

    expect(getOrderedBoardObjectIds(board)).toEqual(objectTypes.toReversed());
  });

  it("moves Objects across type boundaries while preserving selection order", () => {
    const board = createBoard(
      objectTypes.map((type) => createObject(type, type)),
    );

    expect(moveObjectIdsToBoundary(board, ["shape", "text"], "front")).toEqual([
      "equipment",
      "arrow",
      "player",
      "shape",
      "text",
    ]);
    expect(moveObjectIdsToBoundary(board, ["arrow", "player"], "back")).toEqual(
      ["arrow", "player", "shape", "equipment", "text"],
    );
  });

  it("checks the actual global front and back boundaries", () => {
    const board = createBoard([
      createObject("shape", "shape"),
      createObject("player", "player"),
    ]);

    expect(canBringObjectToFront(board, "shape")).toBe(true);
    expect(canBringObjectToFront(board, "player")).toBe(false);
    expect(canSendObjectToBack(board, "shape")).toBe(false);
    expect(canSendObjectToBack(board, "player")).toBe(true);
    expect(
      canMoveObjectIdsToBoundary(board, ["shape", "player"], "front"),
    ).toBe(false);
  });
});
