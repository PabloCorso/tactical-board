import { useEffect, useRef } from "react";
import type { Point } from "../../../core/board/types";
import type { BoardSpaceProjection } from "../../../core/geometry/board-space-projection";
import {
  createArrowObject,
  DEFAULT_ARROW_DASH_STYLE,
  DEFAULT_ARROW_STROKE_WIDTH,
  type ArrowKind,
  type ArrowHeadStyle,
  type ArrowLineStyle,
  type ArrowObject,
} from "../../../core/objects/arrow-object";
import { renderArrow } from "../../../core/tools/arrow-tool";

type ArrowIconLayout = "wide" | "compact";

export type BoardEditorArrowIconStyle = {
  kind: ArrowKind;
  color?: string;
  strokeWidth?: number;
  lineStyle?: ArrowLineStyle;
  dashStyle?: number[];
  startHead: ArrowHeadStyle;
  endHead: ArrowHeadStyle;
};

export function BoardEditorArrowIcon({
  draftStyle,
  className,
  width = 40,
  height = 20,
  layout = "wide",
}: {
  draftStyle: BoardEditorArrowIconStyle;
  className?: string;
  width?: number;
  height?: number;
  layout?: ArrowIconLayout;
}) {
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

      const resolvedColor =
        draftStyle.color && draftStyle.color !== "currentColor"
          ? draftStyle.color
          : window.getComputedStyle(canvas).color;
      const arrow = createArrowIconPreviewObject(
        draftStyle,
        layout,
        resolvedColor,
        width,
        height,
      );

      renderArrow({
        context,
        object: arrow,
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
        frameTransform: createArrowIconProjection(width, height),
      });
    };

    draw();

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [draftStyle, height, layout, width]);

  return (
    <canvas
      aria-hidden="true"
      className={className}
      ref={canvasRef}
      style={{ width, height }}
    />
  );
}

function createArrowIconPreviewObject(
  draftStyle: BoardEditorArrowIconStyle,
  layout: ArrowIconLayout,
  color: string,
  width: number,
  height: number,
): ArrowObject {
  const base = {
    id: "arrow-icon-preview",
    kind: draftStyle.kind,
    color,
    strokeWidth: draftStyle.strokeWidth ?? DEFAULT_ARROW_STROKE_WIDTH,
    lineStyle: draftStyle.lineStyle ?? "solid",
    dashStyle: Array.from(draftStyle.dashStyle ?? DEFAULT_ARROW_DASH_STYLE),
    startHead: draftStyle.startHead,
    endHead: draftStyle.endHead,
  } as const;

  const preview = getSimplePreviewGeometry(layout, width, height);

  return createArrowObject({
    ...base,
    start: preview.start,
    end: preview.end,
    curveOffset: draftStyle.kind === "curved" ? preview.curveOffset : 0,
  });
}

function getSimplePreviewGeometry(
  layout: ArrowIconLayout,
  width: number,
  height: number,
) {
  const inset = layout === "compact" ? 4 : 5;

  return layout === "compact"
    ? {
        start: { x: inset, y: height - inset },
        end: { x: width - inset, y: inset },
        curveOffset: -height * 0.26,
      }
    : {
        start: { x: inset, y: height * 0.64 },
        end: { x: width - inset, y: height * 0.36 },
        curveOffset: -height * 0.24,
      };
}

function createArrowIconProjection(
  width: number,
  height: number,
): BoardSpaceProjection {
  const boardToCanvas = (point: Point) => ({
    x: point.x,
    y: point.y,
  });

  return {
    frame: { x: 0, y: 0, width, height },
    zoom: 1,
    scale: 1,
    boardToCanvas,
    canvasToBoard: (point) => ({
      x: point.x,
      y: point.y,
    }),
    getObjectCanvasRadius: (target) => {
      const targetWidth = target.size?.width ?? 0;
      return targetWidth / 2;
    },
    getObjectCanvasBounds: (target) => {
      const canvasCenter = boardToCanvas(target.position);
      const targetWidth = target.size?.width ?? 0;
      const targetHeight = target.size?.height ?? target.size?.width ?? 0;

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
