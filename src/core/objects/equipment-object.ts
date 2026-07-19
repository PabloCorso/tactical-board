import type { BoardObject, BoardObjectSize, Point } from "../board/types";

export const EQUIPMENT_OBJECT_TYPE = "equipment";
const MIN_EQUIPMENT_DIMENSION = 0.25;

export interface EquipmentDefinition {
  kind: string;
  label: string;
  defaultSize: {
    width: number;
    height: number;
  };
  color?: string;
  toolIconColorMode?: "adaptive" | "fixed";
  minimumHitRadiusPx?: number;
  hitTestShape?: "rect" | "circle";
}

export interface EquipmentObjectProps extends Record<string, unknown> {
  kind: string;
  label?: string;
  color?: string;
  meta?: Record<string, unknown>;
}

export type EquipmentObject = BoardObject & {
  type: typeof EQUIPMENT_OBJECT_TYPE;
  props: EquipmentObjectProps;
};

export type EquipmentDefinitionRegistry = Record<string, EquipmentDefinition>;

type EquipmentCoreInput = {
  position: Point;
  rotation?: number;
  size?: Partial<BoardObjectSize>;
  kind: string;
  label?: string;
  color?: string;
  meta?: Record<string, unknown>;
  definition?: EquipmentDefinition;
};

export function createEquipmentDefinitionRegistry(
  definitions: EquipmentDefinition[],
): EquipmentDefinitionRegistry {
  return Object.fromEntries(
    definitions.map((definition) => [definition.kind, definition]),
  );
}

export function getEquipmentDefinition(
  definitions: EquipmentDefinitionRegistry,
  equipment: Pick<EquipmentObject, "props">,
): EquipmentDefinition | undefined {
  return definitions[equipment.props.kind];
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
    "kind" | "label" | "color" | "meta" | "definition"
  >,
): EquipmentObjectProps {
  const definition = input.definition;

  return {
    kind: input.kind,
    label: input.label,
    color: input.color ?? definition?.color,
    meta: input.meta ? { ...input.meta } : undefined,
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
      meta: input.meta ?? object.props.meta,
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
