# Tactical Board

Reusable tactical board/editor library scaffolded around a simple layered architecture:

- `src/core`: framework-independent board model, engine store, editor operations, object/tool contracts, serialization.
- `src/rendering/canvas`: canvas rendering seam.
- `src/react`: `board-editor`, `board-view`, hooks, and input-facing React integration.
- `src/presets`: built-in surfaces, objects, tools, and skins.
- `src/examples/football`: first concrete football example used to pressure-test the architecture.

See [architecture.md](./architecture.md) for the agreed boundaries and reasoning.
