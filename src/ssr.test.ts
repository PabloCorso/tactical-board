import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorProvider,
  BoardPrimaryToolbar,
  BoardViewerCanvas,
  createBoard,
  createBoardEditorInstance,
  createFootballBoardEditor,
  useBoardEditorStore,
} from "./react";

function BoardName() {
  const name = useBoardEditorStore((state) => state.board.metadata.name);
  return createElement("span", null, name);
}

describe("SSR safety", () => {
  it("server-renders the public React exports with static imports", () => {
    const board = createBoard({
      id: "generic-board",
      version: 1,
      metadata: { name: "Generic board" },
      frame: { width: 100, height: 50 },
      objects: { byId: {}, order: [] },
      style: {},
    });
    const editor = createBoardEditorInstance({
      initialBoard: board,
    });

    expect(() =>
      renderToString(
        createElement(
          BoardEditorProvider,
          { editor },
          createElement(
            BoardEditor,
            null,
            createElement(BoardEditorCanvas),
            createElement(BoardName),
          ),
        ),
      ),
    ).not.toThrow();

    expect(() =>
      renderToString(
        createElement(BoardViewerCanvas, {
          board,
        }),
      ),
    ).not.toThrow();
  });

  it("server-renders sport defaults composed through generic React components", () => {
    const editor = createFootballBoardEditor();
    const html = renderToString(
      createElement(
        BoardEditorProvider,
        { editor },
        createElement(BoardPrimaryToolbar),
      ),
    );

    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Equipment"');
  });
});
