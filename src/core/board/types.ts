export type DocumentId = string;
export type ShapeId = string;
export type ShapeType = string;
export type ToolId = string;
export type SkinId = string;

// Compatibility names kept while Board-facing APIs migrate incrementally.
// Prefer Document/Shape vocabulary for new core Editor Engine work.
export type BoardId = DocumentId;
export type ObjectId = ShapeId;
export type ObjectType = ShapeType;

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type ShapeSize = Size;

export interface Asset {
  src: string;
}

export interface DocumentMetadata {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface DocumentStyleRef {
  themeId?: string;
  skinIds?: Partial<Record<ShapeType, SkinId>>;
}

export interface Shape {
  id: ShapeId;
  type: ShapeType;
  position: Point;
  size?: ShapeSize;
  rotation?: number;
  locked?: boolean;
  props: Record<string, unknown>;
}

export interface ShapeIndex {
  byId: Record<ShapeId, Shape>;
  order: ShapeId[];
}

export interface DocumentBackgroundConfig {
  width: number;
  height: number;
  fill?: string;
}

export type BoardFrameOrientation = 0 | 90 | 180 | 270;

export interface BoardFrameDefault extends DocumentBackgroundConfig {
  background?: string;
  markings?: BoardFrameMarking[];
  orientation?: BoardFrameOrientation;
  markup?: Record<string, unknown>;
}

export interface FrameMarkingStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface FrameRectMarking extends FrameMarkingStyle {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameLineMarking extends FrameMarkingStyle {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface FrameCircleMarking extends FrameMarkingStyle {
  kind: "circle";
  cx: number;
  cy: number;
  r: number;
}

export interface FrameArcMarking extends FrameMarkingStyle {
  kind: "arc";
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
}

export type BoardFrameMarking =
  | FrameRectMarking
  | FrameLineMarking
  | FrameCircleMarking
  | FrameArcMarking;

export interface Document {
  id: DocumentId;
  version: number;
  metadata: DocumentMetadata;
  frame: DocumentBackgroundConfig;
  objects: ShapeIndex;
  style: DocumentStyleRef;
}

// Compatibility names kept for current board/football callers.
export type BoardObjectSize = ShapeSize;
export type BoardMetadata = DocumentMetadata;
export type BoardStyleRef = DocumentStyleRef;
export type BoardObject = Shape;
export type ObjectIndex = ShapeIndex;
export type BoardFrameConfig = BoardFrameDefault;

export interface Board extends Omit<Document, "frame"> {
  frame: BoardFrameDefault;
}
