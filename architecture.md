# Tactical Board Architecture

## Purpose

This is a navigation page, not a second source of architectural truth. Keep
durable terminology and invariants in [CONTEXT.md](./CONTEXT.md), and record
decisions with their rationale in [docs/adr](./docs/adr). Feature documentation
should link to those sources instead of restating them.

## Current layout

```text
src/
  core/                 # framework-independent Editor Engine
    rendering/canvas/   # Canvas Renderer
    tools/              # Standard Tool contracts and implementations
  react/
    adapter/            # React subscriptions and DOM input
    board/              # reusable React board UI and composition
    sports/             # football and basketball adapters
  stories/examples/     # executable host-app examples
```

`src/core` owns persistent Document/Object state, editor operations, geometry,
selection, history, and serialization entrypoints. The Canvas Renderer owns the
draw loop and viewport. The React Adapter owns React integration, not canonical
editor state. Board and sport layers provide frames, objects, themes, tools, and
coach-facing workflows.

Decision rationale: [generic Editor Engine layering](./docs/adr/0001-layer-generic-editor-core-below-board-editors.md)
and [Canvas rendering](./docs/adr/0002-use-html-canvas-as-the-rendering-target.md).
Durable domain terminology and invariants live in [CONTEXT.md](./CONTEXT.md).

`src/core/board` contains framework-independent Board types and helpers. Sport-
and React-specific behavior stays in their respective modules.
