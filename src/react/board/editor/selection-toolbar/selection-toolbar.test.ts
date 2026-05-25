import { describe, expect, it } from "vitest";
import type { BoardEditorState } from "../../../../core/editor/types";
import type { PlayerObject } from "../../../../core/objects/player-object";
import type { EquipmentObject } from "../../../../core/objects/equipment-object";
import type { ShapeObject } from "../../../../core/objects/shape-object";
import type { ArrowObject } from "../../../../core/objects/arrow-object";
import type { TextObject } from "../../../../core/objects/text-object";
import { playerSelectionAdapter } from "../../../../core/tools/player-selection";
import { equipmentSelectionAdapter } from "../../../../core/tools/equipment-selection";
import { shapeSelectionAdapter } from "../../../../core/tools/shape-selection";
import { arrowSelectionAdapter } from "../../../../core/tools/arrow-selection";
import { textSelectionAdapter } from "../../../../core/tools/text-selection";
import { SELECTION_TOOLBAR_OFFSET_PX } from "../../../../core/tools/selection-geometry";
import {
  getMultiSelectionToolbarAnchor,
  getSelectionToolbarAnchor,
  getSelectionBounds,
  shouldShowSelectionToolbar,
} from "./selection-toolbar";
import { getSelectionToolbarPlacement } from "./selection-toolbar-positioner";

describe("shouldShowSelectionToolbar", () => {
  it("shows the toolbar for a normal single selection", () => {
    expect(
      shouldShowSelectionToolbar(
        {
          interaction: undefined,
        },
        ["player-1"],
      ),
    ).toBe(true);
  });

  it("shows the toolbar for a normal multi selection", () => {
    expect(
      shouldShowSelectionToolbar(
        {
          interaction: undefined,
        },
        ["player-1", "shape-1"],
      ),
    ).toBe(true);
  });

  it("hides the toolbar while marquee selection is in progress", () => {
    expect(
      shouldShowSelectionToolbar(
        {
          interaction: {
            mode: "marquee",
            origin: { x: 10, y: 10 },
            current: { x: 20, y: 20 },
            baseSelection: [],
          },
        },
        ["player-1"],
      ),
    ).toBe(false);
  });
});

describe("getSelectionToolbarAnchor", () => {
  const projection = {
    getObjectCanvasBounds: () => ({ x: 80, y: 80, width: 40, height: 40 }),
    boardToCanvas: ({ x, y }: { x: number; y: number }) => ({ x, y }),
    canvasToBoard: ({ x, y }: { x: number; y: number }) => ({ x, y }),
    scale: 1,
  };
  const state = {
    objectRegistry: {
      definitions: {
        player: { type: "player", selection: playerSelectionAdapter },
        equipment: {
          type: "equipment",
          selection: equipmentSelectionAdapter,
        },
        text: { type: "text", selection: textSelectionAdapter },
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

  it("uses the same larger toolbar offset for arrows", () => {
    const arrow = {
      type: "arrow",
      id: "arrow-1",
      props: {
        start: { x: 80, y: 90 },
        end: { x: 120, y: 110 },
        kind: "straight",
      },
    } as unknown as ArrowObject;

    const anchor = arrowSelectionAdapter.getToolbarAnchor?.({
      object: arrow,
      projection,
    });

    expect(anchor).toEqual({
      left: 100,
      top: 90 - SELECTION_TOOLBAR_OFFSET_PX,
    });
  });

  it("anchors the text toolbar above the text bounds", () => {
    const text = {
      type: "text",
      id: "text-1",
      position: { x: 100, y: 100 },
      size: { width: 120, height: 32 },
      props: {
        text: "Press",
        color: "#111827",
        fontSize: 24,
      },
    } as unknown as TextObject;

    const anchor = getSelectionToolbarAnchor(projection, text, state);

    expect(anchor).toBeDefined();
    expect(anchor).toEqual({
      left: 100,
      top: 18,
    });
  });
});

describe("getMultiSelectionToolbarAnchor", () => {
  it("centers the toolbar above the selection bounding box", () => {
    const projection = {
      getObjectCanvasBounds: (object: { id: string }) =>
        object.id === "a"
          ? { x: 80, y: 70, width: 40, height: 20 }
          : { x: 140, y: 90, width: 20, height: 30 },
      boardToCanvas: ({ x, y }: { x: number; y: number }) => ({ x, y }),
      canvasToBoard: ({ x, y }: { x: number; y: number }) => ({ x, y }),
      scale: 1,
    };

    expect(
      getMultiSelectionToolbarAnchor(projection, [
        { id: "a" } as unknown as PlayerObject,
        { id: "b" } as unknown as ShapeObject,
      ]),
    ).toEqual({
      left: 120,
      top: 70 - SELECTION_TOOLBAR_OFFSET_PX,
    });
  });
});

describe("getSelectionBounds", () => {
  it("returns the combined canvas bounds for a multi selection", () => {
    const projection = {
      getObjectCanvasBounds: (object: { id: string }) =>
        object.id === "a"
          ? { x: 80, y: 70, width: 40, height: 20 }
          : { x: 140, y: 90, width: 20, height: 30 },
      boardToCanvas: ({ x, y }: { x: number; y: number }) => ({ x, y }),
      canvasToBoard: ({ x, y }: { x: number; y: number }) => ({ x, y }),
      scale: 1,
    };

    expect(
      getSelectionBounds(projection, [
        { id: "a" } as unknown as PlayerObject,
        { id: "b" } as unknown as ShapeObject,
      ]),
    ).toEqual({
      left: 80,
      right: 160,
      top: 70,
      bottom: 120,
    });
  });
});

describe("getSelectionToolbarPlacement", () => {
  it("keeps the toolbar above the selection when there is enough space", () => {
    expect(
      getSelectionToolbarPlacement({
        anchorLeft: 150,
        anchorTop: 90,
        anchorBottom: 150,
        toolbarWidth: 120,
        toolbarHeight: 40,
        viewportWidth: 320,
        viewportHeight: 240,
      }),
    ).toEqual({
      left: 150,
      top: 90,
      placement: "top",
      transform: "translate(-50%, -100%)",
    });
  });

  it("flips the toolbar below the selection when top placement would overflow", () => {
    expect(
      getSelectionToolbarPlacement({
        anchorLeft: 150,
        anchorTop: 30,
        anchorBottom: 90,
        toolbarWidth: 120,
        toolbarHeight: 40,
        viewportWidth: 320,
        viewportHeight: 240,
      }),
    ).toEqual({
      left: 150,
      top: 90,
      placement: "bottom",
      transform: "translate(-50%, 0)",
    });
  });

  it("clamps the toolbar horizontally when the selection is near the left edge", () => {
    expect(
      getSelectionToolbarPlacement({
        anchorLeft: 20,
        anchorTop: 90,
        anchorBottom: 150,
        toolbarWidth: 120,
        toolbarHeight: 40,
        viewportWidth: 320,
        viewportHeight: 240,
      }).left,
    ).toBe(70);
  });

  it("clamps the toolbar horizontally when the selection is near the right edge", () => {
    expect(
      getSelectionToolbarPlacement({
        anchorLeft: 300,
        anchorTop: 90,
        anchorBottom: 150,
        toolbarWidth: 120,
        toolbarHeight: 40,
        viewportWidth: 320,
        viewportHeight: 240,
      }).left,
    ).toBe(250);
  });
});
