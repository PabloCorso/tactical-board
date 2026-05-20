# Football Example Boundary

The Football Example is the first pressure-test application for the Editor Engine and Board Library. It remains under `src/examples/football` for now, but it is not disposable demo code.

## Owns

- football pitch dimensions and markings
- football-specific Surface Presets
- football Player Token and equipment presets
- football skins, icons, and catalog data
- coach-facing tool composition and toolbar workflow

## Consumes

- `src/core` for generic Document, Shape, Selection, history, Tool, geometry, and serialization contracts
- `src/rendering/canvas` for the Canvas Renderer
- `src/react` for the Board Editor React Adapter
- `src/tools` for reusable Standard Tools

## Boundary Rules

- Keep football semantics here. The Editor Engine must not learn football, player-spacing, pitch, or coaching rules.
- Keep using Board-compatible APIs while the migration to Document/Shape vocabulary proceeds incrementally.
- Do not extract shared board abstractions just because two football files share code. Extract only after another sport or concrete planning use case proves a reusable Board Library boundary.
- When changing layering, read the root `architecture.md`, `CONTEXT.md`, and `docs/adr/` first.
