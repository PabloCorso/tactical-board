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

export const PLAYER_OBJECT_TYPE = "player";
export const DEFAULT_PLAYER_SIZE = 2.5;
export const DEFAULT_PLAYER_COLOR = "#111827";

export interface PlayerObjectProps extends Record<string, unknown> {
  label?: string;
  color: string;
  appearance: ObjectAppearance;
}

export type PlayerObject = BoardObject & {
  type: typeof PLAYER_OBJECT_TYPE;
  props: PlayerObjectProps;
};

type PlayerCoreInput = {
  position: Point;
  rotation?: number;
  size?: Partial<BoardObjectSize>;
  unit?: MeasurementUnit;
  label?: string;
  color?: string;
  appearance?: ObjectAppearance;
};

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function normalizeRotation(rotation = 0) {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function normalizePlayerSize(
  size: Partial<BoardObjectSize> | undefined,
  unit?: MeasurementUnit,
): BoardObjectSize {
  const rawWidth = size?.width ?? size?.height ?? DEFAULT_PLAYER_SIZE;
  const rawHeight = size?.height ?? size?.width ?? rawWidth;
  const dimension = Math.max(rawWidth, rawHeight, 0.25);

  return {
    width: dimension,
    height: dimension,
    mode: size?.mode ?? "world",
    unit: size?.unit ?? unit,
  };
}

function getCanonicalPlayerProps(input: PlayerCoreInput): PlayerObjectProps {
  return {
    label: input.label,
    color: input.color ?? DEFAULT_PLAYER_COLOR,
    appearance: cloneObjectAppearance(
      input.appearance ?? DEFAULT_RENDER_APPEARANCE,
    ),
  };
}

function createCanonicalPlayerObject(
  base: Omit<PlayerObject, "position" | "rotation" | "size" | "props">,
  input: PlayerCoreInput,
): PlayerObject {
  return {
    ...base,
    position: clonePoint(input.position),
    rotation: normalizeRotation(input.rotation),
    size: normalizePlayerSize(input.size, input.unit),
    props: getCanonicalPlayerProps(input),
  };
}

export function createPlayerObject(
  input: {
    id: string;
  } & PlayerCoreInput,
): PlayerObject {
  return createCanonicalPlayerObject(
    {
      id: input.id,
      type: PLAYER_OBJECT_TYPE,
    },
    input,
  );
}

export function updatePlayerObject(
  object: PlayerObject,
  input: Partial<PlayerCoreInput>,
): PlayerObject {
  return createCanonicalPlayerObject(
    {
      ...object,
      type: PLAYER_OBJECT_TYPE,
    },
    {
      position: input.position ?? object.position,
      rotation: input.rotation ?? object.rotation,
      size: input.size ?? object.size,
      unit: input.unit ?? object.size?.unit,
      label: input.label ?? object.props.label,
      color: input.color ?? object.props.color,
      appearance: input.appearance ?? object.props.appearance,
    },
  );
}

export function resizePlayerObject(
  object: PlayerObject,
  nextSize: number,
): PlayerObject {
  return updatePlayerObject(object, {
    size: {
      ...object.size,
      width: nextSize,
      height: nextSize,
    },
  });
}

export function rotatePlayerObject(
  object: PlayerObject,
  rotation: number,
): PlayerObject {
  return updatePlayerObject(object, { rotation });
}
