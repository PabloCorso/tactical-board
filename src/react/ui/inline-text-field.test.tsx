import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InlineTextField } from "./inline-text-field";

describe("InlineTextField", () => {
  it("keeps one stable input from clipping focus rings and accepts stable layout classes", () => {
    const markup = renderToString(
      createElement(InlineTextField, {
        value: "Team",
        "aria-label": "Team name",
        containerClassName: "min-w-0 flex-1",
        onCommit: () => {},
      }),
    );

    expect(markup).toContain("overflow-visible");
    expect(markup).toContain("min-w-0 flex-1");
    expect(markup).toContain("appearance-none");
    expect(markup).toContain("readOnly");
    expect(markup.match(/<input/g)?.length).toBe(1);
    expect(markup).not.toContain("overflow-hidden align-middle");
  });

  it("keeps placeholder text out of the committed input value", () => {
    const markup = renderToString(
      createElement(InlineTextField, {
        value: "",
        placeholder: "Team name",
        "aria-label": "Team name",
        onCommit: () => {},
      }),
    );

    expect(markup).toContain('value=""');
    expect(markup).toContain('placeholder="Team name"');
    expect(markup).not.toContain('value="Team name"');
  });
});
