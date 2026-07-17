import { expect, it } from "vitest";
import { createTextObject } from "../objects/text-object";
import type { ToolPointerEvent } from "./types";
import { textSelectionAdapter } from "./text-selection";

it("rotates text through the default selection interaction", () => {
  const text = createTextObject({
    id: "text-1",
    position: { x: 10, y: 10 },
    rotation: 0,
  });
  const updateInteraction = textSelectionAdapter.updateSelectionInteraction;

  expect(updateInteraction).toBeDefined();

  const rotatedText = updateInteraction?.({
    object: text,
    session: {
      kind: "rotate",
      center: text.position,
      initialRotation: 0,
      initialPointerAngle: 0,
    },
    event: {
      point: { x: 10, y: 11 },
    } as ToolPointerEvent,
  });

  expect(rotatedText?.rotation).toBeCloseTo(90);
});
