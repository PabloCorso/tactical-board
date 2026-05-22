import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorProvider,
  BoardViewerCanvas,
  createBoardEditorStore,
} from ".";
import { FootballBoardEditor, footballShowcaseBoard } from "./react";

describe("SSR safety", () => {
  it("server-renders the public React exports with static imports", () => {
    const store = createBoardEditorStore({
      initialBoard: footballShowcaseBoard,
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
          board: footballShowcaseBoard,
        }),
      ),
    ).not.toThrow();
  });

  it("server-renders the football React entrypoint with static imports", () => {
    const html = renderToString(createElement(FootballBoardEditor));

    expect(html).toContain("<canvas");
  });
});
