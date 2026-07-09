import type {
  FormationLayout,
  FormationPlacement,
} from "../../../../core/board/player-formation";
import { getDefaultFormationAxis } from "../../../../core/board/player-formation";
import type { BoardFrameDefault } from "../../../../core/board/types";
import {
  getFootballPitchOrientation,
  getFootballPitchVariant,
} from "./football-pitch-options";

export type FootballFormationDefinition = {
  id: string;
  label: string;
  layout: FormationLayout;
};

export const FOOTBALL_FORMATIONS: FootballFormationDefinition[] = [
  { id: "4-2-3-1", label: "4-2-3-1", layout: { rows: [4, 2, 3, 1] } },
  { id: "4-3-3", label: "4-3-3", layout: { rows: [4, 3, 3] } },
  { id: "4-4-2", label: "4-4-2", layout: { rows: [4, 4, 2] } },
  { id: "4-1-3-2", label: "4-1-3-2", layout: { rows: [4, 1, 3, 2] } },
  { id: "4-3-2-1", label: "4-3-2-1", layout: { rows: [4, 3, 2, 1] } },
  { id: "3-5-2", label: "3-5-2", layout: { rows: [3, 5, 2] } },
  { id: "3-4-3", label: "3-4-3", layout: { rows: [3, 4, 3] } },
  { id: "3-3-3-1", label: "3-3-3-1", layout: { rows: [3, 3, 3, 1] } },
  { id: "3-4-1-2", label: "3-4-1-2", layout: { rows: [3, 4, 1, 2] } },
];

export type FootballFormationPlacementOption = {
  id: string;
  label: string;
  placement: FormationPlacement;
};

function getHalfPitchGoalPlacement(
  frame: Pick<BoardFrameDefault, "orientation">,
): FormationPlacement {
  // The half-pitch goal sits at the right at 0°; each rotation step moves it
  // to top (90°), left (180°), and bottom (270°).
  switch (getFootballPitchOrientation(frame.orientation)) {
    case 90:
      return { axis: "y", side: "start", span: "full" };
    case 180:
      return { axis: "x", side: "start", span: "full" };
    case 270:
      return { axis: "y", side: "end", span: "full" };
    default:
      return { axis: "x", side: "end", span: "full" };
  }
}

/**
 * Placement choices for the current frame. Labels follow the frame's real
 * orientation, and pitches with a single goal (half-pitch) place the
 * goalkeeper toward that goal instead of offering halves.
 */
export function getFootballFormationPlacementOptions(
  frame: Pick<BoardFrameDefault, "width" | "height" | "orientation" | "markup">,
): FootballFormationPlacementOption[] {
  const variant = getFootballPitchVariant(frame.markup?.variant);

  if (variant === "half-pitch") {
    return [
      {
        id: "whole-pitch",
        label: "Whole pitch",
        placement: getHalfPitchGoalPlacement(frame),
      },
    ];
  }

  const axis = getDefaultFormationAxis(frame);
  const startLabel = axis === "x" ? "Left" : "Top";
  const endLabel = axis === "x" ? "Right" : "Bottom";

  return [
    {
      id: "start-half",
      label: `${startLabel} half`,
      placement: { axis, side: "start", span: "half" },
    },
    {
      id: "end-half",
      label: `${endLabel} half`,
      placement: { axis, side: "end", span: "half" },
    },
    {
      id: "full-start",
      label: `Whole pitch · goal ${startLabel.toLowerCase()}`,
      placement: { axis, side: "start", span: "full" },
    },
    {
      id: "full-end",
      label: `Whole pitch · goal ${endLabel.toLowerCase()}`,
      placement: { axis, side: "end", span: "full" },
    },
  ];
}
