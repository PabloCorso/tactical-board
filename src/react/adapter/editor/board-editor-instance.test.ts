import { describe, expect, it } from "vitest";
import type { Board } from "../../../core/board/types";
import type { ObjectDefinition } from "../../../core/objects/types";
import { createBoardEditorConfig } from "../../board/theme/create-board-editor-config";
import { createFootballBoardEditor } from "../../sports/football/theme/football-editor-config";
import { createBoardEditorInstance } from "./board-editor-instance";

const initialBoard: Board = {
  id: "loaded-board",
  version: 1,
  metadata: { name: "Loaded Board" },
  frame: { width: 100, height: 50 },
  objects: { byId: {}, order: [] },
  style: {},
};

describe("createBoardEditorInstance", () => {
  it("owns one coherent config and Editor Store", () => {
    const customTool = { id: "host-tool", label: "Host Tool" };
    const customObjectDefinition = {
      type: "host-object",
      canvas: { render: () => undefined },
    } satisfies ObjectDefinition;
    const config = createBoardEditorConfig({
      objectDefinitions: [customObjectDefinition],
      tools: [customTool],
    });

    const editor = createBoardEditorInstance({ config, initialBoard });
    const state = editor.store.getState();

    expect(state.board).toBe(initialBoard);
    expect(state.toolRegistry.definitions[customTool.id]).toBe(customTool);
    expect(state.objectRegistry.definitions[customObjectDefinition.type]).toBe(
      customObjectDefinition,
    );
    expect(editor.config.tools).not.toBe(config.tools);
    expect(editor.config.objectDefinitions).not.toBe(config.objectDefinitions);
  });

  it("lets a sport factory supply the default Board and Theme runtime", () => {
    const editor = createFootballBoardEditor();

    expect(editor.store.getState().board.frame.markup).toMatchObject({
      sport: "football",
    });
    expect(editor.config.theme?.id).toBe("football");
    expect(editor.config.adapters).toBeDefined();
  });

  it("uses supplied initial state instead of the sport default", () => {
    const editor = createFootballBoardEditor({ initialBoard });

    expect(editor.store.getState().board).toBe(initialBoard);
  });
});
