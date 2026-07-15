import type { ArrowToolDefault } from "../../../../core/tools/arrow-tool";
import {
  THICK_ARROW_STROKE_WIDTH,
  THIN_ARROW_STROKE_WIDTH,
} from "../../../../core/objects/arrow-object";

export const FOOTBALL_ARROW_DEFAULTS: ArrowToolDefault[] = [
  {
    id: "pass",
    draftStyle: {
      kind: "straight",
      lineStyle: "solid",
      strokeWidth: THIN_ARROW_STROKE_WIDTH,
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "run",
    draftStyle: {
      kind: "straight",
      lineStyle: "dashed",
      strokeWidth: THIN_ARROW_STROKE_WIDTH,
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "dribble",
    draftStyle: {
      kind: "wavy",
      lineStyle: "solid",
      strokeWidth: THIN_ARROW_STROKE_WIDTH,
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "shot",
    draftStyle: {
      kind: "straight",
      lineStyle: "solid",
      strokeWidth: THICK_ARROW_STROKE_WIDTH,
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "cross",
    draftStyle: {
      kind: "curved",
      lineStyle: "solid",
      strokeWidth: THIN_ARROW_STROKE_WIDTH,
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "curved-run",
    draftStyle: {
      kind: "curved",
      lineStyle: "dashed",
      strokeWidth: THIN_ARROW_STROKE_WIDTH,
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "line",
    draftStyle: {
      kind: "straight",
      lineStyle: "solid",
      strokeWidth: THIN_ARROW_STROKE_WIDTH,
      startHead: "none",
      endHead: "none",
    },
  },
];
