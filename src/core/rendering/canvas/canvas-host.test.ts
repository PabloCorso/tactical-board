import { afterEach, describe, expect, it, vi } from "vitest";
import type { Board } from "../../board/types";
import type { Viewport } from "../../geometry/types";
import { createCanvasHost } from "./canvas-host";
import * as canvasRendererModule from "./create-canvas-renderer";

const board: Board = {
  id: "board-1",
  version: 1,
  metadata: {},
  frame: { width: 100, height: 50 },
  objects: { byId: {}, order: [] },
  style: {},
};

describe("createCanvasHost", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("coalesces render requests and cancels pending rendering on unmount", () => {
    const render = vi.fn();
    vi.spyOn(canvasRendererModule, "createCanvasRenderer").mockReturnValue({
      render,
    });
    const frameCallbacks = new Map<number, FrameRequestCallback>();
    let nextFrameId = 1;
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      const frameId = nextFrameId;
      nextFrameId += 1;
      frameCallbacks.set(frameId, callback);
      return frameId;
    });
    const cancelAnimationFrame = vi.fn((frameId: number) => {
      frameCallbacks.delete(frameId);
    });
    const observe = vi.fn();
    const disconnect = vi.fn();
    let notifyResize: ResizeObserverCallback = () => {};

    class ResizeObserverStub {
      constructor(callback: ResizeObserverCallback) {
        notifyResize = callback;
      }

      observe = observe;
      disconnect = disconnect;
    }

    vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);

    const canvas = {
      clientWidth: 640,
      clientHeight: 360,
    } as HTMLCanvasElement;
    const onResize = vi.fn();
    let viewport: Viewport = { pan: { x: 0, y: 0 }, zoom: 1 };
    const host = createCanvasHost({ onResize });

    host.mount(canvas);
    host.render({ board, viewport });
    viewport = { pan: { x: 12, y: 8 }, zoom: 2 };
    host.render({ board, viewport });

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(onResize).toHaveBeenCalledWith({ width: 640, height: 360 });
    expect(observe).toHaveBeenCalledWith(canvas);

    const firstFrame = frameCallbacks.get(1);
    frameCallbacks.delete(1);
    firstFrame?.(0);

    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        canvas,
        viewport,
        requestRender: expect.any(Function),
      }),
    );

    host.render({ board, viewport });
    host.render({ board, viewport });
    notifyResize([], {} as ResizeObserver);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    host.unmount();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(2);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(frameCallbacks.size).toBe(0);
  });
});
