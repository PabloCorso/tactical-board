import type { EquipmentCanvasRendererRegistry } from "../../../../core/tools/equipment-tool";
import { coneEquipment } from "./cone";
import { discConeEquipment } from "./disc-cone";
import { goalEquipment } from "./goal";
import { hoopEquipment } from "./hoop";
import { hurdleEquipment } from "./hurdle";
import { ladderEquipment } from "./ladder";
import { mannequinEquipment } from "./mannequin";
import { miniGoalEquipment } from "./mini-goal";
import { poleEquipment } from "./pole";
import { soccerBallEquipment } from "./soccer-ball";

const footballEquipment = [
  soccerBallEquipment,
  coneEquipment,
  discConeEquipment,
  hoopEquipment,
  hurdleEquipment,
  ladderEquipment,
  mannequinEquipment,
  miniGoalEquipment,
  goalEquipment,
  poleEquipment,
];

// Equipment default sizes are visual planning-token sizes in board units.
// They are tuned for readability against the 20-unit player token, not physical
// real-world dimensions.
export const FOOTBALL_EQUIPMENT_DEFINITIONS = footballEquipment.map(
  ({ definition }) => definition,
);

export const FOOTBALL_EQUIPMENT_RENDERERS = Object.fromEntries(
  footballEquipment.flatMap(({ definition, renderer }) =>
    renderer ? [[definition.kind, renderer]] : [],
  ),
) as EquipmentCanvasRendererRegistry;
