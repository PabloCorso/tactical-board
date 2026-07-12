import { describe, expect, it } from "vitest";
import {
  documentUnitsToMeasurement,
  measurementToDocumentUnits,
} from "./document-measurement";

const measurement = { unit: "meter", unitsPerUnit: 8 } as const;

describe("document measurement", () => {
  it("converts between declared measurements and document units", () => {
    expect(measurementToDocumentUnits(3, measurement)).toBe(24);
    expect(documentUnitsToMeasurement(24, measurement)).toBe(3);
  });
});
