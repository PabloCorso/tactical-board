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

export function getFootballPitchFitPadding(): FitPadding {
  const toolbarPadding = 8;
  const toolbarSize = 48;
  const padding = 16;
  return {
    left: toolbarPadding + toolbarSize + padding,
    right: padding,
    top: padding,
    bottom: padding,
  };
}
