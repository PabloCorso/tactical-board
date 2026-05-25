import {
  DEFAULT_BOARD_COLOR,
  DEFAULT_BOARD_COLORS,
} from "../../../core/colors/default-colors";
import type { ArrowToolDefault } from "../../../core/tools/arrow-tool";
import type { PlayerToolDefault } from "../../../core/tools/player-tool";
import type { ShapeToolDefault } from "../../../core/tools/shape-tool";

export const BOARD_PLAYER_DEFAULT_COLORS = [
  DEFAULT_BOARD_COLOR.red,
  DEFAULT_BOARD_COLOR.blue,
  ...DEFAULT_BOARD_COLORS.slice(0, 11).filter(
    (color) =>
      color !== DEFAULT_BOARD_COLOR.red && color !== DEFAULT_BOARD_COLOR.blue,
  ),
];

export const BOARD_ARROW_DEFAULTS: Array<
  ArrowToolDefault & {
    variant: "straight-solid" | "wavy" | "curved-solid" | "double";
  }
> = [
  {
    id: "run",
    label: "Run",
    variant: "straight-solid",
    draftStyle: {
      kind: "straight",
    },
  },
  {
    id: "dribble",
    label: "Dribble",
    variant: "wavy",
    draftStyle: {
      kind: "wavy",
    },
  },
  {
    id: "lofted-pass",
    label: "Lofted pass",
    variant: "curved-solid",
    draftStyle: {
      kind: "curved",
    },
  },
  {
    id: "screen",
    label: "Screen",
    variant: "double",
    draftStyle: {
      kind: "double",
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
    label: "Rectangle",
    variant: "rectangle",
    draftStyle: {
      kind: "rectangle",
    },
  },
  {
    id: "shape-oval",
    label: "Oval",
    variant: "oval",
    draftStyle: {
      kind: "oval",
    },
  },
  {
    id: "shape-triangle",
    label: "Triangle",
    variant: "triangle",
    draftStyle: {
      kind: "triangle",
    },
  },
  {
    id: "shape-diamond",
    label: "Diamond",
    variant: "diamond",
    draftStyle: {
      kind: "diamond",
    },
  },
  {
    id: "shape-polygon",
    label: "Polygon",
    variant: "polygon",
    draftStyle: {
      kind: "polygon",
    },
  },
];

export const BOARD_PLAYER_DEFAULTS: PlayerToolDefault[] =
  BOARD_PLAYER_DEFAULT_COLORS.map((color, index) => ({
    id: `team-color-${index + 1}`,
    label: String(index + 1),
    tooltip: "Player color",
    draftStyle: {
      color,
    },
  }));
