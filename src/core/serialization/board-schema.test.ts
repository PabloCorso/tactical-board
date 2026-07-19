import { describe, expect, it } from "vitest";
import { parseDocument, serializeDocument } from "./board-schema";

describe("Document serialization", () => {
  it("preserves unknown fields and accepts different schema versions", () => {
    const document = {
      id: "document-1",
      version: 42,
      metadata: {},
      frame: { width: 100, height: 50 },
      objects: { byId: {}, order: [] },
      style: {},
      legacyHostState: { customValue: true },
    };

    const result = parseDocument(serializeDocument(document));

    expect(result).toEqual({ ok: true, document });
  });
});
