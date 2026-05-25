import type { FootballEquipmentSpec } from "./types";
import { DEFAULT_BOARD_COLOR } from "../../../../core/colors/default-colors";

const HURDLE_METRICS = {
  width: 6,
  height: 3.4,
  legInset: 0.9,
  legBackOffset: 1.35,
  shoulderRatio: 0.36,
  strokeWidth: 0.4,
} as const;
const HURDLE_DEFAULT_SCALE = 0.6;

function renderHurdlePath(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const leftX = -width / 2;
  const rightX = width / 2;
  const bottomY = height / 2;
  const topY = -height / 2;
  const topBarY = topY + height * HURDLE_METRICS.shoulderRatio;
  const leftLegX =
    leftX + width * (HURDLE_METRICS.legInset / HURDLE_METRICS.width);
  const rightLegX =
    rightX - width * (HURDLE_METRICS.legInset / HURDLE_METRICS.width);
  const footBackOffset =
    width * ((HURDLE_METRICS.legBackOffset * 0.45) / HURDLE_METRICS.width);
  const leftFootX = leftLegX - footBackOffset;
  const rightFootX = rightLegX - footBackOffset;
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
      width: HURDLE_METRICS.width * HURDLE_DEFAULT_SCALE,
      height: HURDLE_METRICS.height * HURDLE_DEFAULT_SCALE,
    },
    color: DEFAULT_BOARD_COLOR.orange,
    capabilities: { color: true },
    transformCapabilities: {
      resize: false,
      rotate: true,
    },
    lockedAspectRatio: true,
    selectionBounds: {
      left: -0.485,
      top: -0.175,
      right: 0.385,
      bottom: 0.535,
    },
  },
  renderer: ({ context, color, width, height }) => {
    const strokeWidth = Math.max(
      1,
      width * (HURDLE_METRICS.strokeWidth / HURDLE_METRICS.width),
    );

    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
    renderHurdlePath(context, width, height);
    context.stroke();
  },
};
