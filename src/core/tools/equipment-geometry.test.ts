import { describe, expect, it } from "vitest";
import { createEquipmentObject } from "../objects/equipment-object";
import { getEquipmentSelectionOutlineCanvasPoints } from "./equipment-geometry";

describe("equipment selection geometry", () => {
  it("uses the equipment size as its only selection frame", () => {
    const equipment = createEquipmentObject({
      id: "equipment",
      kind: "test",
      position: { x: 100, y: 100 },
      size: { width: 20, height: 10 },
    });
    const points = getEquipmentSelectionOutlineCanvasPoints(
      {
        boardToCanvas: (point) => point,
      },
      equipment,
    );

    expect(points).toEqual([
      { x: 89.25, y: 94.25 },
      { x: 110.75, y: 94.25 },
      { x: 110.75, y: 105.75 },
      { x: 89.25, y: 105.75 },
    ]);
  });
});
