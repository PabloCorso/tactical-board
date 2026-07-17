import type { Board, BoardObject } from "../board/types";
import { resolveEffectivePlayerStyle } from "../board/player-style";
import {
  EQUIPMENT_OBJECT_TYPE,
  getEquipmentDefinition,
  type EquipmentObject,
} from "./equipment-object";
import { PLAYER_OBJECT_TYPE, type PlayerObject } from "./player-object";

export function getObjectColor(
  board: Board,
  object: BoardObject,
): string | undefined {
  if (object.type === PLAYER_OBJECT_TYPE) {
    return resolveEffectivePlayerStyle(board, object as PlayerObject).color;
  }

  if (typeof object.props.color === "string") {
    return object.props.color;
  }

  if (object.type === EQUIPMENT_OBJECT_TYPE) {
    return getEquipmentDefinition(object as EquipmentObject)?.color;
  }

  return undefined;
}

export function updateObjectColor(
  object: BoardObject,
  color: string,
): BoardObject {
  return {
    ...object,
    props: {
      ...object.props,
      color,
    },
  };
}

export type ObjectColorSelectionState = {
  color: string;
  mixed: boolean;
};

export function getObjectColorSelectionState(
  board: Board,
  selectedObjects: BoardObject[],
): ObjectColorSelectionState | undefined {
  const colors = selectedObjects.map((object) => getObjectColor(board, object));

  if (
    selectedObjects.length === 0 ||
    colors.some((color) => color === undefined)
  ) {
    return undefined;
  }

  const resolvedColors = colors as string[];

  return {
    color: resolvedColors[0],
    mixed: new Set(resolvedColors.map(normalizeColor)).size > 1,
  };
}

function normalizeColor(color: string) {
  return color.trim().toLowerCase();
}
