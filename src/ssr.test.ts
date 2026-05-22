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
import { FootballExampleApp, footballBoardExample } from "./examples/football";

describe("SSR safety", () => {
  it("server-renders the public React exports with static imports", () => {
    const store = createBoardEditorStore({
      initialBoard: footballBoardExample,
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
          board: footballBoardExample,
        }),
      ),
    ).not.toThrow();
  });

  it("server-renders the football example entrypoint with static imports", () => {
    const html = renderToString(createElement(FootballExampleApp));

    expect(html).toContain("<canvas");
  });
});
