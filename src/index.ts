export { createBoard } from "./core/board/create-board";
export type {
  Board,
  BoardMetadata,
  BoardObjectBase,
  BoardStyleRef,
  BoardSurfaceConfig,
  ObjectId,
  ObjectType,
  Point,
  SkinId,
  SurfacePresetId,
  ToolId,
} from "./core/board/types";
export type {
  BoardEditorActions,
  BoardEditorToolState,
  BoardEditorUiState,
  BoardEditorState,
} from "./core/editor/types";
export type { ObjectDefinition, ObjectRegistry } from "./core/objects/types";
export { parseBoard, serializeBoard } from "./core/serialization/board-schema";
export { createBoardEditorStore } from "./core/store/create-board-editor-store";
export type {
  BoardEditorStore,
  CreateBoardEditorStoreOptions,
} from "./core/store/create-board-editor-store";
export type { ToolApi, ToolDefinition, ToolRegistry } from "./core/tools/types";
export { BoardEditor } from "./react/components/board-editor";
export { BoardView } from "./react/components/board-view";
export { FootballExampleApp } from "./examples/football/football-example-app";
export { footballBoardExample } from "./examples/football/football-board-example";
export { playerTokenDefinition } from "./presets/objects/player-token";
export { classicSkin } from "./presets/skins/classic";
export { soccer11v11Surface } from "./presets/surfaces/soccer-11v11";
export { handTool } from "./presets/tools/hand-tool";
export { selectTool } from "./presets/tools/select-tool";
