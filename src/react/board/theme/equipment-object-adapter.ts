import {
  EQUIPMENT_OBJECT_TYPE,
  type EquipmentDefinition,
} from "../../../core/objects/equipment-object";
import {
  createEquipmentRenderer,
  EquipmentTool,
  type EquipmentCanvasRendererRegistry,
} from "../../../core/tools/equipment-tool";
import type {
  BoardTheme,
  BoardThemeObjectAdapter,
  BoardThemeObjectDefinition,
} from "./board-theme";
import { getThemeObjectDefinitions } from "./board-theme";

export function getThemeEquipmentDefinitions(
  theme?: Pick<BoardTheme, "objects">,
): EquipmentDefinition[] {
  return getThemeObjectDefinitions(theme, EQUIPMENT_OBJECT_TYPE)
    .filter(
      (
        definition,
      ): definition is BoardThemeObjectDefinition & {
        defaultSize: EquipmentDefinition["defaultSize"];
      } => Boolean(definition.defaultSize),
    )
    .map((definition) => ({
      kind: definition.kind,
      label: definition.label,
      defaultSize: definition.defaultSize,
      color:
        typeof definition.defaultProps?.color === "string"
          ? definition.defaultProps.color
          : undefined,
      capabilities:
        definition.capabilities as EquipmentDefinition["capabilities"],
      transformCapabilities:
        definition.transformCapabilities as EquipmentDefinition["transformCapabilities"],
      lockedAspectRatio: definition.lockedAspectRatio,
      selectionBounds: definition.selectionBounds,
      selectionPaddingPx: definition.selectionPaddingPx,
      minimumHitRadiusPx: definition.minimumHitRadiusPx,
      hitTestShape: definition.hitTestShape,
    }));
}

export function createEquipmentObjectAdapter(
  renderersByKind?: EquipmentCanvasRendererRegistry,
): BoardThemeObjectAdapter {
  return {
    type: EQUIPMENT_OBJECT_TYPE,
    createRenderer: () => createEquipmentRenderer(renderersByKind),
    createTools: ({ theme }) => {
      const definitions = getThemeEquipmentDefinitions(theme);

      return definitions.length > 0
        ? [
            new EquipmentTool({
              definitions,
              renderersByKind,
            }),
          ]
        : [];
    },
  };
}
