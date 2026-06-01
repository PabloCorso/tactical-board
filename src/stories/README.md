# Storybook Integration Examples

These files are executable documentation for host apps and AI coding agents.
When an agent is asked to implement Tactical Board in a host app, start here.

Use these files as examples:

- `examples/football-board-editor.example.tsx`: copyable football editor
  composition using the public React entrypoint.
- `football-board-editor.stories.tsx`: Storybook wiring around the football
  example, plus visual references for pitch variants.
- `basketball-board-editor.stories.tsx`: second sport reference for the same
  editor composition model.

Rules for host-facing examples:

- Import Tactical Board APIs from the public React entrypoint.
- Keep Storybook-specific types and metadata in `*.stories.tsx` files.
- Put copyable host-app code in `examples/*.example.tsx`.
- Do not export stories from the package runtime API.
- Product-specific actions such as save, export, share, analytics, and routing
  belong in the host app. Pass them into examples as composed toolbar UI.

For npm consumers, replace repo-relative imports such as `../../react` with:

```tsx
import { BoardEditor, createBoardEditorStore } from "@pablocorso/tactical-board/react";
```
