import type { CanvasRenderer } from "./types";

const SURFACE_INSET = 14;
const CORNER_RADIUS = 20;
const SURFACE_RADIUS = 10;
const OBJECT_RADIUS = 21;
const CENTER_CIRCLE_RADIUS = 44;
const STROKE_COLOR = "rgba(248,247,240,0.76)";
const BACKGROUND_TOP = "#1f744d";
const BACKGROUND_BOTTOM = "#16543a";
const TOKEN_TOP = "#f8f1d3";
const TOKEN_BOTTOM = "#d6bb67";
const TOKEN_TEXT = "#09231d";
const TOKEN_FALLBACK = "rgba(255,255,255,0.1)";
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

      const background = context.createLinearGradient(0, 0, 0, height);
      background.addColorStop(0, BACKGROUND_TOP);
      background.addColorStop(1, BACKGROUND_BOTTOM);

      drawRoundedRect(context, 0, 0, width, height, CORNER_RADIUS);
      context.fillStyle = background;
      context.fill();

      context.save();
      context.translate(viewport.pan.x, viewport.pan.y);

      drawRoundedRect(
        context,
        SURFACE_INSET,
        SURFACE_INSET,
        width - SURFACE_INSET * 2,
        height - SURFACE_INSET * 2,
        SURFACE_RADIUS,
      );
      context.lineWidth = 2;
      context.strokeStyle = STROKE_COLOR;
      context.stroke();

      context.beginPath();
      context.moveTo(width / 2, SURFACE_INSET);
      context.lineTo(width / 2, height - SURFACE_INSET);
      context.stroke();

      context.beginPath();
      context.arc(width / 2, height / 2, CENTER_CIRCLE_RADIUS, 0, Math.PI * 2);
      context.stroke();

      context.font = TEXT_FONT;
      context.textAlign = "center";
      context.textBaseline = "middle";

      for (const objectId of board.objects.order) {
        const object = board.objects.byId[objectId];
        if (!object) {
          continue;
        }

        const x = (object.position.x / 100) * width;
        const y = (object.position.y / 100) * height;
        const selected = selectedObjectIds.includes(object.id);
        const tokenFill =
          object.type === "player-token"
            ? context.createLinearGradient(
                x,
                y - OBJECT_RADIUS,
                x,
                y + OBJECT_RADIUS,
              )
            : null;

        if (tokenFill) {
          tokenFill.addColorStop(0, TOKEN_TOP);
          tokenFill.addColorStop(1, TOKEN_BOTTOM);
          context.fillStyle = tokenFill;
        } else {
          context.fillStyle = TOKEN_FALLBACK;
        }

        context.beginPath();
        context.arc(x, y, OBJECT_RADIUS, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = TOKEN_BORDER;
        context.lineWidth = 1;
        context.stroke();

        if (selected) {
          context.beginPath();
          context.arc(x, y, OBJECT_RADIUS + 4, 0, Math.PI * 2);
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

      context.restore();
    },
  };
}
