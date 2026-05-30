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
} from ".";
import {
  createFootballBoard,
  createFootballTools,
  footballTheme,
} from "./react";

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
          createElement(BoardEditor, null, createElement(BoardEditorCanvas)),
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
    const store = createBoardEditorStore({
      initialBoard: createFootballBoard(),
      tools: createFootballTools(),
    });
    const html = renderToString(
      createElement(
        BoardEditorProvider,
        { store },
        createElement(BoardPrimaryToolbar, { theme: footballTheme }),
      ),
    );

    expect(html).toContain('role="toolbar"');
  });
});
