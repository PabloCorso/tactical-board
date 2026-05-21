import type { BoardObject, BoardObjectSize, Point } from "../board/types";
import {
  cloneObjectAppearance,
  DEFAULT_RENDER_APPEARANCE,
  type ObjectAppearance,
} from "./object-appearance";

export const EQUIPMENT_OBJECT_TYPE = "equipment";
const MIN_EQUIPMENT_DIMENSION = 0.25;

export interface EquipmentCapabilities {
  color?: boolean;
  label?: boolean;
}

export interface EquipmentTransformCapabilities {
  move?: boolean;
  resize?: boolean;
  rotate?: boolean;
}

export interface EquipmentSelectionBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface EquipmentDefinitionSnapshot {
  kind: string;
  label: string;
  color?: string;
  appearance?: ObjectAppearance;
  capabilities?: EquipmentCapabilities;
  transformCapabilities?: EquipmentTransformCapabilities;
  lockedAspectRatio?: boolean;
  selectionBounds?: EquipmentSelectionBounds;
  selectionPaddingPx?: number;
  minimumHitRadiusPx?: number;
  hitTestShape?: "rect" | "circle";
}

export interface EquipmentObjectProps extends Record<string, unknown> {
  kind: string;
  label?: string;
  color?: string;
  appearance: ObjectAppearance;
}

export type EquipmentObject = BoardObject & {
  type: typeof EQUIPMENT_OBJECT_TYPE;
  props: EquipmentObjectProps;
};

export interface EquipmentDefinition extends EquipmentDefinitionSnapshot {
  defaultSize: {
    width: number;
    height: number;
  };
}

type EquipmentCoreInput = {
  position: Point;
  rotation?: number;
  size?: Partial<BoardObjectSize>;
  kind: string;
  label?: string;
  color?: string;
  appearance?: ObjectAppearance;
  definition?: EquipmentDefinition;
};

const equipmentDefinitionsByKind: Record<string, EquipmentDefinitionSnapshot> =
  {};

export function registerEquipmentDefinitions(
  definitions: EquipmentDefinition[],
) {
  for (const definition of definitions) {
    equipmentDefinitionsByKind[definition.kind] = definition;
  }
}

export function getEquipmentDefinition(
  equipment: Pick<EquipmentObject, "props">,
): EquipmentDefinitionSnapshot | undefined {
  return equipmentDefinitionsByKind[equipment.props.kind];
}

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function normalizeRotation(rotation = 0) {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function normalizeEquipmentSize(
  size: Partial<BoardObjectSize> | undefined,
): BoardObjectSize {
  return {
    width: Math.max(
      size?.width ?? MIN_EQUIPMENT_DIMENSION,
      MIN_EQUIPMENT_DIMENSION,
    ),
    height: Math.max(
      size?.height ?? size?.width ?? MIN_EQUIPMENT_DIMENSION,
      MIN_EQUIPMENT_DIMENSION,
    ),
  };
}

function getCanonicalEquipmentProps(
  input: Pick<
    EquipmentCoreInput,
    "appearance" | "kind" | "label" | "color" | "definition"
  >,
): EquipmentObjectProps {
  const definition = input.definition;

  return {
    kind: input.kind,
    label: input.label,
    color: input.color ?? definition?.color,
    appearance: cloneObjectAppearance(
      input.appearance ?? definition?.appearance ?? DEFAULT_RENDER_APPEARANCE,
    ),
  };
}

function createCanonicalEquipmentObject(
  base: Omit<EquipmentObject, "position" | "rotation" | "size" | "props">,
  input: EquipmentCoreInput,
): EquipmentObject {
  if (input.definition) {
    equipmentDefinitionsByKind[input.definition.kind] = input.definition;
  }

  return {
    ...base,
    position: clonePoint(input.position),
    rotation: normalizeRotation(input.rotation),
    size: normalizeEquipmentSize(input.size),
    props: getCanonicalEquipmentProps(input),
  };
}

export function createEquipmentObject(
  input: {
    id: string;
  } & EquipmentCoreInput,
): EquipmentObject {
  return createCanonicalEquipmentObject(
    {
      id: input.id,
      type: EQUIPMENT_OBJECT_TYPE,
    },
    input,
  );
}

export function updateEquipmentObject(
  object: EquipmentObject,
  input: Partial<EquipmentCoreInput>,
): EquipmentObject {
  return createCanonicalEquipmentObject(
    {
      ...object,
      type: EQUIPMENT_OBJECT_TYPE,
    },
    {
      position: input.position ?? object.position,
      rotation: input.rotation ?? object.rotation,
      size: input.size ?? object.size,
      kind: input.kind ?? object.props.kind,
      label: input.label ?? object.props.label,
      color: input.color ?? object.props.color,
      appearance: input.appearance ?? object.props.appearance,
      definition: input.definition,
    },
  );
}

export function resizeEquipmentObject(
  object: EquipmentObject,
  nextSize: Partial<BoardObjectSize>,
): EquipmentObject {
  return updateEquipmentObject(object, {
    size: {
      ...object.size,
      ...nextSize,
    },
  });
}

export function rotateEquipmentObject(
  object: EquipmentObject,
  rotation: number,
): EquipmentObject {
  return updateEquipmentObject(object, { rotation });
}
