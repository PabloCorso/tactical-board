import { renderConeMarkerCanvas } from "./cone";
import type { FootballEquipmentSpec } from "./types";

const POLE_COLOR = "#f97316";
const POLE_MARKER_LINE_RATIO = 8 / 2.4;
const POLE_MARKER_STROKE_RATIO = 0.35 / 2.4;
const POLE_DEFAULT_SCALE = 0.75;

export const poleEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "pole",
    label: "Pole",
    family: "pole",
    defaultSize: { width: 2.4 * POLE_DEFAULT_SCALE, height: 11 * POLE_DEFAULT_SCALE },
    color: POLE_COLOR,
    capabilities: { color: true },
    transformCapabilities: {
      resize: false,
      rotate: true,
    },
    lockedAspectRatio: true,
    selectionBounds: {
      left: -0.44,
      top: -0.45,
      right: 0.44,
      bottom: 0.58,
    },
  },
  renderer: ({ context, color, width, height }) => {
    const coneSize = width;
    const poleHeight = coneSize * POLE_MARKER_LINE_RATIO;
    const poleStrokeWidth = Math.max(1, coneSize * POLE_MARKER_STROKE_RATIO);
    const coneCenterY = height / 2 - coneSize * 0.12;

    context.beginPath();
    context.moveTo(0, coneCenterY);
    context.lineTo(0, coneCenterY - poleHeight);
    context.lineWidth = poleStrokeWidth;
    context.lineCap = "round";
    context.strokeStyle = color;
    context.stroke();

    renderConeMarkerCanvas(context, color, coneSize, 0, coneCenterY);
  },
};
