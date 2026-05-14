import type { FootballEquipmentSpec } from "./types";

const GOAL_METRICS = {
  width: 12,
  height: 7.2,
} as const;

const GOAL_SOURCE = {
  width: 400,
  height: 200,
} as const;

const GOAL_NET_BOUNDS = {
  x: 50,
  y: 65,
  width: 300,
  height: 100,
} as const;

const GOAL_BACK_FRAME_PATH = {
  leftX: 50,
  topY: 68,
  bottomY: 168,
  rightX: 350,
} as const;

const GOAL_FRONT_FRAME_PATH = {
  leftX: 50,
  topY: 50,
  bottomY: 150,
  rightX: 350,
} as const;

function renderGoalNet(context: CanvasRenderingContext2D) {
  context.save();
  context.beginPath();
  context.rect(
    GOAL_NET_BOUNDS.x,
    GOAL_NET_BOUNDS.y,
    GOAL_NET_BOUNDS.width,
    GOAL_NET_BOUNDS.height,
  );
  context.clip();

  const step = 10;
  for (
    let x = GOAL_NET_BOUNDS.x;
    x <= GOAL_NET_BOUNDS.x + GOAL_NET_BOUNDS.width;
    x += step
  ) {
    context.beginPath();
    context.moveTo(x, GOAL_NET_BOUNDS.y);
    context.lineTo(x, GOAL_NET_BOUNDS.y + GOAL_NET_BOUNDS.height);
    context.stroke();
  }

  for (
    let y = GOAL_NET_BOUNDS.y;
    y <= GOAL_NET_BOUNDS.y + GOAL_NET_BOUNDS.height;
    y += step
  ) {
    context.beginPath();
    context.moveTo(GOAL_NET_BOUNDS.x, y);
    context.lineTo(GOAL_NET_BOUNDS.x + GOAL_NET_BOUNDS.width, y);
    context.stroke();
  }

  context.restore();
}

function strokeGoalFrame(
  context: CanvasRenderingContext2D,
  frame: {
    leftX: number;
    topY: number;
    bottomY: number;
    rightX: number;
  },
) {
  context.beginPath();
  context.moveTo(frame.leftX, frame.topY);
  context.lineTo(frame.leftX, frame.bottomY);
  context.lineTo(frame.rightX, frame.bottomY);
  context.lineTo(frame.rightX, frame.topY);
  context.stroke();
}

export const goalEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "goal",
    label: "Goal",
    family: "frame",
    defaultSize: { width: GOAL_METRICS.width, height: GOAL_METRICS.height },
    color: "#ffffff",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  renderer: ({ context, color, width, height }) => {
    const scaleX = width / GOAL_SOURCE.width;
    const scaleY = height / GOAL_SOURCE.height;
    const netColor = color === "#ffffff" ? "#e0e0e0" : color;

    context.save();
    context.scale(scaleX, scaleY);
    context.translate(-GOAL_SOURCE.width / 2, -GOAL_SOURCE.height / 2);
    context.scale(-1, -1);
    context.translate(-GOAL_SOURCE.width, -GOAL_SOURCE.height);

    context.strokeStyle = color;
    context.lineWidth = 6;
    context.lineCap = "butt";
    context.lineJoin = "miter";
    context.globalAlpha *= 0.72;
    strokeGoalFrame(context, GOAL_BACK_FRAME_PATH);

    context.globalAlpha /= 0.72;
    context.strokeStyle = netColor;
    context.lineWidth = 1;
    renderGoalNet(context);

    context.strokeStyle = color;
    context.lineWidth = 6;
    strokeGoalFrame(context, GOAL_FRONT_FRAME_PATH);
    context.restore();
  },
};
