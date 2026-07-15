import { BOARD_PLAYER_GROUP_COLOR_ORDER } from "../../../core/board/player-groups";
import type { ArrowToolDefault } from "../../../core/tools/arrow-tool";
import type { PlayerToolDefault } from "../../../core/tools/player-tool";
import type { ShapeToolDefault } from "../../../core/tools/shape-tool";

export const BOARD_PLAYER_DEFAULT_COLORS = [...BOARD_PLAYER_GROUP_COLOR_ORDER];

export const BOARD_ARROW_DEFAULTS: Array<
  ArrowToolDefault & {
    variant: "straight" | "line" | "wavy" | "curved" | "double";
  }
> = [
  {
    id: "arrow-straight",
    variant: "straight",
    draftStyle: {
      kind: "straight",
      lineStyle: "solid",
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "arrow-line",
    variant: "line",
    draftStyle: {
      kind: "straight",
      lineStyle: "solid",
      startHead: "none",
      endHead: "none",
    },
  },
  {
    id: "arrow-wavy",
    variant: "wavy",
    draftStyle: {
      kind: "wavy",
      lineStyle: "solid",
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "arrow-curved",
    variant: "curved",
    draftStyle: {
      kind: "curved",
      lineStyle: "solid",
      startHead: "none",
      endHead: "triangle",
    },
  },
  {
    id: "arrow-double",
    variant: "double",
    draftStyle: {
      kind: "double",
      lineStyle: "solid",
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
