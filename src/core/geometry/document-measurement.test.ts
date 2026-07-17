import { describe, expect, it } from "vitest";
import {
  documentUnitsToMeasurement,
  formatDocumentMeasurements,
  measurementToDocumentUnits,
} from "./document-measurement";

const measurement = { unit: "meter", unitsPerUnit: 8 } as const;

describe("document measurement", () => {
  it("converts between declared measurements and document units", () => {
    expect(measurementToDocumentUnits(3, measurement)).toBe(24);
    expect(documentUnitsToMeasurement(24, measurement)).toBe(3);
  });

  it("formats one or more document dimensions in meters", () => {
    expect(formatDocumentMeasurements([84], measurement)).toBe("10.5 m");
    expect(formatDocumentMeasurements([112, 72], measurement)).toBe("14 × 9 m");
  });

  it("rounds coaching measurements to the nearest half meter", () => {
    expect(formatDocumentMeasurements([82], measurement)).toBe("10.5 m");
    expect(formatDocumentMeasurements([78], measurement)).toBe("10 m");
  });

  it("uses the precision configured with the document unit", () => {
    expect(
      formatDocumentMeasurements([82], {
        ...measurement,
        measurementPrecision: 1,
      }),
    ).toBe("10 m");
    expect(
      formatDocumentMeasurements([82], {
        ...measurement,
        measurementPrecision: 0.1,
      }),
    ).toBe("10.3 m");
  });
});
