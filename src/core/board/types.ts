export type BoardId = string;
export type ObjectId = string;
export type ObjectType = string;
export type ToolId = string;
export type SkinId = string;
export type MeasurementUnit = string;
export type BoardObjectSizeMode = "world" | "screen";

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BoardObjectSize extends Size {
  mode?: BoardObjectSizeMode;
  unit?: MeasurementUnit;
}

export interface BoardMetadata {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface BoardStyleRef {
  themeId?: string;
  skinIds?: Partial<Record<ObjectType, SkinId>>;
}

export interface BoardObject {
  id: ObjectId;
  type: ObjectType;
  position: Point;
  size?: BoardObjectSize;
  rotation?: number;
  locked?: boolean;
  props: Record<string, unknown>;
}

export interface ObjectIndex {
  byId: Record<ObjectId, BoardObject>;
  order: ObjectId[];
}

export interface BoardSurfaceConfig {
  width: number;
  height: number;
  basePixelsPerUnit?: number;
  unit?: MeasurementUnit;
  origin?: Point;
  background?: string;
  markings?: BoardSurfaceMarking[];
  markup?: Record<string, unknown>;
}

export interface SurfaceMarkingStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface SurfaceRectMarking extends SurfaceMarkingStyle {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SurfaceLineMarking extends SurfaceMarkingStyle {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SurfaceCircleMarking extends SurfaceMarkingStyle {
  kind: "circle";
  cx: number;
  cy: number;
  r: number;
}

export interface SurfaceArcMarking extends SurfaceMarkingStyle {
  kind: "arc";
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
}

export type BoardSurfaceMarking =
  | SurfaceRectMarking
  | SurfaceLineMarking
  | SurfaceCircleMarking
  | SurfaceArcMarking;

export interface Board {
  id: BoardId;
  version: number;
  metadata: BoardMetadata;
  surface: BoardSurfaceConfig;
  objects: ObjectIndex;
  style: BoardStyleRef;
}
