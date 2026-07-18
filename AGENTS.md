## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

This repo uses the default triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain-doc layout. See `docs/agents/domain.md`.

## Development workflow

Do not start Storybook or other dev servers for visual testing unless explicitly
asked. Assume the human runs Storybook and provides visual feedback.

Use typecheck for verification by default. Run existing relevant tests when they
cover the changed behavior.

### Testing philosophy

Tests exist to move faster, not as ceremony.

Add or extend tests only for critical flows, bug fixes, risky business logic, or
when explicitly asked. Do not test styling, dimensions, layout, or other volatile
early-stage UI decisions. Skip tests for trivial helpers and obvious glue.

Default to no new tests unless the protected risk is clear and worth the
maintenance cost. Before adding a test, name the risk it protects. Weak risk
means no test.

Prefer one useful flow or integration test over many narrow unit tests.

Keep changes small and vertical. Avoid unrelated cleanup and premature
abstractions.
