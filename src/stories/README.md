# Storybook Integration Examples

These files are executable host-app documentation:

- `examples/football-board-editor.example.tsx`: canonical copyable composition
- `football-board-editor.stories.tsx`: Storybook wiring and pitch references
- `basketball-board-editor.stories.tsx`: second-sport composition reference

Rules for host-facing examples:

- Import Tactical Board APIs from the public React entrypoint.
- Keep Storybook-specific types and metadata in `*.stories.tsx` files.
- Put copyable host-app code in `examples/*.example.tsx`.
- Do not export stories from the package runtime API.
- Product-specific actions such as save, export, share, analytics, and routing
  belong in the host app. Pass them into examples as composed toolbar UI.
- NPM consumers import from `@pablocorso/tactical-board/react`.
