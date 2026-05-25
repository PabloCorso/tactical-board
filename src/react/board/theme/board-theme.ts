import type { BoardFrameConfig } from "../../../core/board/types";
import type { EquipmentDefinition } from "../../../core/objects/equipment-object";
import type { CanvasObjectRendererRegistry } from "../../../core/rendering/canvas/types";
import type { EquipmentCanvasRendererRegistry } from "../../../core/tools/equipment-tool";

export type BoardTheme = {
  frames?: BoardFrameConfig[];
  equipment?: {
    definitions: EquipmentDefinition[];
    renderersByKind?: EquipmentCanvasRendererRegistry;
  };
  objectRenderers: CanvasObjectRendererRegistry;
};
