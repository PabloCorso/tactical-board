# Tactical Board

Reusable tactical board/editor library scaffolded around a simple layered architecture.

- `src/core`: the framework-independent Editor Engine. It owns Document/Shape state, editor operations, tool contracts, geometry contracts, selection, history, and serialization entrypoints.
- `src/rendering/canvas`: the Canvas Renderer. It paints Document or Board state and transient overlays to HTML canvas.
- `src/react`: the React Adapter and Board Editor UI shell. It wires DOM input and subscriptions without owning canonical Document state.
- `src/tools`: reusable Standard Tools such as Select, Hand, Shape, Arrow, Text, Player, and Equipment.
- `src/examples/football`: the first Football Board pressure-test application. It owns football-specific surfaces, dimensions, object presets, skins, and coach-facing workflows while it remains under examples.

The shared Board Library boundary is still emerging. Do not extract a broad `src/board` or `src/presets` layer until a concrete boundary is proven by more than the football example.

See [architecture.md](./architecture.md), [CONTEXT.md](./CONTEXT.md), and [docs/adr](./docs/adr) for the agreed glossary, boundaries, and architectural decisions.
