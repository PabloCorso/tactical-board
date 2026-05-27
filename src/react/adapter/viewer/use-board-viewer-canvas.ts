import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Board } from "../../../core/board/types";
import type { Viewport } from "../../../core/geometry/types";
import {
  DEFAULT_VIEWPORT,
  getViewportToFitFrame,
} from "../../../core/editor/viewport-utils";
import {
  DEFAULT_BOARD_VIEWER_FIT_PADDING,
  getBoardViewerViewport,
  getBoardViewerViewportFromPinch,
  getBoardViewerViewportFromPan,
  getBoardViewerViewportFromWheel,
  type BoardViewerCanvasRect,
  type BoardViewerViewportMode,
} from "../../../core/viewer/board-viewer-viewport";
import { createCanvasRenderer } from "../../../core/rendering/canvas/create-canvas-renderer";
import type {
  AssetResolver,
  CanvasObjectRendererRegistry,
  CanvasOverlayItem,
  CanvasOverlayRendererRegistry,
  CanvasRenderer,
} from "../../../core/rendering/canvas/types";

export type BoardViewerInitialViewport = Viewport | "fit";

export type UseBoardViewerCanvasOptions = {
  board: Board;
  mode?: BoardViewerViewportMode;
  fitPadding?: number;
  extendBackground?: boolean;
  viewport?: Viewport;
  initialViewport?: BoardViewerInitialViewport;
  onViewportChange?: (viewport: Viewport) => void;
  objectRenderers?: CanvasObjectRendererRegistry;
  overlayItems?: CanvasOverlayItem[];
  overlayRenderers?: CanvasOverlayRendererRegistry;
  assetResolver?: AssetResolver;
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
  fitPadding = DEFAULT_BOARD_VIEWER_FIT_PADDING,
  extendBackground = true,
  viewport,
  initialViewport = "fit",
  onViewportChange,
  objectRenderers,
  overlayItems,
  overlayRenderers,
  assetResolver,
}: UseBoardViewerCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const renderRef = useRef<() => void>(() => {});
  const dragRef = useRef<{
    pointerId: number;
    point: { x: number; y: number };
  } | null>(null);
  const touchPointersRef = useRef<
    Map<number, { point: { x: number; y: number } }>
  >(new Map());
  const pinchGestureRef = useRef<{ previousDistance: number } | null>(null);
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
        return getViewportToFitFrame({
          frame: board.frame,
          canvasRect: rect,
          fitPadding,
        });
      }

      return initialViewport;
    },
    [board.frame, fitPadding, initialViewport],
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
        board,
        mode,
        frame: board.frame,
        canvasRect: canvasRect ?? { width: 1, height: 1 },
        viewport: mode === "interactive" ? interactiveViewport : viewport,
        fitPadding,
      }),
    [board, canvasRect, fitPadding, interactiveViewport, mode, viewport],
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
      extendBackground,
      fitPadding: fitPadding,
      requestRender,
      objectRenderers,
      overlayItems,
      overlayRenderers,
      assetResolver,
    });
  }, [
    assetResolver,
    board,
    effectiveViewport,
    extendBackground,
    fitPadding,
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

      const touchPointers = touchPointersRef.current;

      const getTouchPair = () => {
        const pointers = [...touchPointers.values()];

        if (pointers.length < 2) {
          return null;
        }

        return [pointers[0]!, pointers[1]!] as const;
      };

      const getPinchMetrics = () => {
        const pair = getTouchPair();

        if (!pair) {
          return null;
        }

        const [first, second] = pair;

        return {
          distance: Math.hypot(
            second.point.x - first.point.x,
            second.point.y - first.point.y,
          ),
          center: {
            x: (first.point.x + second.point.x) / 2,
            y: (first.point.y + second.point.y) / 2,
          },
        };
      };

      const beginPinchGesture = () => {
        const metrics = getPinchMetrics();

        pinchGestureRef.current = metrics
          ? { previousDistance: metrics.distance }
          : null;
        dragRef.current = null;
      };

      const updatePinchGesture = () => {
        const pinchGesture = pinchGestureRef.current;
        const metrics = getPinchMetrics();

        if (
          !pinchGesture ||
          !metrics ||
          metrics.distance <= 0 ||
          pinchGesture.previousDistance <= 0
        ) {
          return false;
        }

        const rect = canvas.getBoundingClientRect();
        const nextCanvasRect = getCanvasRect(canvas);

        updateInteractiveViewport(
          getBoardViewerViewportFromPinch({
            frame: board.frame,
            viewport: interactiveViewportRef.current,
            input: {
              canvasRect: nextCanvasRect,
              clientPoint: {
                x: metrics.center.x - rect.left,
                y: metrics.center.y - rect.top,
              },
              fitPadding,
              scale: metrics.distance / pinchGesture.previousDistance,
            },
          }),
        );
        pinchGestureRef.current = { previousDistance: metrics.distance };
        return true;
      };

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) {
          return;
        }

        if (event.pointerType === "touch") {
          touchPointers.set(event.pointerId, {
            point: {
              x: event.clientX,
              y: event.clientY,
            },
          });

          if (touchPointers.size >= 2) {
            beginPinchGesture();
            canvas.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
          }
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
        const touchPointer = touchPointers.get(event.pointerId);
        if (touchPointer) {
          touchPointers.set(event.pointerId, {
            point: {
              x: event.clientX,
              y: event.clientY,
            },
          });

          if (pinchGestureRef.current) {
            if (updatePinchGesture()) {
              event.preventDefault();
            }
            return;
          }
        }

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
        touchPointers.delete(event.pointerId);
        if (touchPointers.size < 2) {
          pinchGestureRef.current = null;
        } else if (pinchGestureRef.current) {
          beginPinchGesture();
        }

        if (dragRef.current?.pointerId !== event.pointerId) {
          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }
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
            frame: board.frame,
            viewport: interactiveViewportRef.current,
            input: {
              canvasRect: nextCanvasRect,
              clientPoint: {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              },
              deltaY: event.deltaY,
              fitPadding,
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
        touchPointers.clear();
        pinchGestureRef.current = null;
      };
    },
    [board.frame, fitPadding, mode, updateInteractiveViewport],
  );

  return {
    canvasRef,
    viewport: effectiveViewport,
  };
}
