import type { FootballEquipmentSpec } from "./types";

const POLE_COLOR = "#f97316";
const POLE_MARKER_LINE_RATIO = 5 / 2.4;
const POLE_MARKER_STROKE_RATIO = 0.35 / 2.4;
const POLE_MARKER_BASE_WIDTH_FACTOR = 4;
const POLE_SELECTION_BOUNDS = {
  left:
    -(POLE_MARKER_STROKE_RATIO * POLE_MARKER_BASE_WIDTH_FACTOR) / 2 -
    POLE_MARKER_STROKE_RATIO / 2,
  top:
    (28 / 12 / 2 -
      0.12 -
      POLE_MARKER_LINE_RATIO -
      POLE_MARKER_STROKE_RATIO / 2) /
    (28 / 12),
  right:
    (POLE_MARKER_STROKE_RATIO * POLE_MARKER_BASE_WIDTH_FACTOR) / 2 +
    POLE_MARKER_STROKE_RATIO / 2,
  bottom:
    (28 / 12 / 2 -
      0.12 +
      POLE_MARKER_STROKE_RATIO +
      POLE_MARKER_STROKE_RATIO / 2) /
    (28 / 12),
};

export const poleEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "pole",
    label: "Pole",
    defaultSize: {
      width: 12,
      height: 28,
    },
    color: POLE_COLOR,
    capabilities: { color: true },
    transformCapabilities: {
      resize: false,
      rotate: true,
    },
    lockedAspectRatio: true,
    selectionBounds: POLE_SELECTION_BOUNDS,
  },
  renderer: ({ context, color, width, height }) => {
    const coneSize = width;
    const poleHeight = coneSize * POLE_MARKER_LINE_RATIO;
    const poleStrokeWidth = Math.max(1, coneSize * POLE_MARKER_STROKE_RATIO);
    const coneCenterY = height / 2 - coneSize * 0.12;
    const baseWidth = poleStrokeWidth * POLE_MARKER_BASE_WIDTH_FACTOR;
    const baseHeight = poleStrokeWidth;

    context.beginPath();
    context.moveTo(0, coneCenterY);
    context.lineTo(0, coneCenterY - poleHeight);
    context.lineWidth = poleStrokeWidth;
    context.lineCap = "round";
    context.strokeStyle = color;
    context.stroke();

    context.beginPath();
    context.fillStyle = color;
    context.fillRect(-baseWidth / 2, coneCenterY, baseWidth, baseHeight);
  },
};
