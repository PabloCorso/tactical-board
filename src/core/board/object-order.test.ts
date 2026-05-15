import { describe, expect, it } from "vitest";
import { getOrderedBoardObjectIds } from "./object-order";
import { createArrowObject } from "../objects/arrow-object";
import {
  createEquipmentObject,
  type EquipmentDefinition,
} from "../objects/equipment-object";
import { createPlayerObject } from "../objects/player-object";
import { createShapeObject } from "../objects/shape-object";

describe("getOrderedBoardObjectIds", () => {
  it("orders objects by semantic layer while preserving creation order within each type", () => {
    const shape = createShapeObject({
      id: "shape-1",
      kind: "rectangle",
      color: "#f00",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
      start: { x: 6, y: 7 },
      end: { x: 14, y: 13 },
    });
    const equipmentDefinition: EquipmentDefinition = {
      kind: "cone",
      label: "Cone",
      family: "cone",
      defaultSize: { width: 1, height: 1 },
    };
    const equipment = createEquipmentObject({
      id: "equipment-1",
      kind: "cone",
      definition: equipmentDefinition,
      position: { x: 12, y: 10 },
    });
    const arrow = createArrowObject({
      id: "arrow-1",
      start: { x: 15, y: 10 },
      end: { x: 20, y: 10 },
      color: "#fff",
      lineStyle: "solid",
      bodyStyle: "straight",
      startHead: "none",
      endHead: "triangle",
    });
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 18, y: 10 },
      color: "#111827",
    });
    const playerTwo = createPlayerObject({
      id: "player-2",
      position: { x: 22, y: 10 },
      color: "#111827",
    });

    const board = {
      id: "board-1",
      version: 1,
      metadata: {},
      surface: {
        width: 100,
        height: 50,
      },
      objects: {
        byId: {
          [player.id]: player,
          [shape.id]: shape,
          [arrow.id]: arrow,
          [playerTwo.id]: playerTwo,
          [equipment.id]: equipment,
        },
        order: [player.id, shape.id, arrow.id, playerTwo.id, equipment.id],
      },
      style: {},
    };

    expect(getOrderedBoardObjectIds(board)).toEqual([
      shape.id,
      equipment.id,
      arrow.id,
      player.id,
      playerTwo.id,
    ]);
  });
});
