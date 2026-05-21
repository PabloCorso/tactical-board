import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Board } from "../../core/board/types";
import type { Viewport } from "../../core/geometry/types";
import {
  DEFAULT_VIEWPORT,
  getViewportToFitSurface,
} from "../../core/editor/viewport-utils";
import {
  getBoardViewerViewport,
  getBoardViewerViewportFromPan,
  getBoardViewerViewportFromWheel,
  type BoardViewerCanvasRect,
  type BoardViewerViewportMode,
} from "../../core/viewer/board-viewer-viewport";
import { createCanvasRenderer } from "../../rendering/canvas/create-canvas-renderer";
import type {
  CanvasObjectRendererRegistry,
  CanvasOverlayItem,
  CanvasOverlayRendererRegistry,
  CanvasRenderer,
} from "../../rendering/canvas/types";

export type BoardViewerInitialViewport = Viewport | "fit";

export type UseBoardViewerCanvasOptions = {
  board: Board;
  mode?: BoardViewerViewportMode;
  viewport?: Viewport;
  initialViewport?: BoardViewerInitialViewport;
  onViewportChange?: (viewport: Viewport) => void;
  objectRenderers?: CanvasObjectRendererRegistry;
  overlayItems?: CanvasOverlayItem[];
  overlayRenderers?: CanvasOverlayRendererRegistry;
};

function getCanvasRect(canvas: HTMLCanvasElement): BoardViewerCanvasRect {
  return {
    width: Math.max(1, Math.floor(canvas.clientWidth)),
    height: Math.max(1, Math.floor(canvas.clientHeight)),
  };
}

export function useBoardViewerCanvas({
  board,
  mode = "fit",
  viewport,
  initialViewport = "fit",
  onViewportChange,
  objectRenderers,
  overlayItems,
  overlayRenderers,
}: UseBoardViewerCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const renderRef = useRef<() => void>(() => {});
  const dragRef = useRef<{
    pointerId: number;
    point: { x: number; y: number };
  } | null>(null);
  const interactiveViewportRef = useRef<Viewport>(DEFAULT_VIEWPORT);
  const hasInitializedInteractiveViewportRef = useRef(false);
  const [canvasRect, setCanvasRect] = useState<BoardViewerCanvasRect | null>(
    null,
  );
  const [interactiveViewport, setInteractiveViewport] =
    useState<Viewport>(DEFAULT_VIEWPORT);

  const resolveInitialViewport = useCallback(
    (rect: BoardViewerCanvasRect) => {
      if (initialViewport === "fit") {
        return getViewportToFitSurface({
          surface: board.surface,
          canvasRect: rect,
        });
      }

      return initialViewport;
    },
    [board.surface, initialViewport],
  );

  useEffect(function observeCanvasResize() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setCanvasRect(getCanvasRect(canvas));

    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => {
            setCanvasRect(getCanvasRect(canvas));
          });

    observer?.observe(canvas);

    return () => {
      observer?.disconnect();
    };
  }, []);

  useEffect(
    function initializeInteractiveViewport() {
      if (
        mode !== "interactive" ||
        !canvasRect ||
        hasInitializedInteractiveViewportRef.current
      ) {
        return;
      }

      const nextViewport = viewport ?? resolveInitialViewport(canvasRect);
      hasInitializedInteractiveViewportRef.current = true;
      interactiveViewportRef.current = nextViewport;
      setInteractiveViewport(nextViewport);
    },
    [canvasRect, mode, resolveInitialViewport, viewport],
  );

  const effectiveViewport = useMemo(
    () =>
      getBoardViewerViewport({
        mode,
        surface: board.surface,
        canvasRect: canvasRect ?? { width: 1, height: 1 },
        viewport: mode === "interactive" ? interactiveViewport : viewport,
      }),
    [board.surface, canvasRect, interactiveViewport, mode, viewport],
  );

  useEffect(
    function syncInteractiveViewportRef() {
      if (mode === "interactive") {
        interactiveViewportRef.current = effectiveViewport;
      }
    },
    [effectiveViewport, mode],
  );

  const updateInteractiveViewport = useCallback(
    (nextViewport: Viewport) => {
      interactiveViewportRef.current = nextViewport;
      setInteractiveViewport(nextViewport);
      onViewportChange?.(nextViewport);
    },
    [onViewportChange],
  );

  const requestRender = useCallback(() => {
    if (frameIdRef.current !== null) {
      return;
    }

    frameIdRef.current = requestAnimationFrame(() => {
      frameIdRef.current = null;
      renderRef.current();
    });
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (!rendererRef.current) {
      rendererRef.current = createCanvasRenderer();
    }

    rendererRef.current.render({
      canvas,
      board,
      viewport: effectiveViewport,
      requestRender,
      objectRenderers,
      overlayItems,
      overlayRenderers,
    });
  }, [
    board,
    effectiveViewport,
    objectRenderers,
    overlayItems,
    overlayRenderers,
    requestRender,
  ]);

  useEffect(
    function syncRenderRef() {
      renderRef.current = render;
    },
    [render],
  );

  useEffect(
    function renderCanvas() {
      render();
    },
    [render],
  );

  useEffect(
    function bindInteractiveViewportInput() {
      const canvas = canvasRef.current;
      if (!canvas || mode !== "interactive") {
        return;
      }

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) {
          return;
        }

        dragRef.current = {
          pointerId: event.pointerId,
          point: {
            x: event.clientX,
            y: event.clientY,
          },
        };
        canvas.setPointerCapture(event.pointerId);
      };

      const onPointerMove = (event: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) {
          return;
        }

        const delta = {
          x: event.clientX - drag.point.x,
          y: event.clientY - drag.point.y,
        };

        dragRef.current = {
          ...drag,
          point: {
            x: event.clientX,
            y: event.clientY,
          },
        };

        updateInteractiveViewport(
          getBoardViewerViewportFromPan({
            viewport: interactiveViewportRef.current,
            input: {
              delta,
            },
          }),
        );
      };

      const onPointerUp = (event: PointerEvent) => {
        if (dragRef.current?.pointerId !== event.pointerId) {
          return;
        }

        dragRef.current = null;
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      };

      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const nextCanvasRect = getCanvasRect(canvas);

        updateInteractiveViewport(
          getBoardViewerViewportFromWheel({
            surface: board.surface,
            viewport: interactiveViewportRef.current,
            input: {
              canvasRect: nextCanvasRect,
              clientPoint: {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              },
              deltaY: event.deltaY,
            },
          }),
        );
      };

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", onPointerUp);
      canvas.addEventListener("wheel", onWheel, { passive: false });

      return () => {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        canvas.removeEventListener("wheel", onWheel);
      };
    },
    [board.surface, mode, updateInteractiveViewport],
  );

  return {
    canvasRef,
    viewport: effectiveViewport,
  };
}
