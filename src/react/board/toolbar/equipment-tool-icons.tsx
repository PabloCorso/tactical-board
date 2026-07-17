import { useMemo } from "react";
import {
  createEquipmentObject,
  type EquipmentDefinition,
} from "../../../core/objects/equipment-object";
import type { CanvasObjectRenderer } from "../../../core/rendering/canvas/types";
import { getEquipmentToolState } from "../../../core/tools/equipment-tool-state";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { cn } from "../../ui/misc";
import { BoardToolIconCanvas } from "./tool-icon-canvas";
import { getThemeAwareToolIconColor } from "./tool-icon-color";

export function BoardEquipmentDefinitionIcon({
  definition,
  renderer,
  className,
  size = 24,
}: {
  definition: EquipmentDefinition;
  renderer: CanvasObjectRenderer;
  className?: string;
  size?: number;
}) {
  const iconColor = getThemeAwareToolIconColor(definition.color);
  const equipment = useMemo(
    () =>
      createEquipmentObject({
        id: "tool-icon-equipment",
        position: { x: 0, y: 0 },
        rotation: 0,
        size: {
          width: definition.defaultSize.width,
          height: definition.defaultSize.height,
        },
        kind: definition.kind,
        color: iconColor,
        definition,
      }),
    [definition, iconColor],
  );

  return (
    <BoardToolIconCanvas
      object={equipment}
      renderer={renderer}
      className={cn("h-6 w-6", className)}
      width={size}
      height={size}
    />
  );
}

export function BoardEquipmentToolIcon({
  definitions,
  renderer,
}: {
  definitions: EquipmentDefinition[];
  renderer: CanvasObjectRenderer;
}) {
  const store = useBoardEditorContext();
  const kind = useBoardEditorStore(
    store,
    (state) => getEquipmentToolState(state.toolState).draftStyle.kind,
  );
  const definition = useMemo(
    () => definitions.find((item) => item.kind === kind) ?? definitions[0],
    [definitions, kind],
  );

  if (!definition) {
    return null;
  }

  return (
    <BoardEquipmentDefinitionIcon definition={definition} renderer={renderer} />
  );
}
