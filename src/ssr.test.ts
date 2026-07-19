import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorProvider,
  BoardPrimaryToolbar,
  BoardViewerCanvas,
  createBoardEditorStore,
  useBoardEditorStore,
} from ".";
import { createFootballBoard, createFootballEditorConfig } from "./react";

function BoardName() {
  const name = useBoardEditorStore((state) => state.board.metadata.name);
  return createElement("span", null, name);
}

describe("SSR safety", () => {
  it("server-renders the public React exports with static imports", () => {
    const board = createFootballBoard();
    const store = createBoardEditorStore({
      initialBoard: board,
    });

    expect(() =>
      renderToString(
        createElement(
          BoardEditorProvider,
          { store },
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
    const config = createFootballEditorConfig();
    const store = createBoardEditorStore({
      initialBoard: createFootballBoard(),
      ...config,
    });
    const html = renderToString(
      createElement(
        BoardEditorProvider,
        { config, store },
        createElement(BoardPrimaryToolbar),
      ),
    );

    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Equipment"');
  });
});
