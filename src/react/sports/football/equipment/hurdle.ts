import type { FootballEquipmentSpec } from "./types";
import { DEFAULT_BOARD_COLOR } from "../../../../core/colors/default-colors";

const HURDLE_METRICS = {
  width: 20,
  height: 11,
  footBackRatio: (4.5 * 0.45) / 20,
  strokeWidth: 1.4,
} as const;

function renderHurdlePath(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokeWidth: number,
) {
  const strokeInset = strokeWidth / 2;
  const leftEdge = -width / 2 + strokeInset;
  const rightEdge = width / 2 - strokeInset;
  const bottomY = height / 2 - strokeInset;
  const topBarY = -height / 2 + strokeInset;
  const footBackOffset = width * HURDLE_METRICS.footBackRatio;
  const leftLegX = leftEdge + footBackOffset;
  const rightLegX = rightEdge;
  const leftFootX = leftEdge;
  const rightFootX = rightEdge - footBackOffset;
  const legKneeY = bottomY - height * 0.22;
  const topCornerRadius = Math.min(width * 0.08, (rightLegX - leftLegX) / 4);

  context.beginPath();
  context.moveTo(leftLegX, topBarY + topCornerRadius);
  context.lineTo(leftLegX, legKneeY);
  context.quadraticCurveTo(leftLegX, bottomY, leftFootX, bottomY);

  context.moveTo(leftLegX, topBarY + topCornerRadius);
  context.quadraticCurveTo(
    leftLegX,
    topBarY,
    leftLegX + topCornerRadius,
    topBarY,
  );
  context.lineTo(rightLegX - topCornerRadius, topBarY);
  context.quadraticCurveTo(
    rightLegX,
    topBarY,
    rightLegX,
    topBarY + topCornerRadius,
  );

  context.moveTo(rightLegX, topBarY + topCornerRadius);
  context.lineTo(rightLegX, legKneeY);
  context.quadraticCurveTo(rightLegX, bottomY, rightFootX, bottomY);
}

export const hurdleEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "hurdle",
    label: "Hurdle",
    defaultSize: {
      width: HURDLE_METRICS.width,
      height: HURDLE_METRICS.height,
    },
    color: DEFAULT_BOARD_COLOR.orange,
  },
  renderer: ({ context, color, width, height }) => {
    const strokeWidth = Math.min(
      Math.min(width, height),
      Math.max(1, width * (HURDLE_METRICS.strokeWidth / HURDLE_METRICS.width)),
    );

    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
    renderHurdlePath(context, width, height, strokeWidth);
    context.stroke();
  },
};
