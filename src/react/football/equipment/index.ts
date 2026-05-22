import type { EquipmentCanvasRendererRegistry } from "../../../core/tools/equipment-tool";
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
import { equipmentDefinitionMetersToPixels } from "../football-units";

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

export const FOOTBALL_EQUIPMENT_DEFINITIONS = footballEquipment.map(
  ({ definition }) => equipmentDefinitionMetersToPixels(definition),
);

export const FOOTBALL_EQUIPMENT_RENDERERS = Object.fromEntries(
  footballEquipment.flatMap(({ definition, renderer }) =>
    renderer ? [[definition.kind, renderer]] : [],
  ),
) as EquipmentCanvasRendererRegistry;
