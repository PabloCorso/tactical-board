import { describe, expect, it } from "vitest";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import { createEquipmentObject } from "../objects/equipment-object";
import { hitTestEquipment } from "./equipment-tool";

describe("hitTestEquipment", () => {
  const projection = createBoardSpaceProjection({
    frame: {
      width: 100,
      height: 50,
    },
    viewport: {
      pan: { x: 10, y: 20 },
      zoom: 1,
    },
    canvasRect: {
      width: 300,
      height: 200,
    },
  });

  it("allows equipment to opt out of the minimum padded hit target", () => {
    const equipment = createEquipmentObject({
      id: "strict-cone",
      position: { x: 10, y: 10 },
      kind: "cone",
      definition: {
        kind: "cone",
        label: "Cone",
        defaultSize: { width: 2, height: 2 },
        minimumHitRadiusPx: 0,
      },
      size: { width: 2, height: 2 },
    });

    expect(
      hitTestEquipment({
        object: equipment,
        canvasPoint: {
          x: projection.boardToCanvas(equipment.position).x + 12,
          y: projection.boardToCanvas(equipment.position).y,
        },
        frameTransform: projection,
        minimumHitRadiusPx: 24,
      }),
    ).toBe(false);
  });

  it("supports circular hit areas instead of the full square bounds", () => {
    const equipment = createEquipmentObject({
      id: "hoop",
      position: { x: 10, y: 10 },
      kind: "hoop",
      definition: {
        kind: "hoop",
        label: "Hoop",
        defaultSize: { width: 20, height: 20 },
        minimumHitRadiusPx: 0,
        hitTestShape: "circle",
      },
      size: { width: 20, height: 20 },
    });

    expect(
      hitTestEquipment({
        object: equipment,
        canvasPoint: {
          x: projection.boardToCanvas(equipment.position).x + 9,
          y: projection.boardToCanvas(equipment.position).y + 9,
        },
        frameTransform: projection,
        minimumHitRadiusPx: 24,
      }),
    ).toBe(false);
  });
});
