import { describe, expect, it } from "vitest";
import {
  defaultMoveBoardObject,
  moveBoardObject,
  rotateBoardObject,
} from "./object-behaviors";
import { defineObjectDefinition } from "./types";

describe("object behaviors", () => {
  it("uses registry move overrides when present", () => {
    const object = {
      id: "arrow-1",
      type: "arrow",
      position: { x: 10, y: 10 },
      props: {},
    };
    const state = {
      objectRegistry: {
        definitions: {
          arrow: defineObjectDefinition({
            type: "arrow",
            behaviors: {
              move: (current, delta) => ({
                ...current,
                position: {
                  x: current.position.x + delta.x * 2,
                  y: current.position.y + delta.y * 3,
                },
              }),
            },
          }),
        },
      },
    } as const;

    expect(moveBoardObject(state, object, { x: 2, y: 3 })).toMatchObject({
      position: { x: 14, y: 19 },
    });
  });

  it("falls back to generic movement and rotation", () => {
    const object = {
      id: "player-1",
      type: "player",
      position: { x: 4, y: 2 },
      rotation: 15,
      props: {},
    };
    const state = {
      objectRegistry: {
        definitions: {
          player: defineObjectDefinition({
            type: "player",
          }),
        },
      },
    } as const;

    expect(moveBoardObject(state, object, { x: -1, y: 5 })).toEqual(
      defaultMoveBoardObject(object, { x: -1, y: 5 }),
    );
    const rotated = rotateBoardObject(state, object, { x: 0, y: 0 }, 90);

    expect(rotated.position.x).toBeCloseTo(-2);
    expect(rotated.position.y).toBeCloseTo(4);
    expect(rotated.rotation).toBe(105);
  });
});
