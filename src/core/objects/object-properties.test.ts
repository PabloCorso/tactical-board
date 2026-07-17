import { describe, expect, it } from "vitest";
import type { Board, BoardObject } from "../board/types";
import { createBoardPlayerGroup } from "../board/player-groups";
import { createPlayerObject } from "./player-object";
import { createArrowObject } from "./arrow-object";
import { createShapeObject } from "./shape-object";
import { resolveObjectMeasurementStyle } from "./object-measurement";
import {
  getObjectColorSelectionState,
  getObjectMeasurementSelectionState,
  getObjectMeasurementStyleSelectionState,
  updateObjectColor,
  updateObjectMeasurementStyle,
  updateObjectMeasurementVisibility,
} from "./object-properties";

describe("Object color properties", () => {
  it("resolves mixed colors across Object types and applies one common value", () => {
    const playerGroup = createBoardPlayerGroup({
      id: "red-team",
      color: "#ef4444",
    });
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      groupId: playerGroup.id,
    });
    const text: BoardObject = {
      id: "text-1",
      type: "text",
      position: { x: 20, y: 10 },
      props: { color: "#1f6feb" },
    };
    const board = createTestBoard([player, text], [playerGroup]);

    expect(getObjectColorSelectionState(board, [player, text])).toEqual({
      color: "#ef4444",
      mixed: true,
    });

    const recoloredObjects = [player, text].map((object) =>
      updateObjectColor(object, "#22c55e"),
    );
    const recoloredBoard = createTestBoard(recoloredObjects, [playerGroup]);

    expect(
      getObjectColorSelectionState(recoloredBoard, recoloredObjects),
    ).toEqual({
      color: "#22c55e",
      mixed: false,
    });
  });
});

describe("Object measurement properties", () => {
  it("derives its default background and readable text from the Object color", () => {
    expect(
      resolveObjectMeasurementStyle({ visible: true }, "#ffc857"),
    ).toMatchObject({
      backgroundColor: "#ffc857",
      color: "#111827",
    });
    expect(
      resolveObjectMeasurementStyle({ visible: true }, "#1f1f1f"),
    ).toMatchObject({
      backgroundColor: "#1f1f1f",
      color: "#ffffff",
    });
  });

  it("resolves and updates mixed visibility when every Object supports measurement", () => {
    const arrow = createArrowObject({
      id: "arrow-1",
      start: { x: 0, y: 0 },
      end: { x: 20, y: 0 },
      color: "#111827",
      lineStyle: "solid",
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
      measurement: { visible: true },
    });
    const rectangle = createShapeObject({
      id: "shape-1",
      kind: "rectangle",
      start: { x: 0, y: 0 },
      end: { x: 20, y: 10 },
      color: "#111827",
      lineStyle: "solid",
      measurement: { visible: false },
    });

    expect(getObjectMeasurementSelectionState([arrow, rectangle])).toEqual({
      visible: true,
      mixed: true,
    });

    const measuredObjects = [arrow, rectangle].map((object) =>
      updateObjectMeasurementVisibility(object, true),
    );

    expect(getObjectMeasurementSelectionState(measuredObjects)).toEqual({
      visible: true,
      mixed: false,
    });

    const styledArrow = updateObjectMeasurementStyle(arrow, { fontSize: 18 });
    expect(
      getObjectMeasurementStyleSelectionState([styledArrow, rectangle])
        ?.fontSize,
    ).toEqual({ value: 18, mixed: true });

    const styledObjects = [arrow, rectangle].map((object) =>
      updateObjectMeasurementStyle(object, {
        fontSize: 16,
        placement: "top",
        distance: 6,
        backgroundStyle: "none",
      }),
    );
    const hiddenStyledArrow = updateObjectMeasurementVisibility(
      styledObjects[0],
      false,
    );
    const styleState = getObjectMeasurementStyleSelectionState([
      hiddenStyledArrow,
      styledObjects[1],
    ]);

    expect(styleState?.fontSize).toEqual({ value: 16, mixed: false });
    expect(styleState?.placement).toEqual({ value: "top", mixed: false });
    expect(styleState?.distance).toEqual({ value: 6, mixed: false });
    expect(styleState?.backgroundStyle).toEqual({
      value: "none",
      mixed: false,
    });
  });

  it("does not expose a shared measurement property for unsupported Shapes", () => {
    const rectangle = createShapeObject({
      id: "rectangle-1",
      kind: "rectangle",
      color: "#111827",
      lineStyle: "solid",
    });
    const triangle = createShapeObject({
      id: "triangle-1",
      kind: "triangle",
      color: "#111827",
      lineStyle: "solid",
    });

    expect(
      getObjectMeasurementSelectionState([rectangle, triangle]),
    ).toBeUndefined();
  });
});

function createTestBoard(
  objects: BoardObject[],
  playerGroups: NonNullable<Board["playerGroups"]>,
): Board {
  return {
    id: "board-1",
    version: 1,
    metadata: {},
    frame: { width: 100, height: 50 },
    objects: {
      byId: Object.fromEntries(objects.map((object) => [object.id, object])),
      order: objects.map((object) => object.id),
    },
    playerGroups,
    style: {},
  };
}
