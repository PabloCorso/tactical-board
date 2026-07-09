import { BOARD_PLAYER_GROUP_COLOR_ORDER } from "../../../core/board/player-groups";
import type { ArrowToolDefault } from "../../../core/tools/arrow-tool";
import type { PlayerToolDefault } from "../../../core/tools/player-tool";
import type { ShapeToolDefault } from "../../../core/tools/shape-tool";

export const BOARD_PLAYER_DEFAULT_COLORS = [...BOARD_PLAYER_GROUP_COLOR_ORDER];

export const BOARD_ARROW_DEFAULTS: Array<
  ArrowToolDefault & {
    variant: "line" | "straight-solid" | "wavy" | "curved-solid" | "double";
  }
> = [
  {
    id: "run",
    variant: "straight-solid",
    draftStyle: {
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "line",
    variant: "line",
    draftStyle: {
      kind: "straight",
      startHead: "none",
      endHead: "none",
    },
  },
  {
    id: "dribble",
    variant: "wavy",
    draftStyle: {
      kind: "wavy",
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "lofted-pass",
    variant: "curved-solid",
    draftStyle: {
      kind: "curved",
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "screen",
    variant: "double",
    draftStyle: {
      kind: "double",
      startHead: "none",
      endHead: "triangle",
    },
  },
];

export const BOARD_SHAPE_DEFAULTS: Array<
  ShapeToolDefault & {
    variant: "rectangle" | "oval" | "triangle" | "diamond" | "polygon";
  }
> = [
  {
    id: "shape-rectangle",
    variant: "rectangle",
    draftStyle: {
      kind: "rectangle",
    },
  },
  {
    id: "shape-oval",
    variant: "oval",
    draftStyle: {
      kind: "oval",
    },
  },
  {
    id: "shape-triangle",
    variant: "triangle",
    draftStyle: {
      kind: "triangle",
    },
  },
  {
    id: "shape-diamond",
    variant: "diamond",
    draftStyle: {
      kind: "diamond",
    },
  },
  {
    id: "shape-polygon",
    variant: "polygon",
    draftStyle: {
      kind: "polygon",
    },
  },
];

export const BOARD_PLAYER_DEFAULTS: PlayerToolDefault[] =
  BOARD_PLAYER_DEFAULT_COLORS.map((color, index) => ({
    id: `team-color-${index + 1}`,
    draftStyle: {
      color,
    },
  }));
