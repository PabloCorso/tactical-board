import type { FootballEquipmentSpec } from "./types";

const POLE_COLOR = "#f97316";
const POLE_MARKER_STROKE_RATIO = 0.35 / 2.4;

export const poleEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "pole",
    label: "Pole",
    defaultSize: {
      width: 12,
      height: 28,
    },
    color: POLE_COLOR,
  },
  renderer: ({ context, color, width, height }) => {
    const poleStrokeWidth = Math.min(
      Math.min(width, height),
      Math.max(1, width * POLE_MARKER_STROKE_RATIO),
    );
    const baseTop = height / 2 - poleStrokeWidth;
    const poleTop = -height / 2 + poleStrokeWidth / 2;

    context.beginPath();
    context.moveTo(0, baseTop);
    context.lineTo(0, poleTop);
    context.lineWidth = poleStrokeWidth;
    context.lineCap = "round";
    context.strokeStyle = color;
    context.stroke();

    context.fillStyle = color;
    context.fillRect(-width / 2, baseTop, width, poleStrokeWidth);
  },
};
