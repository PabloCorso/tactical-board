import type {
  Board,
  BoardObject,
  CaptionBackgroundStyle,
  CaptionPlacement,
} from "../board/types";
import { resolveEffectivePlayerStyle } from "../board/player-style";
import { PLAYER_OBJECT_TYPE, type PlayerObject } from "./player-object";
import {
  ARROW_OBJECT_TYPE,
  updateArrowObject,
  type ArrowObject,
} from "./arrow-object";
import {
  SHAPE_OBJECT_TYPE,
  updateShapeObject,
  type ShapeObject,
} from "./shape-object";
import {
  resolveObjectMeasurementStyle,
  type ObjectMeasurement,
  type ObjectMeasurementStyle,
} from "./object-measurement";

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

export type ObjectMeasurementSelectionState = {
  visible: boolean;
  mixed: boolean;
};

type ObjectMeasurementStyleProperty<T> = {
  value: T;
  mixed: boolean;
};

export type ObjectMeasurementStyleSelectionState = {
  placement: ObjectMeasurementStyleProperty<CaptionPlacement>;
  distance: ObjectMeasurementStyleProperty<number>;
  fontSize: ObjectMeasurementStyleProperty<number>;
  color: ObjectMeasurementStyleProperty<string>;
  backgroundStyle: ObjectMeasurementStyleProperty<CaptionBackgroundStyle>;
  backgroundColor: ObjectMeasurementStyleProperty<string>;
};

function getObjectMeasurement(
  object: BoardObject,
): ObjectMeasurement | undefined {
  if (object.type === ARROW_OBJECT_TYPE) {
    return (object as ArrowObject).props.measurement;
  }

  if (
    object.type === SHAPE_OBJECT_TYPE &&
    (object as ShapeObject).props.kind === "rectangle"
  ) {
    return (object as ShapeObject).props.measurement;
  }

  return undefined;
}

export function getObjectMeasurementVisibility(
  object: BoardObject,
): boolean | undefined {
  if (object.type === ARROW_OBJECT_TYPE) {
    return Boolean(getObjectMeasurement(object)?.visible);
  }

  if (
    object.type === SHAPE_OBJECT_TYPE &&
    (object as ShapeObject).props.kind === "rectangle"
  ) {
    return Boolean(getObjectMeasurement(object)?.visible);
  }

  return undefined;
}

export function updateObjectMeasurementVisibility(
  object: BoardObject,
  visible: boolean,
): BoardObject {
  if (object.type === ARROW_OBJECT_TYPE) {
    const arrow = object as ArrowObject;
    return updateArrowObject(object as ArrowObject, {
      measurement: { ...arrow.props.measurement, visible },
    });
  }

  if (
    object.type === SHAPE_OBJECT_TYPE &&
    (object as ShapeObject).props.kind === "rectangle"
  ) {
    const shape = object as ShapeObject;
    return updateShapeObject(object as ShapeObject, {
      measurement: { ...shape.props.measurement, visible },
    });
  }

  return object;
}

export function getObjectMeasurementSelectionState(
  selectedObjects: BoardObject[],
): ObjectMeasurementSelectionState | undefined {
  const visibility = selectedObjects.map(getObjectMeasurementVisibility);

  if (
    selectedObjects.length === 0 ||
    visibility.some((value) => value === undefined)
  ) {
    return undefined;
  }

  const resolvedVisibility = visibility as boolean[];

  return {
    visible: resolvedVisibility[0],
    mixed: new Set(resolvedVisibility).size > 1,
  };
}

export function updateObjectMeasurementStyle(
  object: BoardObject,
  style: Partial<ObjectMeasurementStyle>,
): BoardObject {
  if (getObjectMeasurementVisibility(object) === undefined) {
    return object;
  }

  const measurement = getObjectMeasurement(object);
  const nextMeasurement = {
    ...measurement,
    visible: measurement?.visible ?? false,
    style: {
      ...measurement?.style,
      ...style,
    },
  };

  if (object.type === ARROW_OBJECT_TYPE) {
    return updateArrowObject(object as ArrowObject, {
      measurement: nextMeasurement,
    });
  }

  return updateShapeObject(object as ShapeObject, {
    measurement: nextMeasurement,
  });
}

export function getObjectMeasurementStyleSelectionState(
  selectedObjects: BoardObject[],
): ObjectMeasurementStyleSelectionState | undefined {
  if (getObjectMeasurementSelectionState(selectedObjects) === undefined) {
    return undefined;
  }

  const styles = selectedObjects.map((object) =>
    resolveObjectMeasurementStyle(
      getObjectMeasurement(object),
      typeof object.props.color === "string" ? object.props.color : undefined,
    ),
  );
  const createProperty = <T>(
    getValue: (style: Required<ObjectMeasurementStyle>) => T,
  ): ObjectMeasurementStyleProperty<T> => {
    const values = styles.map(getValue);

    return {
      value: values[0],
      mixed: new Set(values).size > 1,
    };
  };

  return {
    placement: createProperty((style) => style.placement),
    distance: createProperty((style) => style.distance),
    fontSize: createProperty((style) => style.fontSize),
    color: createProperty((style) => style.color.trim().toLowerCase()),
    backgroundStyle: createProperty((style) => style.backgroundStyle),
    backgroundColor: createProperty((style) =>
      style.backgroundColor.trim().toLowerCase(),
    ),
  };
}
