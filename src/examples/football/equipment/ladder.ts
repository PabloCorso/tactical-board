import type { FootballEquipmentSpec } from "./types";
import { DEFAULT_PRESET_COLOR } from "../../../core/colors/preset-colors";

const LADDER_METRICS = {
  width: 3.8,
  height: 14,
  railStrokeWidth: 0.4,
  rungStrokeWidth: 0.4,
  rungCount: 6,
} as const;
const LADDER_DEFAULT_SCALE = 0.9;

export const ladderEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "ladder",
    label: "Ladder",
    defaultSize: {
      width: LADDER_METRICS.width * LADDER_DEFAULT_SCALE,
      height: LADDER_METRICS.height * LADDER_DEFAULT_SCALE,
    },
    color: DEFAULT_PRESET_COLOR.black,
    capabilities: { color: true },
    transformCapabilities: {
      resize: false,
      rotate: true,
    },
    lockedAspectRatio: true,
    selectionBounds: {
      left: -0.553,
      top: -0.515,
      right: 0.553,
      bottom: 0.515,
    },
  },
  renderer: ({ context, color, width, height }) => {
    const leftX = -width / 2;
    const rightX = width / 2;
    const topY = -height / 2;
    const bottomY = height / 2;
    const rungStep = height / (LADDER_METRICS.rungCount + 1);
    const strokeWidth = Math.max(
      1,
      width * (LADDER_METRICS.railStrokeWidth / LADDER_METRICS.width),
    );

    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    context.lineCap = "round";

    context.beginPath();
    context.moveTo(leftX, topY);
    context.lineTo(leftX, bottomY);
    context.moveTo(rightX, topY);
    context.lineTo(rightX, bottomY);
    context.stroke();

    for (let index = 0; index < LADDER_METRICS.rungCount; index += 1) {
      const y = topY + rungStep * (index + 1);
      context.beginPath();
      context.moveTo(leftX, y);
      context.lineTo(rightX, y);
      context.stroke();
    }
  },
};
