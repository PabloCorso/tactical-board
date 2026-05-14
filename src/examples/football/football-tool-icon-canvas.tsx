import { useEffect, useRef } from "react";
import type { BoardObject } from "../../core/board/types";
import type { BoardSpaceProjection } from "../../core/geometry/board-space-projection";
import type { CanvasObjectRenderer } from "../../rendering/canvas/types";

type FootballToolIconCanvasProps<TObject extends BoardObject> = {
  object: TObject;
  renderer: CanvasObjectRenderer;
  className?: string;
  width?: number;
  height?: number;
  createProjection?: (
    object: TObject,
    width: number,
    height: number,
  ) => BoardSpaceProjection;
};

export function FootballToolIconCanvas<TObject extends BoardObject>({
  object,
  renderer,
  className,
  width = 24,
  height = 24,
  createProjection = createCenteredObjectIconProjection,
}: FootballToolIconCanvasProps<TObject>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    let frameId = 0;

    const draw = () => {
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      const ratio =
        typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.scale(ratio, ratio);
      renderer({
        context,
        object,
        appearance: "default",
        requestRender: () => {
          if (frameId !== 0) {
            return;
          }

          frameId = window.requestAnimationFrame(() => {
            frameId = 0;
            draw();
          });
        },
        surfaceTransform: createProjection(object, width, height),
      });
    };

    draw();

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [createProjection, height, object, renderer, width]);

  return (
    <canvas
      aria-hidden="true"
      className={className}
      ref={canvasRef}
      style={{ width, height }}
    />
  );
}

export function createCenteredObjectIconProjection(
  object: BoardObject,
  width: number,
  height: number,
): BoardSpaceProjection {
  const objectWidth = Math.max(object.size?.width ?? 1, 0.25);
  const objectHeight = Math.max(
    object.size?.height ?? object.size?.width ?? 1,
    0.25,
  );
  const left = object.position.x - objectWidth / 2;
  const top = object.position.y - objectHeight / 2;
  const inset = 2;
  const usableWidth = Math.max(width - inset * 2, 1);
  const usableHeight = Math.max(height - inset * 2, 1);
  const scale = Math.min(
    usableWidth / objectWidth,
    usableHeight / objectHeight,
  );
  const offsetX = inset + (usableWidth - objectWidth * scale) / 2;
  const offsetY = inset + (usableHeight - objectHeight * scale) / 2;

  const worldToCanvas = (point: { x: number; y: number }) => ({
    x: (point.x - left) * scale + offsetX,
    y: (point.y - top) * scale + offsetY,
  });

  return {
    frame: { x: 0, y: 0, width, height },
    zoom: scale,
    pixelsPerUnit: scale,
    worldOrigin: { x: left, y: top },
    worldToCanvas,
    canvasToWorld: (point) => ({
      x: (point.x - offsetX) / scale + left,
      y: (point.y - offsetY) / scale + top,
    }),
    getObjectCanvasRadius: (target) => {
      const targetWidth = target.size?.width ?? 0;
      return (targetWidth * scale) / 2;
    },
    getObjectCanvasBounds: (target) => {
      const canvasCenter = worldToCanvas(target.position);
      const targetWidth = (target.size?.width ?? 0) * scale;
      const targetHeight =
        (target.size?.height ?? target.size?.width ?? 0) * scale;

      return {
        x: canvasCenter.x - targetWidth / 2,
        y: canvasCenter.y - targetHeight / 2,
        width: targetWidth,
        height: targetHeight,
      };
    },
    hitTestObject: () => false,
  };
}
