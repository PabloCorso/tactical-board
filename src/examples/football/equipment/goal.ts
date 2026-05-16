import goalSvgMarkup from "../../../assets/goal.svg?raw";
import type { FootballEquipmentSpec } from "./types";
import { DEFAULT_PRESET_COLOR } from "../../../core/colors/preset-colors";

const GOAL_METRICS = {
  width: 7.32,
  height: (7.32 * 422) / 895,
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

type GoalImageStatus = "loading" | "loaded" | "error";

type GoalImageCacheEntry = {
  image: HTMLImageElement;
  listeners: Set<() => void>;
  status: GoalImageStatus;
};

const goalImageCache = new Map<string, GoalImageCacheEntry>();

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

function renderFallbackGoal(
  context: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number,
) {
  const scaleX = width / GOAL_SOURCE.width;
  const scaleY = height / GOAL_SOURCE.height;
  const netColor = color === "#ffffff" ? "#e0e0e0" : color;

  context.save();
  context.scale(scaleX, scaleY);
  context.translate(-GOAL_SOURCE.width / 2, -GOAL_SOURCE.height / 2);

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
}

function notifyListeners(entry: GoalImageCacheEntry) {
  for (const listener of entry.listeners) {
    listener();
  }

  entry.listeners.clear();
}

function getGoalSvgMarkup(color: string) {
  return goalSvgMarkup.replaceAll('stroke="#000000"', `stroke="${color}"`);
}

function getGoalImage(color: string, requestRender: () => void) {
  if (typeof Image === "undefined") {
    return null;
  }

  const existingEntry = goalImageCache.get(color);

  if (existingEntry) {
    if (existingEntry.status !== "loaded") {
      existingEntry.listeners.add(requestRender);
    }

    return existingEntry;
  }

  const image = new Image();
  const entry: GoalImageCacheEntry = {
    image,
    listeners: new Set([requestRender]),
    status: "loading",
  };

  image.onload = () => {
    entry.status = "loaded";
    notifyListeners(entry);
  };

  image.onerror = () => {
    entry.status = "error";
    notifyListeners(entry);
  };

  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    getGoalSvgMarkup(color),
  )}`;
  goalImageCache.set(color, entry);

  return entry;
}

export const goalEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "goal",
    label: "Goal",
    family: "frame",
    defaultSize: { width: GOAL_METRICS.width, height: GOAL_METRICS.height },
    color: DEFAULT_PRESET_COLOR.white,
    capabilities: { color: true },
    transformCapabilities: {
      resize: true,
      rotate: true,
    },
    lockedAspectRatio: true,
    selectionBounds: {
      left: -0.5,
      top: -0.5,
      right: 0.5,
      bottom: 0.5,
    },
  },
  renderer: ({ context, color, width, height, requestRender }) => {
    const entry = getGoalImage(color, requestRender);

    if (entry?.status === "loaded") {
      context.drawImage(entry.image, -width / 2, -height / 2, width, height);
      return;
    }

    renderFallbackGoal(context, color, width, height);
  },
};
