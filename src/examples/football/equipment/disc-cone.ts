import type { FootballEquipmentSpec } from "./types";

const DISC_CONE_OUTER_RADIUS = 1.2;
const DISC_CONE_INNER_RADIUS = DISC_CONE_OUTER_RADIUS * 0.35;
const DISC_CONE_OUTER_RING_RADIUS =
  DISC_CONE_INNER_RADIUS +
  (DISC_CONE_OUTER_RADIUS - DISC_CONE_INNER_RADIUS) * 0.65;
const DISC_CONE_INNER_RING_RADIUS =
  DISC_CONE_INNER_RADIUS +
  (DISC_CONE_OUTER_RADIUS - DISC_CONE_INNER_RADIUS) * 0.35;
const DISC_CONE_OUTER_RING_STROKE_WIDTH = DISC_CONE_OUTER_RADIUS * 0.12;
const DISC_CONE_INNER_RING_STROKE_WIDTH = DISC_CONE_OUTER_RADIUS * 0.1;

let discConeRingPathCache: Path2D | null | undefined;

function getDiscConeRingPath() {
  if (discConeRingPathCache !== undefined) {
    return discConeRingPathCache;
  }

  if (typeof Path2D === "undefined") {
    discConeRingPathCache = null;
    return discConeRingPathCache;
  }

  discConeRingPathCache = new Path2D(
    "M 0.8 2 a 1.2 1.2 0 1 0 2.4 0 a 1.2 1.2 0 1 0 -2.4 0 M 1.58 2 a 0.42 0.42 0 1 0 0.84 0 a 0.42 0.42 0 1 0 -0.84 0",
  );

  return discConeRingPathCache;
}

function fillDiscConeRing(
  context: CanvasRenderingContext2D,
  color: string,
  ringPath: Path2D | null,
) {
  context.fillStyle = color;
  context.globalAlpha *= 0.9;

  if (ringPath) {
    context.fill(ringPath, "evenodd");
    return;
  }

  context.beginPath();
  context.arc(2, 2, DISC_CONE_OUTER_RADIUS, 0, Math.PI * 2);
  context.moveTo(2 + DISC_CONE_INNER_RADIUS, 2);
  context.arc(2, 2, DISC_CONE_INNER_RADIUS, 0, Math.PI * 2, true);
  context.fill("evenodd");
}

export const discConeEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "disc-cone",
    label: "Disc Cone",
    family: "cone",
    defaultSize: { width: 2.2, height: 2.2 },
    color: "#ffc857",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  renderer: ({ context, color, width, height }) => {
    const ringPath = getDiscConeRingPath();
    const scale = Math.min(width, height) / 4;

    context.save();
    context.scale(scale, scale);
    context.translate(-2, -2);

    fillDiscConeRing(context, color, ringPath);

    context.globalAlpha /= 0.9;
    context.strokeStyle = "rgba(0,0,0,0.1)";
    context.lineWidth = DISC_CONE_OUTER_RING_STROKE_WIDTH;
    context.beginPath();
    context.arc(2, 2, DISC_CONE_OUTER_RING_RADIUS, 0, Math.PI * 2);
    context.stroke();

    context.lineWidth = DISC_CONE_INNER_RING_STROKE_WIDTH;
    context.beginPath();
    context.arc(2, 2, DISC_CONE_INNER_RING_RADIUS, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  },
};
