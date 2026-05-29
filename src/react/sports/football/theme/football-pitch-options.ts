import type { BoardFrameConfig } from "../../../../core/board/types";
import type { FitPadding } from "../../../../core/editor/viewport-utils";
import type { FootballPitchVariant } from "../board/football-board";

export const FOOTBALL_PITCH_TOOL_ID = "pitch";

export const FOOTBALL_PITCH_OPTIONS: Array<{
  label: string;
  value: FootballPitchVariant;
}> = [
  { label: "Full pitch", value: "full-pitch" },
  { label: "Half pitch", value: "half-pitch" },
  { label: "Reduced space", value: "reduced-space" },
];

export function getFootballPitchVariant(value: unknown): FootballPitchVariant {
  if (
    value === "full-pitch" ||
    value === "half-pitch" ||
    value === "reduced-space"
  ) {
    return value;
  }

  return "full-pitch";
}

export function getFootballPitchFitPadding(
  frame: BoardFrameConfig,
): FitPadding {
  const variant = getFootballPitchVariant(frame.markup?.variant);

  if (variant === "full-pitch") {
    return { left: 4 + 40 + 16, right: 0, top: 16, bottom: 16 };
  }

  if (variant === "half-pitch") {
    return { x: 0, y: 8 };
  }

  return { x: 16, y: 16 };
}
