import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BOARD_EDITOR_DEFAULT_LABELS } from "../editor/board-editor-labels";
import { CaptionStyleFields } from "./player-caption-fields";

describe("CaptionStyleFields", () => {
  it("renders the selected background label instead of its stored key", () => {
    const markup = renderToStaticMarkup(
      createElement(CaptionStyleFields, {
        labels: BOARD_EDITOR_DEFAULT_LABELS,
        style: { backgroundStyle: "solid" },
        onChange: () => undefined,
      }),
    );

    expect(markup).toContain(">Solid<");
    expect(markup).not.toContain(">solid<");
  });
});
