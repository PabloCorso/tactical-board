import type {
  BoardObject,
  BoardObjectSize,
  MeasurementUnit,
  Point,
} from "../board/types";
import {
  cloneObjectAppearance,
  DEFAULT_RENDER_APPEARANCE,
  type ObjectAppearance,
} from "./object-appearance";

export const EQUIPMENT_OBJECT_TYPE = "equipment";
const MIN_EQUIPMENT_DIMENSION = 0.25;

export type EquipmentRenderFamily =
  | "ball"
  | "cone"
  | "frame"
  | "ladder"
  | "mannequin"
  | "pole";

export interface EquipmentCapabilities {
  color?: boolean;
  label?: boolean;
}

export interface EquipmentDefinitionSnapshot {
  kind: string;
  label: string;
  family: EquipmentRenderFamily;
  color?: string;
  appearance?: ObjectAppearance;
  capabilities?: EquipmentCapabilities;
  lockedAspectRatio?: boolean;
}

export interface EquipmentObjectProps extends Record<string, unknown> {
  kind: string;
  label?: string;
  color?: string;
  appearance: ObjectAppearance;
  definition: EquipmentDefinitionSnapshot;
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
  unit?: MeasurementUnit;
  kind: string;
  label?: string;
  color?: string;
  appearance?: ObjectAppearance;
  definition: EquipmentDefinitionSnapshot;
};

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function normalizeRotation(rotation = 0) {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function normalizeEquipmentSize(
  size: Partial<BoardObjectSize> | undefined,
  unit?: MeasurementUnit,
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
    mode: size?.mode ?? "world",
    unit: size?.unit ?? unit,
  };
}

function getCanonicalEquipmentProps(
  input: Pick<
    EquipmentCoreInput,
    "appearance" | "kind" | "label" | "color" | "definition"
  >,
): EquipmentObjectProps {
  return {
    kind: input.kind,
    label: input.label,
    color: input.color ?? input.definition.color,
    appearance: cloneObjectAppearance(
      input.appearance ??
        input.definition.appearance ??
        DEFAULT_RENDER_APPEARANCE,
    ),
    definition: {
      ...input.definition,
      appearance: input.definition.appearance
        ? cloneObjectAppearance(input.definition.appearance)
        : undefined,
      capabilities: {
        ...input.definition.capabilities,
      },
    },
  };
}

function createCanonicalEquipmentObject(
  base: Omit<EquipmentObject, "position" | "rotation" | "size" | "props">,
  input: EquipmentCoreInput,
): EquipmentObject {
  return {
    ...base,
    position: clonePoint(input.position),
    rotation: normalizeRotation(input.rotation),
    size: normalizeEquipmentSize(input.size, input.unit),
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
      unit: input.unit ?? object.size?.unit,
      kind: input.kind ?? object.props.kind,
      label: input.label ?? object.props.label,
      color: input.color ?? object.props.color,
      appearance: input.appearance ?? object.props.appearance,
      definition: input.definition ?? object.props.definition,
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
