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

The library optimizes for HTML canvas. It keeps Object behavior in instance-scoped
Object Definitions and persistent Objects capability-free. Tools interpret input
and invoke editor operations; they do not register Object types or own persistent
Document state. See ADRs 0001, 0002, and 0006 for the decisions behind those
constraints.

`src/core/board` contains framework-independent Board types and helpers. Sport-
and React-specific behavior stays in their respective modules.
