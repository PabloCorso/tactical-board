import type {
  DocumentBackgroundConfig,
  DocumentCoordinateSystem,
} from "../board/types";

export function getDocumentCoordinateSystem(
  surface: DocumentBackgroundConfig,
): DocumentCoordinateSystem {
  return {
    unit: surface.coordinateSystem?.unit ?? surface.unit ?? "px",
    basePixelsPerUnit:
      surface.coordinateSystem?.basePixelsPerUnit ?? surface.basePixelsPerUnit,
    origin: surface.coordinateSystem?.origin ??
      surface.origin ?? { x: 0, y: 0 },
  };
}
