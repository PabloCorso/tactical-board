import { useEffect, useRef } from "react";
import type { Point } from "../../core/board/types";
import type { BoardSpaceProjection } from "../../core/geometry/board-space-projection";
import {
  createArrowObject,
  DEFAULT_ARROW_DASH_STYLE,
  DEFAULT_ARROW_STROKE_WIDTH,
  type ArrowBodyStyle,
  type ArrowHeadStyle,
  type ArrowLineStyle,
  type ArrowObject,
} from "../../core/objects/arrow-object";
import { renderArrow } from "../../tools/arrow-tool";

type ArrowIconLayout = "wide" | "compact";
const WIDE_ICON_INSET = 0.5;
const COMPACT_ICON_INSET = 0.35;
const WIDE_ICON_ZOOM_MULTIPLIER = 1.35;
const COMPACT_ICON_ZOOM_MULTIPLIER = 1.2;

export type BoardEditorArrowIconStyle = {
  bodyStyle: ArrowBodyStyle;
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
        surfaceTransform: createArrowIconProjection(width, height, layout),
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
): ArrowObject {
  const base = {
    id: "arrow-icon-preview",
    bodyStyle: draftStyle.bodyStyle,
    color,
    strokeWidth: draftStyle.strokeWidth ?? DEFAULT_ARROW_STROKE_WIDTH,
    lineStyle: draftStyle.lineStyle ?? "solid",
    dashStyle: Array.from(draftStyle.dashStyle ?? DEFAULT_ARROW_DASH_STYLE),
    startHead: draftStyle.startHead,
    endHead: draftStyle.endHead,
  } as const;

  const preview = getSimplePreviewGeometry(layout);

  return createArrowObject({
    ...base,
    start: preview.start,
    end: preview.end,
    curveOffset: draftStyle.bodyStyle === "curved" ? preview.curveOffset : 0,
  });
}

function getSimplePreviewGeometry(layout: ArrowIconLayout) {
  return layout === "compact"
    ? {
        start: { x: 1.0, y: 4.8 },
        end: { x: 5.1, y: 1.2 },
        curveOffset: -2.6,
      }
    : {
        start: { x: 1.0, y: 3.1 },
        end: { x: 7.0, y: 0.95 },
        curveOffset: -2.3,
      };
}

function createArrowIconProjection(
  width: number,
  height: number,
  layout: ArrowIconLayout,
): BoardSpaceProjection {
  const frame = getArrowIconFrame(layout);
  const inset = layout === "compact" ? COMPACT_ICON_INSET : WIDE_ICON_INSET;
  const usableWidth = Math.max(width - inset * 2, 1);
  const usableHeight = Math.max(height - inset * 2, 1);
  const baseScale = Math.min(
    usableWidth / frame.width,
    usableHeight / frame.height,
  );
  const zoomMultiplier =
    layout === "compact"
      ? COMPACT_ICON_ZOOM_MULTIPLIER
      : WIDE_ICON_ZOOM_MULTIPLIER;
  const scale = baseScale * zoomMultiplier;
  const offsetX = inset + (usableWidth - frame.width * scale) / 2;
  const offsetY = inset + (usableHeight - frame.height * scale) / 2;

  const worldToCanvas = (point: Point) => ({
    x: (point.x - frame.x) * scale + offsetX,
    y: (point.y - frame.y) * scale + offsetY,
  });

  return {
    frame: { x: 0, y: 0, width, height },
    zoom: 1,
    pixelsPerUnit: scale,
    worldOrigin: { x: frame.x, y: frame.y },
    worldToCanvas,
    canvasToWorld: (point) => ({
      x: (point.x - offsetX) / scale + frame.x,
      y: (point.y - offsetY) / scale + frame.y,
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

function getArrowIconFrame(layout: ArrowIconLayout) {
  return layout === "compact"
    ? { x: -0.6, y: -0.6, width: 7.2, height: 7.2 }
    : { x: -0.4, y: -0.5, width: 8.8, height: 5 };
}
