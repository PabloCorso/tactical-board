import { useEffect, useRef } from "react";
import type { Board } from "../../core/board/types";
import type { Viewport } from "../../core/geometry/types";
import { createCanvasRenderer } from "../../core/rendering/canvas/create-canvas-renderer";
import type { CanvasRenderer } from "../../core/rendering/canvas/types";

type UseCanvasRendererOptions = {
  board: Board;
  viewport: Viewport;
};

export function useCanvasRenderer({
  board,
  viewport,
}: UseCanvasRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  useEffect(
    function renderCanvas() {
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
        requestRender: () => {
          rendererRef.current?.render({
            canvas,
            board,
            viewport,
          });
        },
      });
    },
    [board, viewport],
  );

  useEffect(
    function observeCanvasResize() {
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
                requestRender: () => {
                  rendererRef.current?.render({
                    canvas,
                    board,
                    viewport,
                  });
                },
              });
            });

      observer?.observe(canvas);

      return () => {
        observer?.disconnect();
      };
    },
    [board, viewport],
  );

  return canvasRef;
}
