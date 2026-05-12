import { describe, expect, it, vi } from "vitest";
import { createBoardEditorRuntime } from "./board-editor-runtime";
import { createBoardEditorStore } from "../store/board-editor-store";
import { SELECT_TOOL_ID } from "../../tools/select-tool-state";

function createCanvasStub(): HTMLCanvasElement {
  return {
    clientWidth: 640,
    clientHeight: 360,
    width: 640,
    height: 360,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    focus: vi.fn(),
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => false),
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      width: 640,
      height: 360,
      right: 640,
      bottom: 360,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })),
    getContext: vi.fn(() => null),
  } as unknown as HTMLCanvasElement;
}

describe("createBoardEditorRuntime", () => {
  it("registers tool renderers once even when registration updates the store", () => {
    const registerRenderers = vi.fn(
      ({
        registerOverlayRenderer,
      }: {
        registerOverlayRenderer: (
          overlayKind: string,
          renderer: () => void,
        ) => void;
      }) => {
        registerOverlayRenderer("selection", () => {});
      },
    );
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
        },
        objects: {
          byId: {},
          order: [],
        },
        style: {},
      },
      tools: [
        {
          id: SELECT_TOOL_ID,
          label: "Select",
          registerRenderers,
        },
      ],
    });
    const runtime = createBoardEditorRuntime({ store });
    const canvas = createCanvasStub();
    const requestAnimationFrameSpy = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation(() => 1);

    runtime.mount(canvas);

    expect(registerRenderers).toHaveBeenCalledTimes(1);
    expect(
      store.getState().rendering.overlayRenderers.selection,
    ).toBeTypeOf("function");

    runtime.unmount();
    requestAnimationFrameSpy.mockRestore();
  });
});
