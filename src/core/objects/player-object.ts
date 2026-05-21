import type { BoardObject, BoardObjectSize, Point } from "../board/types";
import {
  cloneObjectAppearance,
  DEFAULT_RENDER_APPEARANCE,
  type ObjectAppearance,
} from "./object-appearance";
import { DEFAULT_PRESET_COLOR } from "../colors/preset-colors";

export const PLAYER_OBJECT_TYPE = "player";
export const DEFAULT_PLAYER_SIZE = 20;
export const DEFAULT_PLAYER_COLOR = DEFAULT_PRESET_COLOR.black;
export const DEFAULT_PLAYER_TRANSFORM_CAPABILITIES = {
  move: true,
  resize: false,
  rotate: false,
} as const;

export interface PlayerTransformCapabilities {
  move?: boolean;
  resize?: boolean;
  rotate?: boolean;
}

export interface PlayerObjectProps extends Record<string, unknown> {
  label?: string;
  color: string;
  appearance: ObjectAppearance;
  transformCapabilities: PlayerTransformCapabilities;
}

export type PlayerObject = BoardObject & {
  type: typeof PLAYER_OBJECT_TYPE;
  props: PlayerObjectProps;
};

type PlayerCoreInput = {
  position: Point;
  rotation?: number;
  size?: Partial<BoardObjectSize>;
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
): BoardObjectSize {
  const rawWidth = size?.width ?? size?.height ?? DEFAULT_PLAYER_SIZE;
  const rawHeight = size?.height ?? size?.width ?? rawWidth;
  const dimension = Math.max(rawWidth, rawHeight, 2);

  return {
    width: dimension,
    height: dimension,
  };
}

function getCanonicalPlayerProps(input: PlayerCoreInput): PlayerObjectProps {
  return {
    label: input.label,
    color: input.color ?? DEFAULT_PLAYER_COLOR,
    appearance: cloneObjectAppearance(
      input.appearance ?? DEFAULT_RENDER_APPEARANCE,
    ),
    transformCapabilities: {
      ...DEFAULT_PLAYER_TRANSFORM_CAPABILITIES,
    },
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
    size: normalizePlayerSize(input.size),
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
