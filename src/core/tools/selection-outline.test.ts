import { describe, expect, it } from "vitest";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import { createEquipmentObject } from "../objects/equipment-object";
import { createPlayerObject } from "../objects/player-object";
import { hoopEquipment } from "../../react/football/equipment/hoop";
import { getEquipmentSelectionOutlineCanvasPoints } from "./equipment-geometry";
import { getPlayerSelectionOutlineCanvasPoints } from "./player-selection";

const projection = createBoardSpaceProjection({
  frame: {
    width: 100,
    height: 50,
  },
  viewport: {
    pan: { x: 0, y: 0 },
    zoom: 1,
  },
  canvasRect: {
    width: 400,
    height: 240,
  },
});

function getOutlineBounds(points: { x: number; y: number }[]) {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

describe("selection outlines", () => {
  it("expands player selection to cover the rendered border", () => {
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 20, y: 10 },
      size: { width: 120, height: 120 },
      color: "#111827",
    });
    const objectBounds = projection.getObjectCanvasBounds(player);
    const outlineBounds = getOutlineBounds(
      getPlayerSelectionOutlineCanvasPoints(projection, player),
    );

    expect(outlineBounds.minX).toBeLessThan(objectBounds.x - 4);
    expect(outlineBounds.maxX).toBeGreaterThan(
      objectBounds.x + objectBounds.width + 4,
    );
  });

  it("adds a small outer pad around equipment selection bounds", () => {
    const equipment = createEquipmentObject({
      id: "hoop-1",
      position: { x: 20, y: 10 },
      size: { width: 120, height: 120 },
      kind: hoopEquipment.definition.kind,
      color: hoopEquipment.definition.color,
      definition: hoopEquipment.definition,
    });
    const center = projection.boardToCanvas(equipment.position);
    const size = equipment.size!;
    const rawHalfWidth =
      size.width * hoopEquipment.definition.selectionBounds!.right;
    const outlineBounds = getOutlineBounds(
      getEquipmentSelectionOutlineCanvasPoints(projection, equipment),
    );

    expect(outlineBounds.minX).toBeLessThan(center.x - rawHalfWidth - 0.5);
    expect(outlineBounds.maxX).toBeGreaterThan(center.x + rawHalfWidth + 0.5);
  });
});
