import type { FootballEquipmentSpec } from "./types";
import { DEFAULT_BOARD_COLOR } from "../../../../core/colors/default-colors";

const HOOP_RADIUS = 8.5;
const HOOP_STROKE_WIDTH = Math.max(0.25, HOOP_RADIUS * 0.25);

export const hoopEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "hoop",
    label: "Hoop",
    defaultSize: { width: HOOP_RADIUS * 2, height: HOOP_RADIUS * 2 },
    color: DEFAULT_BOARD_COLOR.red,
    minimumHitRadiusPx: 0,
    hitTestShape: "circle",
  },
  renderer: ({ context, color, width, height }) => {
    const strokeWidth = Math.min(
      Math.min(width, height),
      Math.max(
        1,
        (Math.min(width, height) / 2) * (HOOP_STROKE_WIDTH / HOOP_RADIUS),
      ),
    );
    const radiusX = Math.max(0, (width - strokeWidth) / 2);
    const radiusY = Math.max(0, (height - strokeWidth) / 2);

    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    context.beginPath();
    context.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    context.stroke();
  },
};
