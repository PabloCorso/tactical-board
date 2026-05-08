import type { BoardSurfaceMarking } from "../../core/board/types";
import { createBoardSurfaceTransform } from "../../core/geometry/create-board-surface-transform";
import type { CanvasRenderer } from "./types";

const SURFACE_INSET = 14;
const SURFACE_RADIUS = 10;
const DEFAULT_OBJECT_DIAMETER = 1.8;
const TOKEN_TOP = "#f8f1d3";
const TOKEN_BOTTOM = "#d6bb67";
const TOKEN_TEXT = "#09231d";
const TOKEN_BORDER = "rgba(214,187,103,0.22)";
const SELECTION_STROKE = "#ff8f3d";
const TEXT_FONT = '700 18px "ui-rounded", "SF Pro Display", sans-serif';

function syncCanvasSize(canvas: HTMLCanvasElement) {
  const width = Math.max(1, Math.floor(canvas.clientWidth));
  const height = Math.max(1, Math.floor(canvas.clientHeight));
  const ratio =
    typeof window === "undefined"
      ? 1
      : Math.max(window.devicePixelRatio || 1, 1);

  if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }

  return { width, height, ratio };
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function toRadians(angle: number) {
  return (angle * Math.PI) / 180;
}

function applyMarkingStyle(
  context: CanvasRenderingContext2D,
  marking: BoardSurfaceMarking,
  pixelsPerUnit: number,
) {
  context.globalAlpha = marking.opacity ?? 1;
  context.fillStyle = marking.fill ?? "transparent";
  context.strokeStyle = marking.stroke ?? "transparent";
  context.lineWidth = (marking.strokeWidth ?? 0) * pixelsPerUnit;
}

function drawSurfaceMarking(
  context: CanvasRenderingContext2D,
  marking: BoardSurfaceMarking,
  worldToCanvas: (point: { x: number; y: number }) => { x: number; y: number },
  pixelsPerUnit: number,
) {
  applyMarkingStyle(context, marking, pixelsPerUnit);

  switch (marking.kind) {
    case "rect": {
      const topLeft = worldToCanvas({ x: marking.x, y: marking.y });
      const width = marking.width * pixelsPerUnit;
      const height = marking.height * pixelsPerUnit;
      if (marking.fill) {
        context.fillRect(topLeft.x, topLeft.y, width, height);
      }
      if (marking.stroke && marking.strokeWidth) {
        context.strokeRect(topLeft.x, topLeft.y, width, height);
      }
      return;
    }
    case "line": {
      const from = worldToCanvas({ x: marking.x1, y: marking.y1 });
      const to = worldToCanvas({ x: marking.x2, y: marking.y2 });
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
      return;
    }
    case "circle": {
      const center = worldToCanvas({ x: marking.cx, y: marking.cy });
      context.beginPath();
      context.arc(center.x, center.y, marking.r * pixelsPerUnit, 0, Math.PI * 2);
      if (marking.fill) {
        context.fill();
      }
      if (marking.stroke && marking.strokeWidth) {
        context.stroke();
      }
      return;
    }
    case "arc": {
      const center = worldToCanvas({ x: marking.cx, y: marking.cy });
      context.beginPath();
      context.arc(
        center.x,
        center.y,
        marking.r * pixelsPerUnit,
        toRadians(marking.startAngle),
        toRadians(marking.endAngle),
      );
      context.stroke();
      return;
    }
  }
}

export function createCanvasRenderer(): CanvasRenderer {
  return {
    render: ({ canvas, board, viewport, selectedObjectIds = [] }) => {
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const { width, height, ratio } = syncCanvasSize(canvas);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const surfaceTransform = createBoardSurfaceTransform({
        surface: board.surface,
        frame: {
          x: SURFACE_INSET + viewport.pan.x,
          y: SURFACE_INSET + viewport.pan.y,
          width: width - SURFACE_INSET * 2,
          height: height - SURFACE_INSET * 2,
        },
      });

      drawRoundedRect(
        context,
        surfaceTransform.frame.x,
        surfaceTransform.frame.y,
        surfaceTransform.frame.width,
        surfaceTransform.frame.height,
        SURFACE_RADIUS,
      );
      context.fillStyle = board.surface.background ?? "rgba(255,255,255,0.03)";
      context.fill();

      context.save();
      drawRoundedRect(
        context,
        surfaceTransform.frame.x,
        surfaceTransform.frame.y,
        surfaceTransform.frame.width,
        surfaceTransform.frame.height,
        SURFACE_RADIUS,
      );
      context.clip();

      for (const marking of board.surface.markings ?? []) {
        drawSurfaceMarking(
          context,
          marking,
          surfaceTransform.worldToCanvas,
          surfaceTransform.pixelsPerUnit,
        );
      }

      context.font = TEXT_FONT;
      context.textAlign = "center";
      context.textBaseline = "middle";

      for (const objectId of board.objects.order) {
        const object = board.objects.byId[objectId];
        if (!object) {
          continue;
        }

        const { x, y } = surfaceTransform.worldToCanvas(object.position);
        const selected = selectedObjectIds.includes(object.id);
        const objectRadius =
          object.size && object.size.mode !== "screen"
            ? (object.size.width / 2) * surfaceTransform.pixelsPerUnit
            : object.size?.width
              ? object.size.width / 2
              : (DEFAULT_OBJECT_DIAMETER / 2) * surfaceTransform.pixelsPerUnit;
        const tokenFill = context.createLinearGradient(
          x,
          y - objectRadius,
          x,
          y + objectRadius,
        );
        tokenFill.addColorStop(0, TOKEN_TOP);
        tokenFill.addColorStop(1, TOKEN_BOTTOM);
        context.fillStyle = tokenFill;

        context.beginPath();
        context.arc(x, y, objectRadius, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = TOKEN_BORDER;
        context.lineWidth = 1;
        context.stroke();

        if (selected) {
          context.beginPath();
          context.arc(x, y, objectRadius + 4, 0, Math.PI * 2);
          context.strokeStyle = SELECTION_STROKE;
          context.lineWidth = 3;
          context.stroke();
        }

        context.fillStyle = TOKEN_TEXT;
        context.fillText(
          String(object.props.label ?? object.props.number ?? object.type),
          x,
          y + 1,
        );
      }

      context.globalAlpha = 1;

      context.restore();
    },
  };
}
