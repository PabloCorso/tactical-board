export type BoardId = string;
export type ObjectId = string;
export type SurfacePresetId = string;
export type ObjectType = string;
export type ToolId = string;
export type SkinId = string;

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
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

export interface BoardObjectBase<
  TProps extends object = Record<string, unknown>,
> {
  id: ObjectId;
  type: ObjectType;
  position: Point;
  rotation?: number;
  locked?: boolean;
  props: TProps;
}

export interface ObjectIndex<
  TObject extends BoardObjectBase = BoardObjectBase,
> {
  byId: Record<ObjectId, TObject>;
  order: ObjectId[];
}

export interface BoardSurfaceConfig {
  presetId: SurfacePresetId;
  width: number;
  height: number;
  background?: string;
  markup?: Record<string, unknown>;
}

export interface Board<TObject extends BoardObjectBase = BoardObjectBase> {
  id: BoardId;
  version: number;
  metadata: BoardMetadata;
  surface: BoardSurfaceConfig;
  objects: ObjectIndex<TObject>;
  style: BoardStyleRef;
}
