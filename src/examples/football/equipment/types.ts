import type { EquipmentDefinition } from "../../../core/objects/equipment-object";
import type { EquipmentCanvasRenderer } from "../../../tools/equipment-tool";

export type FootballEquipmentSpec = {
  definition: EquipmentDefinition;
  renderer?: EquipmentCanvasRenderer;
};
