import type { EquipmentDefinition } from "../../../core/objects/equipment-object";
import type { EquipmentCanvasRenderer } from "../../../tools/equipment-tool";

export interface FootballEquipmentSpec {
  definition: EquipmentDefinition;
  renderer?: EquipmentCanvasRenderer;
}
