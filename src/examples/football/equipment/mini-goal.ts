import miniGoalSvgMarkup from "../../../assets/mini-goal.svg?raw";
import { renderFrame } from "./shared";
import type { FootballEquipmentSpec } from "./types";
import { DEFAULT_PRESET_COLOR } from "../../../core/colors/preset-colors";

const MINI_GOAL_METRICS = {
  width: 4,
  height: (4 * 170) / 328,
} as const;

type MiniGoalImageStatus = "loading" | "loaded" | "error";

type MiniGoalImageCacheEntry = {
  image: HTMLImageElement;
  listeners: Set<() => void>;
  status: MiniGoalImageStatus;
};

const miniGoalImageCache = new Map<string, MiniGoalImageCacheEntry>();

function renderFallbackMiniGoal(
  context: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number,
) {
  context.strokeStyle = color;
  renderFrame(context, width, height);
  context.globalAlpha *= 0.5;
  context.beginPath();
  context.moveTo(-width / 2, -height / 2);
  context.lineTo(-width / 4, height / 2);
  context.lineTo(width / 4, height / 2);
  context.lineTo(width / 2, -height / 2);
  context.stroke();
}

function notifyListeners(entry: MiniGoalImageCacheEntry) {
  for (const listener of entry.listeners) {
    listener();
  }

  entry.listeners.clear();
}

function getMiniGoalSvgMarkup(color: string) {
  return miniGoalSvgMarkup.replaceAll('fill="#000000"', `fill="${color}"`);
}

function getMiniGoalImage(color: string, requestRender: () => void) {
  if (typeof Image === "undefined") {
    return null;
  }

  const existingEntry = miniGoalImageCache.get(color);

  if (existingEntry) {
    if (existingEntry.status !== "loaded") {
      existingEntry.listeners.add(requestRender);
    }

    return existingEntry;
  }

  const image = new Image();
  const entry: MiniGoalImageCacheEntry = {
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
    getMiniGoalSvgMarkup(color),
  )}`;
  miniGoalImageCache.set(color, entry);

  return entry;
}

export const miniGoalEquipment: FootballEquipmentSpec = {
  definition: {
    kind: "mini-goal",
    label: "Mini Goal",
    defaultSize: {
      width: MINI_GOAL_METRICS.width,
      height: MINI_GOAL_METRICS.height,
    },
    color: DEFAULT_PRESET_COLOR.lightGray,
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
    const entry = getMiniGoalImage(color, requestRender);

    if (entry?.status === "loaded") {
      context.drawImage(entry.image, -width / 2, -height / 2, width, height);
      return;
    }

    renderFallbackMiniGoal(context, color, width, height);
  },
};
