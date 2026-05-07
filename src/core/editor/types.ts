import type {
  Board,
  BoardObjectBase,
  ObjectId,
  Point,
  ToolId,
} from "../board/types";
import type { ToolDefinition, ToolRegistry } from "../tools/types";

export interface BoardViewport {
  pan: Point;
  zoom: number;
}

export interface BoardEditorUiState {
  activeToolId: ToolId;
  selectedObjectIds: ObjectId[];
  hoveredObjectId?: ObjectId;
  viewport: BoardViewport;
}

export type BoardEditorToolState = Record<string, unknown>;

export interface BoardEditorActions {
  setActiveTool: (toolId: ToolId) => void;
  setSelectedObjectIds: (objectIds: ObjectId[]) => void;
  clearSelection: () => void;
  moveObjects: (objectIds: ObjectId[], delta: Point) => void;
  panViewport: (delta: Point) => void;
  setToolState: (toolId: ToolId, value: unknown) => void;
  clearToolState: (toolId: ToolId) => void;
  registerTool: (tool: ToolDefinition) => void;
}

export interface BoardEditorState<
  TObject extends BoardObjectBase = BoardObjectBase,
> {
  board: Board<TObject>;
  ui: BoardEditorUiState;
  toolState: BoardEditorToolState;
  toolRegistry: ToolRegistry;
  actions: BoardEditorActions;
}
