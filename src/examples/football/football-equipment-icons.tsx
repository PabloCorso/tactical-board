import { useMemo } from "react";
import type { EquipmentDefinition } from "../../core/objects/equipment-object";
import { createEquipmentObject } from "../../core/objects/equipment-object";
import { useBoardEditorContext } from "../../react/components/board-editor-context";
import { useBoardEditorStore } from "../../react/hooks/use-board-editor-store";
import { createEquipmentRenderer } from "../../tools/equipment-tool";
import { getEquipmentToolState } from "../../tools/equipment-tool-state";
import {
  FOOTBALL_EQUIPMENT_DEFINITIONS,
  FOOTBALL_EQUIPMENT_RENDERERS,
} from "./equipment";
import { FootballToolIconCanvas } from "./football-tool-icon-canvas";

const renderFootballEquipment = createEquipmentRenderer(
  FOOTBALL_EQUIPMENT_RENDERERS,
);

export function FootballEquipmentDefinitionIcon({
  definition,
  className = "h-5 w-5",
  size = 24,
}: {
  definition: EquipmentDefinition;
  className?: string;
  size?: number;
}) {
  const equipment = useMemo(
    () =>
      createEquipmentObject({
        id: "tool-icon-equipment",
        position: { x: 0, y: 0 },
        rotation: 0,
        size: {
          width: definition.defaultSize.width,
          height: definition.defaultSize.height,
          mode: "world",
        },
        kind: definition.kind,
        color: definition.color,
        appearance: definition.appearance,
        definition,
      }),
    [definition],
  );

  return (
    <FootballToolIconCanvas
      object={equipment}
      renderer={renderFootballEquipment}
      className={className}
      width={size}
      height={size}
    />
  );
}

export function FootballEquipmentToolIcon() {
  const store = useBoardEditorContext();
  const kind = useBoardEditorStore(
    store,
    (state) => getEquipmentToolState(state.toolState).draftStyle.kind,
  );
  const definition = useMemo(
    () =>
      FOOTBALL_EQUIPMENT_DEFINITIONS.find((item) => item.kind === kind) ??
      FOOTBALL_EQUIPMENT_DEFINITIONS[0],
    [kind],
  );

  return <FootballEquipmentDefinitionIcon definition={definition} />;
}
