import {
  DEFAULT_PRESET_COLOR,
  DEFAULT_PRESET_COLORS,
} from "../../core/colors/preset-colors";
import type { ArrowToolPreset } from "../../core/tools/arrow-tool";
import type { PlayerToolPreset } from "../../core/tools/player-tool";
import type { ShapeToolPreset } from "../../core/tools/shape-tool";

export const FOOTBALL_PLAYER_PRESET_COLORS = [
  DEFAULT_PRESET_COLOR.red,
  DEFAULT_PRESET_COLOR.blue,
  ...DEFAULT_PRESET_COLORS.slice(0, 11).filter(
    (color) =>
      color !== DEFAULT_PRESET_COLOR.red && color !== DEFAULT_PRESET_COLOR.blue,
  ),
];

export const FOOTBALL_ARROW_PRESETS: Array<
  ArrowToolPreset & {
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

export const FOOTBALL_SHAPE_PRESETS: Array<
  ShapeToolPreset & {
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

export const FOOTBALL_PLAYER_PRESETS: PlayerToolPreset[] =
  FOOTBALL_PLAYER_PRESET_COLORS.map((color, index) => ({
    id: `team-color-${index + 1}`,
    label: String(index + 1),
    tooltip: `Player color ${color}`,
    draftStyle: {
      color,
    },
  }));

export const PLAYER_SHIRT_SVG_BY_COLOR = Object.fromEntries(
  FOOTBALL_PLAYER_PRESET_COLORS.map((color) => [
    color,
    `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" fill="${color}" stroke="rgba(15,23,42,0.28)" stroke-width="5"/>
  <path d="M31 27 L42 20 H58 L69 27 L76 41 L64 47 L60 35 H40 L36 47 L24 41 Z" fill="#ffffff" opacity="0.96"/>
  <path d="M40 35 H60 V73 H40 Z" fill="#ffffff" opacity="0.96"/>
  <path d="M42 20 L50 28 L58 20" fill="none" stroke="rgba(15,23,42,0.24)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`.trim(),
  ]),
) as Record<string, string>;
