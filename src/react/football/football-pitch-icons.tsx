import { useEffect, useMemo, useRef } from "react";
import type {
  BoardFrameConfig,
  BoardFrameMarking,
} from "../../core/board/types";
import {
  createFootballPitch,
  type FootballPitchVariant,
} from "./football-board";

export const FOOTBALL_PITCH_TOOL_ID = "pitch";

export const FOOTBALL_PITCH_OPTIONS: Array<{
  label: string;
  value: FootballPitchVariant;
}> = [
  { label: "Full pitch", value: "full-pitch" },
  { label: "Half pitch", value: "half-pitch" },
  { label: "Reduced space", value: "reduced-space" },
];

export function getFootballPitchVariant(value: unknown): FootballPitchVariant {
  if (
    value === "full-pitch" ||
    value === "half-pitch" ||
    value === "reduced-space"
  ) {
    return value;
  }

  return "full-pitch";
}

export type FootballPitchPreviewProps = {
  className?: string;
  variant: FootballPitchVariant;
  width: number;
  height: number;
};

export function FootballPitchPreview({
  className,
  variant,
  width,
  height,
}: FootballPitchPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useMemo(() => createFootballPitch(variant), [variant]);

  useEffect(() => {
    drawFootballPitchPreviewCanvas({
      canvas: canvasRef.current,
      height,
      frame,
      width,
    });
  }, [height, frame, width]);

  return (
    <canvas
      aria-hidden="true"
      className={["block", className].filter(Boolean).join(" ")}
      ref={canvasRef}
      style={{ width, height }}
    />
  );
}

function drawFootballPitchPreviewCanvas({
  canvas,
  height,
  frame,
  width,
}: {
  canvas: HTMLCanvasElement | null;
  height: number;
  frame: BoardFrameConfig;
  width: number;
}) {
  const context = canvas?.getContext("2d");

  if (!canvas || !context) {
    return;
  }

  const ratio =
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.scale(ratio, ratio);
  drawFootballPitchPreview(context, frame, width, height);
}

function drawFootballPitchPreview(
  context: CanvasRenderingContext2D,
  frame: BoardFrameConfig,
  width: number,
  height: number,
) {
  const scale = Math.min(width / frame.width, height / frame.height);
  const renderWidth = frame.width * scale;
  const renderHeight = frame.height * scale;
  const offsetX = (width - renderWidth) / 2;
  const offsetY = (height - renderHeight) / 2;
  const radius = Math.min(6, renderWidth / 18, renderHeight / 18);

  context.save();
  traceRoundedRect(
    context,
    offsetX,
    offsetY,
    renderWidth,
    renderHeight,
    radius,
  );
  context.clip();
  context.fillStyle = frame.background ?? frame.fill ?? "#177238";
  context.fillRect(offsetX, offsetY, renderWidth, renderHeight);

  for (const marking of frame.markings ?? []) {
    drawFootballPitchMarkingPreview(context, marking, scale, offsetX, offsetY);
  }

  context.restore();
}

function traceRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const resolvedRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + resolvedRadius, y);
  context.lineTo(x + width - resolvedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + resolvedRadius);
  context.lineTo(x + width, y + height - resolvedRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - resolvedRadius,
    y + height,
  );
  context.lineTo(x + resolvedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - resolvedRadius);
  context.lineTo(x, y + resolvedRadius);
  context.quadraticCurveTo(x, y, x + resolvedRadius, y);
  context.closePath();
}

function drawFootballPitchMarkingPreview(
  context: CanvasRenderingContext2D,
  marking: BoardFrameMarking,
  scale: number,
  offsetX: number,
  offsetY: number,
) {
  context.globalAlpha = marking.opacity ?? 1;
  context.fillStyle = marking.fill ?? "transparent";
  context.strokeStyle = marking.stroke ?? "transparent";
  context.lineWidth = Math.max((marking.strokeWidth ?? 1) * scale, 1);

  switch (marking.kind) {
    case "rect": {
      const x = offsetX + marking.x * scale;
      const y = offsetY + marking.y * scale;
      const width = marking.width * scale;
      const height = marking.height * scale;

      if (marking.fill) {
        context.fillRect(x, y, width, height);
      }

      if (marking.stroke) {
        context.strokeRect(x, y, width, height);
      }

      break;
    }
    case "line": {
      context.beginPath();
      context.moveTo(
        offsetX + marking.x1 * scale,
        offsetY + marking.y1 * scale,
      );
      context.lineTo(
        offsetX + marking.x2 * scale,
        offsetY + marking.y2 * scale,
      );
      context.stroke();
      break;
    }
    case "circle": {
      context.beginPath();
      context.arc(
        offsetX + marking.cx * scale,
        offsetY + marking.cy * scale,
        marking.r * scale,
        0,
        Math.PI * 2,
      );

      if (marking.fill) {
        context.fill();
      }

      if (marking.stroke) {
        context.stroke();
      }

      break;
    }
    case "arc": {
      context.beginPath();
      context.arc(
        offsetX + marking.cx * scale,
        offsetY + marking.cy * scale,
        marking.r * scale,
        (marking.startAngle * Math.PI) / 180,
        (marking.endAngle * Math.PI) / 180,
      );
      context.stroke();
      break;
    }
  }

  context.globalAlpha = 1;
}
