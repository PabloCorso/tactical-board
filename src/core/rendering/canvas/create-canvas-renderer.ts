import type { BoardSurfaceMarking } from "../../board/types";
import { createBoardSpaceProjection } from "../../geometry/board-space-projection";
import { getOrderedBoardObjectIds } from "../../board/object-order";
import type {
  CanvasObjectRenderInput,
  CanvasObjectRenderer,
  CanvasOverlayRenderInput,
  CanvasOverlayRendererRegistry,
  CanvasRectOverlayItem,
  CanvasRenderer,
} from "./types";

const SURFACE_INSET = 14;
const SURFACE_RADIUS = 10;
const TOKEN_TOP = "#f8f1d3";
const TOKEN_BOTTOM = "#d6bb67";
const TOKEN_TEXT = "#09231d";
const TOKEN_BORDER = "rgba(214,187,103,0.22)";
const TEXT_FONT = '700 18px "ui-rounded", "SF Pro Display", sans-serif';
const DEFAULT_SURFACE_BACKGROUND = "rgba(255,255,255,0.03)";

function getSurfaceBackground(board: {
  surface: { background?: string; fill?: string };
}) {
  return (
    board.surface.background ?? board.surface.fill ?? DEFAULT_SURFACE_BACKGROUND
  );
}

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
  scale: number,
) {
  context.globalAlpha = marking.opacity ?? 1;
  context.fillStyle = marking.fill ?? "transparent";
  context.strokeStyle = marking.stroke ?? "transparent";
  context.lineWidth = (marking.strokeWidth ?? 0) * scale;
}

function drawSurfaceMarking(
  context: CanvasRenderingContext2D,
  marking: BoardSurfaceMarking,
  boardToCanvas: (point: { x: number; y: number }) => { x: number; y: number },
  scale: number,
) {
  applyMarkingStyle(context, marking, scale);

  switch (marking.kind) {
    case "rect": {
      const topLeft = boardToCanvas({ x: marking.x, y: marking.y });
      const width = marking.width * scale;
      const height = marking.height * scale;
      if (marking.fill) {
        context.fillRect(topLeft.x, topLeft.y, width, height);
      }
      if (marking.stroke && marking.strokeWidth) {
        context.strokeRect(topLeft.x, topLeft.y, width, height);
      }
      return;
    }
    case "line": {
      const from = boardToCanvas({ x: marking.x1, y: marking.y1 });
      const to = boardToCanvas({ x: marking.x2, y: marking.y2 });
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
      return;
    }
    case "circle": {
      const center = boardToCanvas({ x: marking.cx, y: marking.cy });
      context.beginPath();
      context.arc(center.x, center.y, marking.r * scale, 0, Math.PI * 2);
      if (marking.fill) {
        context.fill();
      }
      if (marking.stroke && marking.strokeWidth) {
        context.stroke();
      }
      return;
    }
    case "arc": {
      const center = boardToCanvas({ x: marking.cx, y: marking.cy });
      context.beginPath();
      context.arc(
        center.x,
        center.y,
        marking.r * scale,
        toRadians(marking.startAngle),
        toRadians(marking.endAngle),
      );
      context.stroke();
      return;
    }
  }
}

function getObjectRadius(
  input: Pick<CanvasObjectRenderInput, "object" | "surfaceTransform">,
) {
  return input.surfaceTransform.getObjectCanvasRadius(input.object);
}

const defaultObjectRenderer: CanvasObjectRenderer = ({
  context,
  object,
  appearance,
  surfaceTransform,
}) => {
  const { x, y } = surfaceTransform.boardToCanvas(object.position);
  const objectRadius = getObjectRadius({ object, surfaceTransform });
  const tokenFill = context.createLinearGradient(
    x,
    y - objectRadius,
    x,
    y + objectRadius,
  );
  tokenFill.addColorStop(0, TOKEN_TOP);
  tokenFill.addColorStop(1, TOKEN_BOTTOM);

  context.save();
  context.globalAlpha = appearance === "preview" ? 0.55 : 1;
  context.fillStyle = tokenFill;
  context.beginPath();
  context.arc(x, y, objectRadius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = TOKEN_BORDER;
  context.lineWidth = 1;
  context.stroke();

  context.fillStyle = TOKEN_TEXT;
  context.font = TEXT_FONT;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    String(object.props.label ?? object.props.number ?? object.type),
    x,
    y + 1,
  );
  context.restore();
};

function drawRectOverlay({
  context,
  overlay,
  surfaceTransform,
}: CanvasOverlayRenderInput & {
  overlay: CanvasRectOverlayItem;
}) {
  const origin =
    overlay.coordinateSpace === "canvas"
      ? { x: overlay.x, y: overlay.y }
      : surfaceTransform.boardToCanvas({ x: overlay.x, y: overlay.y });
  const width =
    overlay.coordinateSpace === "canvas"
      ? overlay.width
      : overlay.width * surfaceTransform.scale;
  const height =
    overlay.coordinateSpace === "canvas"
      ? overlay.height
      : overlay.height * surfaceTransform.scale;

  context.save();
  context.fillStyle = overlay.fill ?? "transparent";
  context.strokeStyle = overlay.stroke ?? "transparent";
  context.lineWidth = overlay.lineWidth ?? 1;
  context.setLineDash(overlay.lineDash ?? []);

  if (overlay.fill) {
    context.fillRect(origin.x, origin.y, width, height);
  }

  if (overlay.stroke) {
    context.strokeRect(origin.x, origin.y, width, height);
  }

  context.restore();
}

const defaultOverlayRenderers: CanvasOverlayRendererRegistry = {
  rect: (input) => {
    drawRectOverlay(
      input as CanvasOverlayRenderInput & {
        overlay: CanvasRectOverlayItem;
      },
    );
  },
};

export function createCanvasRenderer(): CanvasRenderer {
  return {
    render: ({
      canvas,
      board,
      viewport,
      extendBackground = false,
      surfaceInset = SURFACE_INSET,
      requestRender = () => {},
      previewObjects = [],
      overlayItems = [],
      objectRenderers = {},
      overlayRenderers = {},
    }) => {
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const { width, height, ratio } = syncCanvasSize(canvas);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      if (extendBackground) {
        context.fillStyle = getSurfaceBackground(board);
        context.fillRect(0, 0, width, height);
      }

      const projection = createBoardSpaceProjection({
        surface: board.surface,
        viewport,
        canvasRect: {
          width,
          height,
        },
        surfaceInset,
      });

      drawRoundedRect(
        context,
        projection.frame.x,
        projection.frame.y,
        projection.frame.width,
        projection.frame.height,
        SURFACE_RADIUS,
      );
      context.fillStyle = getSurfaceBackground(board);
      context.fill();

      for (const marking of board.surface.markings ?? []) {
        drawSurfaceMarking(
          context,
          marking,
          projection.boardToCanvas,
          projection.scale,
        );
      }

      for (const objectId of getOrderedBoardObjectIds(board)) {
        const object = board.objects.byId[objectId];
        if (!object) {
          continue;
        }

        const renderer = objectRenderers[object.type] ?? defaultObjectRenderer;
        renderer({
          context,
          object,
          appearance: "default",
          requestRender,
          surfaceTransform: projection,
        });
      }

      for (const previewObject of previewObjects) {
        const renderer =
          objectRenderers[previewObject.type] ?? defaultObjectRenderer;
        renderer({
          context,
          object: previewObject,
          appearance: "preview",
          requestRender,
          surfaceTransform: projection,
        });
      }

      for (const overlayItem of overlayItems) {
        const renderer =
          overlayRenderers[overlayItem.kind] ??
          defaultOverlayRenderers[overlayItem.kind];
        renderer?.({
          context,
          overlay: overlayItem,
          surfaceTransform: projection,
        });
      }

      context.globalAlpha = 1;
    },
  };
}
