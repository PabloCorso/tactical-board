import { describe, expect, it, vi } from "vitest";
import { createBoardEditorRuntime } from "./board-editor-runtime";
import { createBoardEditorStore } from "../store/board-editor-store";
import {
  getSelectToolState,
  SELECT_TOOL_ID,
} from "../../tools/select-tool-state";
import * as canvasRendererModule from "../../rendering/canvas/create-canvas-renderer";
import { getViewportToFitSurface } from "./viewport-utils";
import { createToolApi } from "./create-tool-api";
import { setSelectedObjectIds } from "../../tools/select-tool-actions";
import { ArrowTool } from "../../tools/arrow-tool";
import { ARROW_TOOL_ID, getArrowToolState } from "../../tools/arrow-tool-state";
import { ShapeTool } from "../../tools/shape-tool";
import { getShapeToolState, SHAPE_TOOL_ID } from "../../tools/shape-tool-state";
import { TextTool } from "../../tools/text-tool";
import { createTextObject } from "../objects/text-object";
import { getTextToolState } from "../../tools/text-tool-state";

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
  it("fits the initial viewport to the mounted canvas", () => {
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

    expect(store.getState().ui.viewport).toEqual(
      getViewportToFitSurface({
        surface: store.getState().board.surface,
        canvasRect: {
          width: canvas.clientWidth,
          height: canvas.clientHeight,
        },
      }),
    );

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

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

  it("keeps an in-progress arrow preview when the pointer leaves without capture", () => {
    const arrowTool = new ArrowTool();
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
      initialToolId: ARROW_TOOL_ID,
      tools: [
        {
          id: SELECT_TOOL_ID,
          label: "Select",
        },
        arrowTool,
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
    store.getState().actions.setToolState(ARROW_TOOL_ID, {
      ...getArrowToolState(store.getState().toolState),
      pendingPoints: [{ x: 10, y: 12 }],
    });
    store.getState().actions.setPreviewObjects([
      {
        id: "preview-arrow",
        type: "arrow",
        position: { x: 0, y: 0 },
        props: {},
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

  it("keeps an in-progress polygon preview when the pointer leaves without capture", () => {
    const shapeTool = new ShapeTool();
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
      initialToolId: SHAPE_TOOL_ID,
      tools: [
        {
          id: SELECT_TOOL_ID,
          label: "Select",
        },
        shapeTool,
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
    store.getState().actions.setToolState(SHAPE_TOOL_ID, {
      ...getShapeToolState(store.getState().toolState),
      draftStyle: {
        ...getShapeToolState(store.getState().toolState).draftStyle,
        kind: "polygon",
      },
      pendingPoints: [
        { x: 10, y: 10 },
        { x: 18, y: 16 },
      ],
    });
    store.getState().actions.setPreviewObjects([
      {
        id: "shape-preview",
        type: "shape",
        position: { x: 0, y: 0 },
        props: {},
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

  it("handles undo and redo keyboard shortcuts on the focused canvas", () => {
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
          byId: {
            a: {
              id: "a",
              type: "token",
              position: { x: 10, y: 12 },
              props: {},
            },
          },
          order: ["a"],
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
    store.getState().actions.moveObjects(["a"], { x: 5, y: 0 });

    const keyDownHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "keydown")?.[1] as
      | ((event: KeyboardEvent) => void)
      | undefined;

    expect(keyDownHandler).toBeTypeOf("function");

    const undoEvent = {
      key: "z",
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    keyDownHandler?.(undoEvent);

    expect(store.getState().board.objects.byId.a?.position).toEqual({
      x: 10,
      y: 12,
    });
    expect(undoEvent.preventDefault).toHaveBeenCalledTimes(1);

    const redoEvent = {
      key: "z",
      metaKey: true,
      ctrlKey: false,
      shiftKey: true,
      altKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    keyDownHandler?.(redoEvent);

    expect(store.getState().board.objects.byId.a?.position).toEqual({
      x: 15,
      y: 12,
    });
    expect(redoEvent.preventDefault).toHaveBeenCalledTimes(1);

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("deletes the current selection when Delete is pressed on the focused canvas", () => {
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
          byId: {
            a: {
              id: "a",
              type: "token",
              position: { x: 10, y: 12 },
              props: {},
            },
          },
          order: ["a"],
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
    setSelectedObjectIds(createToolApi(store), ["a"]);

    const keyDownHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "keydown")?.[1] as
      | ((event: KeyboardEvent) => void)
      | undefined;

    expect(keyDownHandler).toBeTypeOf("function");

    const deleteEvent = {
      key: "Delete",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    keyDownHandler?.(deleteEvent);

    expect(store.getState().board.objects.byId.a).toBeUndefined();
    expect(store.getState().board.objects.order).toEqual([]);
    expect(store.getState().selection.selectedObjectIds).toEqual([]);
    expect(deleteEvent.preventDefault).toHaveBeenCalledTimes(1);

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("cancels an unfinished arrow when Escape is pressed on the focused canvas", () => {
    const arrowTool = new ArrowTool();
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
      initialToolId: ARROW_TOOL_ID,
      tools: [
        {
          id: SELECT_TOOL_ID,
          label: "Select",
        },
        arrowTool,
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
    store.getState().actions.setToolState(ARROW_TOOL_ID, {
      ...getArrowToolState(store.getState().toolState),
      pendingPoints: [{ x: 10, y: 12 }],
    });
    store.getState().actions.setPreviewObjects([
      {
        id: "preview-arrow",
        type: "arrow",
        position: { x: 0, y: 0 },
        props: {},
      },
    ]);

    const keyDownHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "keydown")?.[1] as
      | ((event: KeyboardEvent) => void)
      | undefined;

    expect(keyDownHandler).toBeTypeOf("function");

    const escapeEvent = {
      key: "Escape",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    keyDownHandler?.(escapeEvent);

    expect(store.getState().ui.activeToolId).toBe(ARROW_TOOL_ID);
    expect(getArrowToolState(store.getState().toolState).pendingPoints).toEqual(
      [],
    );
    expect(store.getState().rendering.previewObjects).toEqual([]);
    expect(escapeEvent.preventDefault).toHaveBeenCalledTimes(1);

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("completes an unfinished polygon when Enter is pressed on the focused canvas", () => {
    const shapeTool = new ShapeTool({
      presets: [
        {
          id: "polygon",
          label: "Polygon",
          draftStyle: {
            kind: "polygon",
          },
        },
      ],
    });
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
      initialToolId: SHAPE_TOOL_ID,
      tools: [
        {
          id: SELECT_TOOL_ID,
          label: "Select",
        },
        shapeTool,
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
    store.getState().actions.setToolState(SHAPE_TOOL_ID, {
      ...getShapeToolState(store.getState().toolState),
      draftStyle: {
        ...getShapeToolState(store.getState().toolState).draftStyle,
        kind: "polygon",
      },
      pendingPoints: [
        { x: 10, y: 10 },
        { x: 18, y: 16 },
        { x: 14, y: 24 },
      ],
    });

    const keyDownHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "keydown")?.[1] as
      | ((event: KeyboardEvent) => void)
      | undefined;

    expect(keyDownHandler).toBeTypeOf("function");

    const enterEvent = {
      key: "Enter",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    keyDownHandler?.(enterEvent);

    expect(store.getState().board.objects.order).toEqual(["shape-1"]);
    expect(getShapeToolState(store.getState().toolState).pendingPoints).toEqual(
      [],
    );
    expect(store.getState().board.objects.byId["shape-1"]).toMatchObject({
      type: "shape",
      props: {
        kind: "polygon",
        points: [
          { x: 10, y: 10 },
          { x: 18, y: 16 },
          { x: 14, y: 24 },
        ],
      },
    });
    expect(enterEvent.preventDefault).toHaveBeenCalledTimes(1);

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("switches back to the default tool when Escape is pressed outside select", () => {
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
        },
        {
          id: "draw",
          label: "Draw",
        },
        {
          id: "measure",
          label: "Measure",
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
    store.getState().actions.setActiveTool("measure");

    const keyDownHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "keydown")?.[1] as
      | ((event: KeyboardEvent) => void)
      | undefined;

    expect(keyDownHandler).toBeTypeOf("function");

    const escapeEvent = {
      key: "Escape",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    keyDownHandler?.(escapeEvent);

    expect(store.getState().ui.activeToolId).toBe("draw");
    expect(escapeEvent.preventDefault).toHaveBeenCalledTimes(1);

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("clears the current selection when Escape is pressed on select", () => {
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
          byId: {
            a: {
              id: "a",
              type: "token",
              position: { x: 10, y: 12 },
              props: {},
            },
          },
          order: ["a"],
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
    setSelectedObjectIds(createToolApi(store), ["a"]);

    const keyDownHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "keydown")?.[1] as
      | ((event: KeyboardEvent) => void)
      | undefined;

    expect(keyDownHandler).toBeTypeOf("function");

    const escapeEvent = {
      key: "Escape",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    keyDownHandler?.(escapeEvent);

    expect(store.getState().selection.selectedObjectIds).toEqual([]);
    expect(getSelectToolState(store.getState().toolState).interaction).toBe(
      undefined,
    );
    expect(escapeEvent.preventDefault).toHaveBeenCalledTimes(1);

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("does not focus the canvas on pointer down while the text tool is active", () => {
    const textTool = new TextTool();
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
      initialToolId: textTool.id,
      tools: [
        {
          id: SELECT_TOOL_ID,
          label: "Select",
        },
        textTool,
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

    const pointerDownHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "pointerdown")?.[1] as
      | ((event: PointerEvent) => void)
      | undefined;

    expect(pointerDownHandler).toBeTypeOf("function");

    pointerDownHandler?.({
      clientX: 120,
      clientY: 80,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    } as PointerEvent);

    expect(canvas.focus).not.toHaveBeenCalled();

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("starts editing a selected text object when Enter is pressed on the focused canvas", () => {
    const textTool = new TextTool();
    const text = createTextObject({
      id: "text-1",
      position: { x: 20, y: 15 },
      text: "Press",
    });
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
          byId: {
            [text.id]: text,
          },
          order: [text.id],
        },
        style: {},
      },
      tools: [
        {
          id: SELECT_TOOL_ID,
          label: "Select",
        },
        textTool,
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
    setSelectedObjectIds(createToolApi(store), [text.id]);

    const keyDownHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "keydown")?.[1] as
      | ((event: KeyboardEvent) => void)
      | undefined;

    expect(keyDownHandler).toBeTypeOf("function");

    const editEvent = {
      key: "Enter",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    keyDownHandler?.(editEvent);

    expect(
      getTextToolState(store.getState().toolState).editingSession,
    ).toMatchObject({
      objectId: text.id,
    });
    expect(editEvent.preventDefault).toHaveBeenCalledTimes(1);

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("starts editing a selected text object on canvas double click", () => {
    const textTool = new TextTool();
    const text = createTextObject({
      id: "text-1",
      position: { x: 20, y: 15 },
      text: "Press",
    });
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
          byId: {
            [text.id]: text,
          },
          order: [text.id],
        },
        style: {},
      },
      tools: [
        {
          id: SELECT_TOOL_ID,
          label: "Select",
        },
        textTool,
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
    setSelectedObjectIds(createToolApi(store), [text.id]);

    const doubleClickHandler = vi
      .mocked(canvas.addEventListener)
      .mock.calls.find(([eventName]) => eventName === "dblclick")?.[1] as
      | ((event: MouseEvent) => void)
      | undefined;

    expect(doubleClickHandler).toBeTypeOf("function");

    doubleClickHandler?.({
      clientX: 128,
      clientY: 108,
    } as MouseEvent);

    expect(
      getTextToolState(store.getState().toolState).editingSession,
    ).toMatchObject({
      objectId: text.id,
    });

    runtime.unmount();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it.each([
    { name: "Meta+A", metaKey: true, ctrlKey: false },
    { name: "Ctrl+A", metaKey: false, ctrlKey: true },
  ])(
    "selects every object when $name is pressed on the focused canvas",
    ({ metaKey, ctrlKey }) => {
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
            byId: {
              a: {
                id: "a",
                type: "token",
                position: { x: 10, y: 12 },
                props: {},
              },
              b: {
                id: "b",
                type: "token",
                position: { x: 20, y: 18 },
                props: {},
              },
            },
            order: ["a", "b"],
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

      const keyDownHandler = vi
        .mocked(canvas.addEventListener)
        .mock.calls.find(([eventName]) => eventName === "keydown")?.[1] as
        | ((event: KeyboardEvent) => void)
        | undefined;

      expect(keyDownHandler).toBeTypeOf("function");

      const selectAllEvent = {
        key: "a",
        metaKey,
        ctrlKey,
        shiftKey: false,
        altKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      keyDownHandler?.(selectAllEvent);

      expect(store.getState().selection.selectedObjectIds).toEqual(["a", "b"]);
      expect(selectAllEvent.preventDefault).toHaveBeenCalledTimes(1);

      runtime.unmount();
      vi.unstubAllGlobals();
      globalThis.requestAnimationFrame = originalRequestAnimationFrame;
      globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    },
  );
});
