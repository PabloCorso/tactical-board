import { describe, expect, it } from "vitest";
import type { BoardEditorState } from "../editor/types";
import {
  MIN_TEXT_CONTENT_WIDTH_PX,
  TEXT_HORIZONTAL_PADDING_PX,
  TEXT_VERTICAL_PADDING_PX,
  getTextBoxSize,
} from "../objects/text-object";
import {
  createAnchoredTextObject,
  createTextToolProjection,
  getTextAnchorPosition,
  updateAnchoredTextObject,
} from "./text-layout";

const state: Pick<BoardEditorState, "board" | "ui"> = {
  board: {
    id: "board-1",
    version: 1,
    metadata: {},
    frame: {
      width: 100,
      height: 50,
    },
    objects: {
      byId: {},
      order: [],
    },
    style: {},
  },
  ui: {
    activeToolId: "text",
    defaultToolId: "text",
    viewport: {
      pan: { x: 0, y: 0 },
      zoom: 1,
    },
    viewportInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    navigationMode: "free",
  },
};

const canvasRect = {
  width: 1000,
  height: 500,
};

describe("text layout anchoring", () => {
  it("uses measured glyph width instead of a character-count estimate", () => {
    expect(getTextBoxSize("WW", 24).width).toBeGreaterThan(
      getTextBoxSize("ii", 24).width,
    );
  });

  it("treats the anchor as the text insertion point", () => {
    const anchorPosition = { x: 30, y: 18 };
    const text = createAnchoredTextObject(
      {
        id: "text-1",
        anchorPosition,
        text: "",
        color: "#111827",
        fontSize: 24,
      },
      state,
      canvasRect,
    );

    expect(getTextAnchorPosition(text, state, canvasRect).x).toBeCloseTo(
      anchorPosition.x,
    );
    expect(getTextAnchorPosition(text, state, canvasRect).y).toBeCloseTo(
      anchorPosition.y,
    );
  });

  it("keeps the insertion point stable when the text changes", () => {
    const anchorPosition = { x: 30, y: 18 };
    const initial = createAnchoredTextObject(
      {
        id: "text-1",
        anchorPosition,
        text: "",
        color: "#111827",
        fontSize: 24,
      },
      state,
      canvasRect,
    );
    const updated = updateAnchoredTextObject(
      initial,
      { text: "Hello" },
      anchorPosition,
      state,
      canvasRect,
    );
    const projection = createTextToolProjection(state, canvasRect);
    const bounds = projection.getObjectCanvasBounds(updated);
    const anchorCanvasPoint = projection.boardToCanvas(anchorPosition);

    expect(bounds.x + TEXT_HORIZONTAL_PADDING_PX / 2).toBeCloseTo(
      anchorCanvasPoint.x,
    );
    expect(bounds.y + TEXT_VERTICAL_PADDING_PX / 2).toBeCloseTo(
      anchorCanvasPoint.y,
    );
  });

  it("keeps the insertion point stable when the font size changes", () => {
    const anchorPosition = { x: 30, y: 18 };
    const initial = createAnchoredTextObject(
      {
        id: "text-1",
        anchorPosition,
        text: "Hello",
        color: "#111827",
        fontSize: 24,
      },
      state,
      canvasRect,
    );
    const updated = updateAnchoredTextObject(
      initial,
      { fontSize: 36 },
      anchorPosition,
      state,
      canvasRect,
    );
    const projection = createTextToolProjection(state, canvasRect);
    const bounds = projection.getObjectCanvasBounds(updated);
    const anchorCanvasPoint = projection.boardToCanvas(anchorPosition);

    expect(bounds.x + TEXT_HORIZONTAL_PADDING_PX / 2).toBeCloseTo(
      anchorCanvasPoint.x,
    );
    expect(bounds.y + TEXT_VERTICAL_PADDING_PX / 2).toBeCloseTo(
      anchorCanvasPoint.y,
    );
  });

  it("uses the explicit wrap width and grows vertically as lines wrap", () => {
    const wrapped = getTextBoxSize("hello world hello world", 20, 100);
    const unwrapped = getTextBoxSize("hello world hello world", 20);

    expect(wrapped.width).toBe(100 + TEXT_HORIZONTAL_PADDING_PX);
    expect(wrapped.width).toBeLessThan(unwrapped.width);
    expect(wrapped.height).toBeGreaterThan(unwrapped.height);
  });

  it("clamps wrap width to the minimum content width", () => {
    const wrapped = getTextBoxSize("hello", 20, 1);

    expect(wrapped.width).toBe(
      MIN_TEXT_CONTENT_WIDTH_PX + TEXT_HORIZONTAL_PADDING_PX,
    );
  });
});
