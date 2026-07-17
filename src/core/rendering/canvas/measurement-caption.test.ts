import { describe, expect, it } from "vitest";
import {
  getCanvasMeasurementStyle,
  getUprightCanvasTextAngle,
} from "./measurement-caption";

describe("measurement captions", () => {
  it("scales configured type with the Document projection", () => {
    const measurement = {
      visible: true,
      style: { fontSize: 12 },
    };

    expect(getCanvasMeasurementStyle(measurement, 1).fontSize).toBe(12);
    expect(getCanvasMeasurementStyle(measurement, 2).fontSize).toBe(24);
  });

  it("follows an edge angle without rendering text upside down", () => {
    expect(getUprightCanvasTextAngle(0)).toBeCloseTo(0);
    expect(getUprightCanvasTextAngle(Math.PI)).toBeCloseTo(0);
    expect(getUprightCanvasTextAngle((Math.PI * 3) / 4)).toBeCloseTo(
      -Math.PI / 4,
    );
  });
});
