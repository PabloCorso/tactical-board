import { darkenHexColor } from "./shared";
import type { FootballEquipmentSpec } from "./types";
import { DEFAULT_BOARD_COLOR } from "../../../../core/colors/default-colors";
import { renderEquipmentSourceFrame } from "../../../../core/tools/equipment-tool";

let coneBodyPathCache: Path2D | null | undefined;
let coneBasePathCache: Path2D | null | undefined;
let coneTopBandPathCache: Path2D | null | undefined;
let coneMidBandPathCache: Path2D | null | undefined;

const CONE_SOURCE_FRAME = {
  x: 0.89,
  y: 0.99,
  width: 22.22,
  height: 22.11,
} as const;

function getConePaths() {
  if (coneBodyPathCache !== undefined) {
    return {
      bodyPath: coneBodyPathCache,
      basePath: coneBasePathCache,
      topBandPath: coneTopBandPathCache,
      midBandPath: coneMidBandPathCache,
    };
  }

  if (typeof Path2D === "undefined") {
    coneBodyPathCache = null;
    coneBasePathCache = null;
    coneTopBandPathCache = null;
    coneMidBandPathCache = null;

    return {
      bodyPath: coneBodyPathCache,
      basePath: coneBasePathCache,
      topBandPath: coneTopBandPathCache,
      midBandPath: coneMidBandPathCache,
    };
  }

  coneBodyPathCache = new Path2D(
    "M16.949 14.14a5 2.5 0 1 1-9.9 0L10.063 3.5a2 2 0 0 1 3.874 0z",
  );
  coneBasePathCache = new Path2D(
    "m16.923 14.049 4.48 2.04a1 1 0 0 1 .001 1.831l-8.574 3.9a2 2 0 0 1-1.66 0l-8.574-3.91a1 1 0 0 1 0-1.83l4.484-2.04",
  );
  coneTopBandPathCache = new Path2D("M9.194 6.57a5 2.5 0 0 0 5.61 0");
  coneMidBandPathCache = new Path2D("M16.05 10.966a5 2.5 0 0 1-8.1 0");

  return {
    bodyPath: coneBodyPathCache,
    basePath: coneBasePathCache,
    topBandPath: coneTopBandPathCache,
    midBandPath: coneMidBandPathCache,
  };
}

export function renderConeMarkerCanvas(
  context: CanvasRenderingContext2D,
  color: string,
  width: number,
  height = width,
  centerX = 0,
  centerY = 0,
) {
  const { bodyPath, basePath, topBandPath, midBandPath } = getConePaths();

  if (!bodyPath || !basePath || !topBandPath || !midBandPath) {
    context.beginPath();
    context.moveTo(centerX, centerY - height / 2);
    context.lineTo(centerX + width / 2, centerY + height / 2);
    context.lineTo(centerX - width / 2, centerY + height / 2);
    context.closePath();
    context.fill();
    context.globalAlpha *= 0.28;
    context.fillStyle = "#ffffff";
    context.fillRect(
      centerX - width * 0.18,
      centerY - height * 0.05,
      width * 0.36,
      height * 0.16,
    );
    return;
  }

  const outline = darkenHexColor(color) ?? "#c2410c";

  context.save();
  context.translate(centerX, centerY);
  renderEquipmentSourceFrame(context, width, height, CONE_SOURCE_FRAME, () => {
    context.fillStyle = color;
    context.strokeStyle = outline;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.lineWidth = 2;
    context.fill(bodyPath);
    context.stroke(bodyPath);

    context.lineWidth = 2.2;
    context.fill(basePath);
    context.stroke(basePath);

    context.lineWidth = 2;
    context.stroke(topBandPath);

    context.lineWidth = 2.2;
    context.stroke(midBandPath);
  });
  context.restore();
}

export const coneEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "cone",
    label: "Cone",
    defaultSize: {
      width: 14,
      height: (14 * CONE_SOURCE_FRAME.height) / CONE_SOURCE_FRAME.width,
    },
    color: DEFAULT_BOARD_COLOR.red,
    minimumHitRadiusPx: 0,
  },
  renderer: ({ context, color, width, height }) => {
    renderConeMarkerCanvas(context, color, width, height);
  },
};
