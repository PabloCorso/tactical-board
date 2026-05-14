import type { FootballEquipmentSpec } from "./types";

const HOOP_RADIUS = 1.7;
const HOOP_STROKE_WIDTH = Math.max(0.25, HOOP_RADIUS * 0.25);

export const hoopEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "hoop",
    label: "Hoop",
    family: "frame",
    defaultSize: { width: HOOP_RADIUS * 2, height: HOOP_RADIUS * 2 },
    color: "#ef4444",
    capabilities: { color: true },
    lockedAspectRatio: true,
    selectionBounds: {
      left: -0.563,
      top: -0.563,
      right: 0.563,
      bottom: 0.563,
    },
  },
  renderer: ({ context, color, width, height }) => {
    const radius = Math.min(width, height) / 2;
    const strokeWidth = Math.max(1, radius * (HOOP_STROKE_WIDTH / HOOP_RADIUS));

    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.stroke();
  },
};
