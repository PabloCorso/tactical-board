import type {
  Board,
  BoardObject,
  ObjectId,
  Point,
  ToolId,
} from "../board/types";
import type { ToolDefinition, ToolRegistry } from "../tools/types";
import type {
  CanvasObjectHitTester,
  CanvasObjectRenderer,
  CanvasObjectRendererRegistry,
  CanvasOverlayRenderer,
  CanvasOverlayRendererRegistry,
} from "../../rendering/canvas/types";
import type { ObjectDefinition, ObjectRegistry } from "../objects/types";

export interface BoardViewport {
  pan: Point;
  zoom: number;
}

export interface BoardEditorUiState {
  activeToolId: ToolId;
  defaultToolId: ToolId;
  hoveredObjectId?: ObjectId;
  canvasRect?: {
    width: number;
    height: number;
  };
  viewport: BoardViewport;
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

export interface BoardEditorActions {
  setActiveTool: (toolId: ToolId) => void;
  setCanvasRect: (rect: { width: number; height: number }) => void;
  setViewport: (viewport: BoardViewport) => void;
  beginHistoryBatch: () => void;
  endHistoryBatch: () => void;
  undo: () => void;
  redo: () => void;
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
  rendering: BoardEditorRenderingState;
  objectRegistry: ObjectRegistry;
  toolState: BoardEditorToolState;
  toolRegistry: ToolRegistry;
  actions: BoardEditorActions;
}
