import { describe, expect, it, vi } from "vitest";
import { createBoardEditorRuntime } from "./board-editor-runtime";
import { createBoardEditorStore } from "../store/board-editor-store";
import { SELECT_TOOL_ID } from "../../tools/select-tool-state";
import * as canvasRendererModule from "../../rendering/canvas/create-canvas-renderer";

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
  it("registers tool capabilities once even when registration updates the store", () => {
    const registerCapabilities = vi.fn(
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
          registerCapabilities,
        },
      ],
    });
    const runtime = createBoardEditorRuntime({ store });
    const canvas = createCanvasStub();
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    registerCapabilities.mockClear();

    runtime.mount(canvas);

    expect(registerCapabilities).toHaveBeenCalledTimes(1);
    expect(store.getState().rendering.overlayRenderers.selection).toBeTypeOf(
      "function",
    );

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("renders overlay items from registered tools without special-casing the active tool", () => {
    const render = vi.fn();
    const createCanvasRendererSpy = vi
      .spyOn(canvasRendererModule, "createCanvasRenderer")
      .mockReturnValue({ render });
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
      initialToolId: "draw",
      tools: [
        {
          id: SELECT_TOOL_ID,
          label: "Select",
          getOverlayItems: () => [
            {
              kind: "rect",
              x: 1,
              y: 2,
              width: 3,
              height: 4,
            },
          ],
        },
        {
          id: "draw",
          label: "Draw",
        },
      ],
    });
    const runtime = createBoardEditorRuntime({ store });
    const canvas = createCanvasStub();
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    runtime.mount(canvas);

    expect(render).toHaveBeenCalled();
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        overlayItems: [
          {
            kind: "rect",
            x: 1,
            y: 2,
            width: 3,
            height: 4,
          },
        ],
      }),
    );

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    createCanvasRendererSpy.mockRestore();
  });

  it("clears previews when the pointer leaves the canvas without capture", () => {
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
        },
      ],
    });
    const runtime = createBoardEditorRuntime({ store });
    const canvas = createCanvasStub();
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    runtime.mount(canvas);
    store.getState().actions.setPreviewObjects([
      {
        id: "player-preview",
        type: "player",
        position: { x: 10, y: 10 },
        props: {
          color: "#111827",
          appearance: { kind: "render", renderer: "player-default" },
        },
      },
    ]);

    const pointerLeaveHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "pointerleave")?.[1] as
      | ((event: PointerEvent) => void)
      | undefined;

    expect(pointerLeaveHandler).toBeTypeOf("function");

    pointerLeaveHandler?.({ pointerId: 1 } as PointerEvent);

    expect(store.getState().rendering.previewObjects).toEqual([]);

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("keeps previews when the pointer leaves during an active capture", () => {
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
        },
      ],
    });
    const runtime = createBoardEditorRuntime({ store });
    const canvas = createCanvasStub();
    vi.mocked(canvas.hasPointerCapture).mockReturnValue(true);
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    runtime.mount(canvas);
    store.getState().actions.setPreviewObjects([
      {
        id: "player-preview",
        type: "player",
        position: { x: 10, y: 10 },
        props: {
          color: "#111827",
          appearance: { kind: "render", renderer: "player-default" },
        },
      },
    ]);

    const pointerLeaveHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "pointerleave")?.[1] as
      | ((event: PointerEvent) => void)
      | undefined;

    expect(pointerLeaveHandler).toBeTypeOf("function");

    pointerLeaveHandler?.({ pointerId: 1 } as PointerEvent);

    expect(store.getState().rendering.previewObjects).toHaveLength(1);

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });
});
