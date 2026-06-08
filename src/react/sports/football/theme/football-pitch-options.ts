import type {
  BoardFrameConfig,
  BoardFrameOrientation,
} from "../../../../core/board/types";
import {
  createFootballPitch,
  type FootballPitchVariant,
} from "../board/football-board";

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

export function getFootballPitchOrientation(
  value: unknown,
): BoardFrameOrientation {
  if (value === 0 || value === 90 || value === 180 || value === 270) {
    return value;
  }

  return 0;
}

export function getNextFootballPitchOrientation(
  variant: FootballPitchVariant,
  orientation: unknown,
): BoardFrameOrientation | undefined {
  const currentOrientation = getFootballPitchOrientation(orientation);

  if (variant === "reduced-space") {
    return undefined;
  }

  if (variant === "full-pitch") {
    return currentOrientation === 90 || currentOrientation === 270 ? 0 : 90;
  }

  const orientations: BoardFrameOrientation[] = [0, 90, 180, 270];
  const currentIndex = orientations.indexOf(currentOrientation);

  return orientations[(currentIndex + 1) % orientations.length];
}

export function getFootballPitchOrientationLabel({
  orientation,
  variant,
}: {
  orientation: BoardFrameOrientation;
  variant: FootballPitchVariant;
}): string {
  if (variant === "full-pitch") {
    return orientation === 90 || orientation === 270 ? "portrait" : "landscape";
  }

  if (variant === "half-pitch") {
    switch (orientation) {
      case 90:
        return "goal right";
      case 180:
        return "goal bottom";
      case 270:
        return "goal left";
      case 0:
        return "goal top";
    }
  }

  return "default";
}

export function createNextFootballPitchFrame(
  frame: BoardFrameConfig,
): BoardFrameConfig | undefined {
  const variant = getFootballPitchVariant(frame.markup?.variant);
  const orientation = getNextFootballPitchOrientation(
    variant,
    frame.orientation,
  );

  if (orientation === undefined) {
    return undefined;
  }

  return createFootballPitch({ orientation, variant });
}
