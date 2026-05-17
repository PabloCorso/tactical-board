# Use HTML canvas as the rendering target

The editor will optimize for an HTML canvas rendering path instead of abstracting equally over Canvas, SVG, and WebGL. Canvas matches the current tactical-board use cases and lets the renderer be tuned around one drawing and invalidation model, while the Editor Engine remains separate from rendering rules so a future renderer can be considered only if a real product need appears.
