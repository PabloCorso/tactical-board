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
