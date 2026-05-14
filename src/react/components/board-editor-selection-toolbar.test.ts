import { describe, expect, it } from "vitest";
import type { BoardEditorState } from "../../core/editor/types";
import type { PlayerObject } from "../../core/objects/player-object";
import type { EquipmentObject } from "../../core/objects/equipment-object";
import type { ShapeObject } from "../../core/objects/shape-object";
import type { ArrowObject } from "../../core/objects/arrow-object";
import { playerSelectionAdapter } from "../../tools/player-selection";
import { equipmentSelectionAdapter } from "../../tools/equipment-selection";
import { shapeSelectionAdapter } from "../../tools/shape-selection";
import { arrowSelectionAdapter } from "../../tools/arrow-selection";
import { SELECTION_TOOLBAR_OFFSET_PX } from "../../tools/selection-geometry";
import {
  getSelectionToolbarAnchor,
  shouldShowSelectionToolbar,
} from "./board-editor-selection-toolbar";

describe("shouldShowSelectionToolbar", () => {
  it("shows the toolbar for a normal single selection", () => {
    expect(
      shouldShowSelectionToolbar({
        selectedObjectIds: ["player-1"],
        interaction: undefined,
      }),
    ).toBe(true);
  });

  it("hides the toolbar while marquee selection is in progress", () => {
    expect(
      shouldShowSelectionToolbar({
        selectedObjectIds: ["player-1"],
        interaction: {
          mode: "marquee",
          origin: { x: 10, y: 10 },
          current: { x: 20, y: 20 },
          baseSelection: [],
        },
      }),
    ).toBe(false);
  });
});

describe("getSelectionToolbarAnchor", () => {
  const projection = {
    getObjectCanvasBounds: () => ({ x: 80, y: 80, width: 40, height: 40 }),
    worldToCanvas: ({ x, y }: { x: number; y: number }) => ({ x, y }),
    canvasToWorld: ({ x, y }: { x: number; y: number }) => ({ x, y }),
    pixelsPerUnit: 1,
  };
  const state = {
    objectRegistry: {
      definitions: {
        player: { type: "player", selection: playerSelectionAdapter },
        equipment: {
          type: "equipment",
          selection: equipmentSelectionAdapter,
        },
      },
    },
  } as unknown as Pick<BoardEditorState, "objectRegistry">;

  it("places the player toolbar above the rotated selection chrome", () => {
    const player = {
      type: "player",
      id: "player-1",
      position: { x: 100, y: 100 },
      size: { width: 40, height: 40 },
      rotation: 45,
      props: { color: "#ffffff" },
    } as unknown as PlayerObject;

    const anchor = getSelectionToolbarAnchor(projection, player, state);

    expect(anchor).toBeDefined();
    if (!anchor) {
      throw new Error("expected anchor");
    }

    expect(anchor.left).toBe(100);
    expect(anchor.top).toBeLessThan(16);
  });

  it("moves the equipment toolbar higher after resize increases rotate chrome", () => {
    const smallEquipment = {
      type: "equipment",
      id: "equipment-1",
      position: { x: 100, y: 100 },
      size: { width: 30, height: 30 },
      rotation: 45,
      props: { definition: {} },
    } as unknown as EquipmentObject;
    const largeEquipment = {
      ...smallEquipment,
      size: { width: 80, height: 80 },
    } as EquipmentObject;

    const smallAnchor = getSelectionToolbarAnchor(
      projection,
      smallEquipment,
      state,
    );
    const largeAnchor = getSelectionToolbarAnchor(
      projection,
      largeEquipment,
      state,
    );

    expect(smallAnchor).toBeDefined();
    expect(largeAnchor).toBeDefined();
    if (!smallAnchor || !largeAnchor) {
      throw new Error("expected anchors");
    }

    expect(largeAnchor.left).toBe(100);
    expect(largeAnchor.top).toBeLessThan(smallAnchor.top);
  });

  it("uses the same larger toolbar offset for shape selections", () => {
    const shape = {
      type: "shape",
      id: "shape-1",
      position: { x: 100, y: 100 },
      size: { width: 40, height: 40 },
      rotation: 0,
      props: {
        kind: "rectangle",
        start: { x: 80, y: 80 },
        end: { x: 120, y: 120 },
        bordered: false,
      },
    } as unknown as ShapeObject;

    const anchor = shapeSelectionAdapter.getToolbarAnchor?.({
      object: shape,
      projection,
    });

    expect(anchor).toEqual({
      left: 100,
      top: 80 - SELECTION_TOOLBAR_OFFSET_PX,
    });
  });

  it("moves the shape toolbar higher when the shape is rotated", () => {
    const baseShape = {
      type: "shape",
      id: "shape-2",
      position: { x: 100, y: 100 },
      size: { width: 40, height: 40 },
      props: {
        kind: "rectangle",
        start: { x: 80, y: 80 },
        end: { x: 120, y: 120 },
        bordered: false,
      },
    };
    const unrotatedShape = {
      ...baseShape,
      rotation: 0,
    } as unknown as ShapeObject;
    const rotatedShape = {
      ...baseShape,
      rotation: 45,
    } as unknown as ShapeObject;

    const unrotatedAnchor = shapeSelectionAdapter.getToolbarAnchor?.({
      object: unrotatedShape,
      projection,
    });
    const rotatedAnchor = shapeSelectionAdapter.getToolbarAnchor?.({
      object: rotatedShape,
      projection,
    });

    expect(unrotatedAnchor).toBeDefined();
    expect(rotatedAnchor).toBeDefined();
    if (!unrotatedAnchor || !rotatedAnchor) {
      throw new Error("expected anchors");
    }

    expect(rotatedAnchor.left).toBe(100);
    expect(rotatedAnchor.top).toBeLessThan(unrotatedAnchor.top);
  });

  it("uses the same larger toolbar offset for polyline arrows", () => {
    const arrow = {
      type: "arrow",
      id: "arrow-1",
      props: {
        geometry: "polyline",
        start: { x: 80, y: 90 },
        end: { x: 120, y: 110 },
        points: [],
        bodyStyle: "straight",
      },
    } as unknown as ArrowObject;

    const anchor = arrowSelectionAdapter.getToolbarAnchor?.({
      object: arrow,
      projection,
    });

    expect(anchor).toEqual({
      left: 100,
      top: 80 - SELECTION_TOOLBAR_OFFSET_PX,
    });
  });
});
