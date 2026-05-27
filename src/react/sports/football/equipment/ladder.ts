import type { FootballEquipmentSpec } from "./types";
import { DEFAULT_BOARD_COLOR } from "../../../../core/colors/default-colors";

const LADDER_METRICS = {
  width: 18,
  height: 64,
  railStrokeWidth: 2,
  rungStrokeWidth: 2,
  rungCount: 6,
} as const;

export const ladderEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "ladder",
    label: "Ladder",
    defaultSize: {
      width: LADDER_METRICS.width,
      height: LADDER_METRICS.height,
    },
    color: DEFAULT_BOARD_COLOR.black,
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
