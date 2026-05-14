import type { EquipmentDefinition } from "../../core/objects/equipment-object";
import { DEFAULT_PRESET_COLORS } from "../../react/components/ui/color-picker";

export const FOOTBALL_PLAYER_PRESET_COLORS = [
  DEFAULT_PRESET_COLORS[2],
  DEFAULT_PRESET_COLORS[7],
  ...DEFAULT_PRESET_COLORS.slice(0, 11).filter(
    (color) =>
      color !== DEFAULT_PRESET_COLORS[2] && color !== DEFAULT_PRESET_COLORS[7],
  ),
];

const SOCCER_BALL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="#111827" stroke-width="5"/>
  <polygon points="50,23 63,33 58,49 42,49 37,33" fill="#111827"/>
  <polygon points="28,38 39,51 34,67 18,63 16,47" fill="#111827"/>
  <polygon points="72,38 84,47 82,63 66,67 61,51" fill="#111827"/>
  <polygon points="38,70 49,62 61,70 56,85 43,85" fill="#111827"/>
  <path d="M50 23 L50 8 M28 38 L14 30 M72 38 L86 30 M38 70 L28 88 M62 70 L72 88" stroke="#111827" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>
`.trim();

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

export const FOOTBALL_EQUIPMENT_DEFINITIONS: EquipmentDefinition[] = [
  {
    kind: "soccer-ball",
    label: "Ball",
    family: "ball",
    appearance: {
      kind: "svg",
      svg: SOCCER_BALL_SVG,
    },
    defaultSize: { width: 1.5, height: 1.5 },
    color: "#ffffff",
    capabilities: { color: true, label: true },
    lockedAspectRatio: true,
  },
  {
    kind: "cone",
    label: "Cone",
    family: "cone",
    defaultSize: { width: 1.8, height: 2.2 },
    color: "#ff6b35",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "disc-cone",
    label: "Disc Cone",
    family: "cone",
    defaultSize: { width: 2.2, height: 1.1 },
    color: "#ffc857",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "hoop",
    label: "Hoop",
    family: "frame",
    defaultSize: { width: 2.5, height: 2.5 },
    color: "#4db3ff",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "hurdle",
    label: "Hurdle",
    family: "frame",
    defaultSize: { width: 4, height: 2 },
    color: "#f8fafc",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "ladder",
    label: "Ladder",
    family: "ladder",
    defaultSize: { width: 6, height: 1.8 },
    color: "#facc15",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "mannequin",
    label: "Mannequin",
    family: "mannequin",
    defaultSize: { width: 1.8, height: 4.8 },
    color: "#1f2937",
    capabilities: { color: true, label: true },
    lockedAspectRatio: true,
  },
  {
    kind: "mini-goal",
    label: "Mini Goal",
    family: "frame",
    defaultSize: { width: 4, height: 2.4 },
    color: "#e5e7eb",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "goal",
    label: "Goal",
    family: "frame",
    defaultSize: { width: 7.32, height: 2.44 },
    color: "#ffffff",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "pole",
    label: "Pole",
    family: "pole",
    defaultSize: { width: 0.4, height: 3 },
    color: "#ff5a36",
    capabilities: { color: true, label: true },
    lockedAspectRatio: true,
  },
];
