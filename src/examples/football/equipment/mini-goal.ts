import { renderFrame } from "./shared";
import type { FootballEquipmentSpec } from "./types";

export const miniGoalEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "mini-goal",
    label: "Mini Goal",
    family: "frame",
    defaultSize: { width: 4, height: 2.4 },
    color: "#e5e7eb",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  renderer: ({ context, width, height }) => {
    renderFrame(context, width, height);
    context.globalAlpha *= 0.5;
    context.beginPath();
    context.moveTo(-width / 2, -height / 2);
    context.lineTo(-width / 4, height / 2);
    context.lineTo(width / 4, height / 2);
    context.lineTo(width / 2, -height / 2);
    context.stroke();
  },
};
