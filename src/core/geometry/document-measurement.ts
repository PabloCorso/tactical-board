import type { DocumentMeasurement } from "../board/types";

export function measurementToDocumentUnits(
  value: number,
  measurement: DocumentMeasurement,
) {
  return value * measurement.unitsPerUnit;
}

export function documentUnitsToMeasurement(
  value: number,
  measurement: DocumentMeasurement,
) {
  return value / measurement.unitsPerUnit;
}
