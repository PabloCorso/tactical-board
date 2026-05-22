import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  createFootballBoard,
  createFootballBoardEditorStore,
  FootballBoardEditor,
  FootballPrimaryToolbar,
  FootballSecondaryToolbar,
} from ".";

describe("React public surface", () => {
  it("exports the simple and composable football editor modules", () => {
    const board = createFootballBoard({ id: "public-surface-board" });
    const store = createFootballBoardEditorStore(board);

    expect(() =>
      renderToString(createElement(FootballBoardEditor)),
    ).not.toThrow();

    expect(() =>
      renderToString(
        createElement(
          BoardEditorProvider,
          { store },
          createElement(
            BoardEditor,
            null,
            createElement(BoardEditorCanvas),
            createElement(BoardEditorShapePolygonDone),
            createElement(BoardEditorCanvasToolbar),
            createElement(BoardEditorSelectionToolbar),
            createElement(FootballPrimaryToolbar),
            createElement(FootballSecondaryToolbar),
          ),
        ),
      ),
    ).not.toThrow();
  });
});
