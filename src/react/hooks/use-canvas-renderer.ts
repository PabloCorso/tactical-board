import { useEffect, useRef } from "react";
import type { Board, BoardObjectBase } from "../../core/board/types";
import type { Viewport } from "../../core/geometry/types";
import { createCanvasRenderer } from "../../rendering/canvas/create-canvas-renderer";
import type { CanvasRenderer } from "../../rendering/canvas/types";

interface UseCanvasRendererOptions<
  TObject extends BoardObjectBase = BoardObjectBase,
> {
  board: Board<TObject>;
  viewport: Viewport;
  selectedObjectIds?: string[];
}

export function useCanvasRenderer<
  TObject extends BoardObjectBase = BoardObjectBase,
>({ board, viewport, selectedObjectIds }: UseCanvasRendererOptions<TObject>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  useEffect(() => {
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
      viewport,
      selectedObjectIds,
    });
  }, [board, viewport, selectedObjectIds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => {
            if (!rendererRef.current) {
              rendererRef.current = createCanvasRenderer();
            }

            rendererRef.current.render({
              canvas,
              board,
              viewport,
              selectedObjectIds,
            });
          });

    observer?.observe(canvas);

    return () => {
      observer?.disconnect();
    };
  }, [board, viewport, selectedObjectIds]);

  return canvasRef;
}
