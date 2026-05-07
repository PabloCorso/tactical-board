import { createCanvasRenderer } from "../../rendering/canvas/create-canvas-renderer";
import type { CanvasRenderer } from "../../rendering/canvas/types";
import { createBoardEditorController } from "./create-board-editor-controller";
import type { BoardEditorStore } from "../store/create-board-editor-store";

export interface BoardEditorRuntime {
  mount: (canvas: HTMLCanvasElement) => void;
  unmount: () => void;
}

export interface CreateBoardEditorRuntimeOptions {
  store: BoardEditorStore;
}

export function createBoardEditorRuntime({
  store,
}: CreateBoardEditorRuntimeOptions): BoardEditorRuntime {
  const controller = createBoardEditorController(store);
  const renderer: CanvasRenderer = createCanvasRenderer();
  let canvas: HTMLCanvasElement | null = null;
  let frameId: number | null = null;
  let unsubscribe: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const render = () => {
    if (!canvas) {
      return;
    }

    const state = store.getState();
    renderer.render({
      canvas,
      board: state.board,
      viewport: state.ui.viewport,
      selectedObjectIds: state.ui.selectedObjectIds,
    });
  };

  const requestRender = () => {
    if (frameId !== null) {
      return;
    }

    frameId = requestAnimationFrame(() => {
      frameId = null;
      render();
    });
  };

  const createPointerInput = (event: PointerEvent) => {
    if (!canvas) {
      return null;
    }

    return {
      clientPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      pointerId: event.pointerId,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      canvasRect: canvas.getBoundingClientRect(),
    };
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!canvas) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);
    const input = createPointerInput(event);
    if (!input) {
      return;
    }

    controller.dispatchPointerEvent("onPointerDown", input);
  };

  const onPointerMove = (event: PointerEvent) => {
    const input = createPointerInput(event);
    if (!input) {
      return;
    }

    controller.dispatchPointerEvent("onPointerMove", input);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!canvas) {
      return;
    }

    const input = createPointerInput(event);
    if (!input) {
      return;
    }

    controller.dispatchPointerEvent("onPointerUp", input);
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  return {
    mount: (nextCanvas) => {
      if (canvas === nextCanvas) {
        requestRender();
        return;
      }

      if (canvas) {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
      }

      resizeObserver?.disconnect();
      unsubscribe?.();

      canvas = nextCanvas;
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);

      unsubscribe = store.subscribe(() => {
        requestRender();
      });

      resizeObserver =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => {
              requestRender();
            });
      resizeObserver?.observe(canvas);

      requestRender();
    },
    unmount: () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }

      resizeObserver?.disconnect();
      resizeObserver = null;
      unsubscribe?.();
      unsubscribe = null;

      if (canvas) {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
      }

      canvas = null;
    },
  };
}
