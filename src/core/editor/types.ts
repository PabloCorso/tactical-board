import type {
  Board,
  BoardFrameConfig,
  BoardObject,
  Document,
  ObjectId,
  Point,
  Shape,
  ShapeId,
  ToolId,
} from "../board/types";
import type { ToolDefinition, ToolRegistry } from "../tools/types";
import type {
  CanvasObjectHitTester,
  CanvasObjectRenderer,
  CanvasObjectRendererRegistry,
  CanvasOverlayRenderer,
  CanvasOverlayRendererRegistry,
} from "../rendering/canvas/types";
import type {
  ObjectDefinition,
  ObjectRegistry,
  ShapeDefinition,
  ShapeRegistry,
} from "../objects/types";

export interface BoardViewport {
  pan: Point;
  zoom: number;
}

export type BoardEditorNavigationMode = "free" | "contained";

export interface BoardEditorUiState {
  activeToolId: ToolId;
  defaultToolId: ToolId;
  hoveredObjectId?: ObjectId;
  canvasRect?: {
    width: number;
    height: number;
  };
  viewport: BoardViewport;
  fitPadding: number;
  navigationMode: BoardEditorNavigationMode;
}

export interface BoardEditorRenderingState {
  previewObjects: BoardObject[];
  objectRenderers: CanvasObjectRendererRegistry;
  objectHitTesters: Record<string, CanvasObjectHitTester>;
  overlayRenderers: CanvasOverlayRendererRegistry;
}

export interface BoardEditorHistoryEntry {
  board: Board;
  selectedObjectIds: ObjectId[];
}

export interface BoardEditorHistoryState {
  past: BoardEditorHistoryEntry[];
  future: BoardEditorHistoryEntry[];
}

export type BoardEditorToolState = Record<string, unknown>;

export interface BoardEditorSelectionState {
  selectedObjectIds: ObjectId[];
}

export interface BoardEditorActions {
  setActiveTool: (toolId: ToolId) => void;
  setCanvasRect: (rect: { width: number; height: number }) => void;
  setViewport: (viewport: BoardViewport) => void;
  beginHistoryBatch: () => void;
  endHistoryBatch: () => void;
  undo: () => void;
  redo: () => void;
  setFrame: (frame: BoardFrameConfig) => void;
  addObjects: (objects: BoardObject[]) => void;
  bringObjectsToFront: (objectIds: ObjectId[]) => void;
  duplicateObjects: (objectIds: ObjectId[]) => ObjectId[];
  deleteObjects: (objectIds: ObjectId[]) => void;
  sendObjectsToBack: (objectIds: ObjectId[]) => void;
  updateObjects: (
    objectIds: ObjectId[],
    updater: (object: BoardObject) => BoardObject,
  ) => void;
  setPreviewObjects: (objects: BoardObject[]) => void;
  clearPreviewObjects: () => void;
  moveObjects: (objectIds: ObjectId[], delta: Point) => void;
  panViewport: (delta: Point) => void;
  setSelectedObjectIds: (objectIds: ObjectId[]) => void;
  clearSelection: () => void;
  setToolState: (toolId: ToolId, value: unknown) => void;
  clearToolState: (toolId: ToolId) => void;
  registerTool: (tool: ToolDefinition) => void;
  registerObjectRenderer: (
    objectType: string,
    renderer: CanvasObjectRenderer,
  ) => void;
  registerObjectHitTester: (
    objectType: string,
    hitTester: CanvasObjectHitTester,
  ) => void;
  registerOverlayRenderer: (
    overlayKind: string,
    renderer: CanvasOverlayRenderer,
  ) => void;
  registerObjectDefinition: (definition: ObjectDefinition) => void;
}

export interface BoardEditorState {
  board: Board;
  history: BoardEditorHistoryState;
  ui: BoardEditorUiState;
  selection: BoardEditorSelectionState;
  rendering: BoardEditorRenderingState;
  objectRegistry: ObjectRegistry;
  toolState: BoardEditorToolState;
  toolRegistry: ToolRegistry;
  actions: BoardEditorActions;
}

// Preferred Editor Engine vocabulary for new core work. The current state shape
// still exposes `board` as a compatibility property for React and football code.
export type EditorViewport = BoardViewport;
export type EditorUiState = BoardEditorUiState;
export type EditorRenderingState = Omit<
  BoardEditorRenderingState,
  "previewObjects"
> & {
  previewObjects: Shape[];
};
export type EditorHistoryEntry = Omit<BoardEditorHistoryEntry, "board"> & {
  board: Document;
};
export type EditorHistoryState = BoardEditorHistoryState;
export type EditorToolState = BoardEditorToolState;
export type EditorSelectionState = Omit<
  BoardEditorSelectionState,
  "selectedObjectIds"
> & {
  selectedObjectIds: ShapeId[];
};
export type EditorActions = Omit<
  BoardEditorActions,
  | "addObjects"
  | "bringObjectsToFront"
  | "duplicateObjects"
  | "deleteObjects"
  | "sendObjectsToBack"
  | "updateObjects"
  | "setPreviewObjects"
  | "moveObjects"
  | "setSelectedObjectIds"
  | "registerObjectDefinition"
> & {
  addObjects: (objects: Shape[]) => void;
  bringObjectsToFront: (shapeIds: ShapeId[]) => void;
  duplicateObjects: (shapeIds: ShapeId[]) => ShapeId[];
  deleteObjects: (shapeIds: ShapeId[]) => void;
  sendObjectsToBack: (shapeIds: ShapeId[]) => void;
  updateObjects: (
    shapeIds: ShapeId[],
    updater: (shape: Shape) => Shape,
  ) => void;
  setPreviewObjects: (objects: Shape[]) => void;
  moveObjects: (shapeIds: ShapeId[], delta: Point) => void;
  setSelectedObjectIds: (shapeIds: ShapeId[]) => void;
  registerObjectDefinition: (definition: ShapeDefinition) => void;
};
export type EditorState = Omit<
  BoardEditorState,
  "board" | "rendering" | "selection" | "objectRegistry" | "actions"
> & {
  board: Document;
  rendering: EditorRenderingState;
  selection: EditorSelectionState;
  objectRegistry: ShapeRegistry;
  actions: EditorActions;
};

export type { Board, BoardObject, ObjectDefinition, ObjectId, ObjectRegistry };
