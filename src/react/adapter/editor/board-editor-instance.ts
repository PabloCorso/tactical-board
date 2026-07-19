import type { Board } from "../../../core/board/types";
import type { AssetResolver } from "../../../core/rendering/canvas/types";
import {
  createBoardEditorStore,
  type BoardEditorStore,
  type CreateBoardEditorStoreOptions,
} from "../../../core/store/board-editor-store";
import {
  createBoardEditorConfig,
  type BoardEditorConfig,
} from "../../board/theme/create-board-editor-config";

export type BoardEditorInstance = Readonly<{
  assetResolver?: AssetResolver;
  config: BoardEditorConfig;
  store: BoardEditorStore;
}>;

export type CreateBoardEditorInstanceOptions = Omit<
  CreateBoardEditorStoreOptions,
  "initialBoard" | "objectDefinitions" | "tools"
> & {
  assetResolver?: AssetResolver;
  config?: BoardEditorConfig;
  initialBoard: Board;
};

export function createBoardEditorInstance({
  assetResolver,
  config = createBoardEditorConfig(),
  initialBoard,
  ...storeOptions
}: CreateBoardEditorInstanceOptions): BoardEditorInstance {
  const resolvedConfig = {
    ...config,
    objectDefinitions: [...config.objectDefinitions],
    tools: [...config.tools],
  };

  return Object.freeze({
    assetResolver,
    config: resolvedConfig,
    store: createBoardEditorStore({
      ...storeOptions,
      initialBoard,
      objectDefinitions: resolvedConfig.objectDefinitions,
      tools: resolvedConfig.tools,
    }),
  });
}
