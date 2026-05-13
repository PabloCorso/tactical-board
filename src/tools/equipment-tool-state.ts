import type { BoardEditorToolState } from "../core/editor/types";

export const EQUIPMENT_TOOL_ID = "equipment";

export interface EquipmentDraftStyle {
  kind: string;
}

export interface EquipmentToolState {
  draftStyle: EquipmentDraftStyle;
}

export const DEFAULT_EQUIPMENT_TOOL_STATE: EquipmentToolState = {
  draftStyle: {
    kind: "",
  },
};

export function getEquipmentToolState(
  toolState: BoardEditorToolState,
): EquipmentToolState {
  const state = toolState[EQUIPMENT_TOOL_ID] as
    | Partial<EquipmentToolState>
    | undefined;

  return {
    draftStyle: {
      ...DEFAULT_EQUIPMENT_TOOL_STATE.draftStyle,
      ...(state?.draftStyle ?? {}),
    },
  };
}
