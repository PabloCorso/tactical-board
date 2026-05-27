import type { BoardFrameMarking } from "../../board/types";
import { createBoardSpaceProjection } from "../../geometry/board-space-projection";
import { getOrderedBoardObjectIds } from "../../board/object-order";
import type {
  CanvasOverlayRenderInput,
  CanvasOverlayRendererRegistry,
  CanvasRectOverlayItem,
  CanvasRenderer,
} from "./types";

const DEFAULT_VIEWPORT_INSETS = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
const FRAME_RADIUS = 10;
const DEFAULT_FRAME_BACKGROUND = "rgba(255,255,255,0.03)";

function getFrameBackground(board: {
  frame: { background?: string; fill?: string };
}) {
  return board.frame.background ?? board.frame.fill ?? DEFAULT_FRAME_BACKGROUND;
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
  marking: BoardFrameMarking,
  scale: number,
) {
  context.globalAlpha = marking.opacity ?? 1;
  context.fillStyle = marking.fill ?? "transparent";
  context.strokeStyle = marking.stroke ?? "transparent";
  context.lineWidth = (marking.strokeWidth ?? 0) * scale;
}

function drawFrameMarking(
  context: CanvasRenderingContext2D,
  marking: BoardFrameMarking,
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

function drawRectOverlay({
  context,
  overlay,
  frameTransform,
}: CanvasOverlayRenderInput & {
  overlay: CanvasRectOverlayItem;
}) {
  const origin =
    overlay.coordinateSpace === "canvas"
      ? { x: overlay.x, y: overlay.y }
      : frameTransform.boardToCanvas({ x: overlay.x, y: overlay.y });
  const width =
    overlay.coordinateSpace === "canvas"
      ? overlay.width
      : overlay.width * frameTransform.scale;
  const height =
    overlay.coordinateSpace === "canvas"
      ? overlay.height
      : overlay.height * frameTransform.scale;

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
      fitPadding,
      viewportInsets = fitPadding === undefined
        ? DEFAULT_VIEWPORT_INSETS
        : {
            top: fitPadding,
            right: fitPadding,
            bottom: fitPadding,
            left: fitPadding,
          },
      requestRender = () => {},
      previewObjects = [],
      overlayItems = [],
      objectRenderers = {},
      overlayRenderers = {},
      assetResolver,
    }) => {
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const { width, height, ratio } = syncCanvasSize(canvas);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      if (extendBackground) {
        context.fillStyle = getFrameBackground(board);
        context.fillRect(0, 0, width, height);
      }

      const projection = createBoardSpaceProjection({
        frame: board.frame,
        viewport,
        canvasRect: {
          width,
          height,
        },
        viewportInsets,
      });

      drawRoundedRect(
        context,
        projection.frame.x,
        projection.frame.y,
        projection.frame.width,
        projection.frame.height,
        FRAME_RADIUS,
      );
      context.fillStyle = getFrameBackground(board);
      context.fill();

      for (const marking of board.frame.markings ?? []) {
        drawFrameMarking(
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

        const renderer = objectRenderers[object.type];
        renderer?.({
          context,
          object,
          appearance: "default",
          requestRender,
          frameTransform: projection,
          assetResolver,
        });
      }

      for (const previewObject of previewObjects) {
        const renderer = objectRenderers[previewObject.type];
        renderer?.({
          context,
          object: previewObject,
          appearance: "preview",
          requestRender,
          frameTransform: projection,
          assetResolver,
        });
      }

      for (const overlayItem of overlayItems) {
        const renderer =
          overlayRenderers[overlayItem.kind] ??
          defaultOverlayRenderers[overlayItem.kind];
        renderer?.({
          context,
          overlay: overlayItem,
          frameTransform: projection,
        });
      }

      context.globalAlpha = 1;
    },
  };
}
