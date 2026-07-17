import type { DocumentMeasurement } from "../board/types";

export const DEFAULT_DOCUMENT_MEASUREMENT_INCREMENT = 0.5;

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

export function formatDocumentMeasurements(
  values: number[],
  measurement: DocumentMeasurement,
) {
  const increment =
    measurement.measurementPrecision !== undefined
      ? measurement.measurementPrecision
      : DEFAULT_DOCUMENT_MEASUREMENT_INCREMENT;
  const formattedValues = values.map((value) => {
    const measuredValue = documentUnitsToMeasurement(value, measurement);
    const roundedValue = Math.round(measuredValue / increment) * increment;
    const decimalPlaces = getDecimalPlaces(increment);

    return roundedValue.toFixed(decimalPlaces).replace(/\.0+$/, "");
  });
  const unit = measurement.unit === "meter" ? "m" : measurement.unit;

  return `${formattedValues.join(" × ")} ${unit}`;
}

function getDecimalPlaces(value: number) {
  const decimal = String(value).split(".")[1];
  return decimal?.length ?? 0;
}
