import type { Size } from "../../board/types";
import { createCanvasRenderer } from "./create-canvas-renderer";
import type { CanvasRenderRequest } from "./types";

type CanvasHostRenderRequest = Omit<
  CanvasRenderRequest,
  "canvas" | "requestRender"
>;

interface CanvasHost {
  mount: (canvas: HTMLCanvasElement) => void;
  render: (request: CanvasHostRenderRequest) => void;
  unmount: () => void;
}

interface CreateCanvasHostOptions {
  onResize?: (canvasRect: Size) => void;
}

function getCanvasRect(canvas: HTMLCanvasElement): Size {
  return {
    width: Math.max(1, Math.floor(canvas.clientWidth)),
    height: Math.max(1, Math.floor(canvas.clientHeight)),
  };
}

export function createCanvasHost({
  onResize,
}: CreateCanvasHostOptions): CanvasHost {
  const renderer = createCanvasRenderer();
  let canvas: HTMLCanvasElement | null = null;
  let frameId: number | null = null;
  let renderRequest: CanvasHostRenderRequest | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const requestRender = () => {
    if (!canvas || !renderRequest || frameId !== null) {
      return;
    }

    frameId = requestAnimationFrame(() => {
      frameId = null;
      const currentRenderRequest = renderRequest;

      if (!canvas || !currentRenderRequest) {
        return;
      }

      renderer.render({
        canvas,
        ...currentRenderRequest,
        requestRender,
      });
    });
  };

  const unmount = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }

    resizeObserver?.disconnect();
    resizeObserver = null;
    canvas = null;
  };

  return {
    mount: (nextCanvas) => {
      if (canvas === nextCanvas) {
        requestRender();
        return;
      }

      unmount();
      canvas = nextCanvas;
      const observedCanvas = nextCanvas;
      resizeObserver =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => {
              if (canvas !== observedCanvas) {
                return;
              }

              onResize?.(getCanvasRect(observedCanvas));
              requestRender();
            });
      resizeObserver?.observe(canvas);

      onResize?.(getCanvasRect(observedCanvas));
      requestRender();
    },
    render: (request) => {
      renderRequest = request;
      requestRender();
    },
    unmount,
  };
}
