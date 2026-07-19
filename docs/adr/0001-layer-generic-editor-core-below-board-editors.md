# Keep the Editor Engine generic below Board layers

The Board Library needs sport-specific workflows without making football, React, or any particular Tool a dependency of generic visual editing.

The **Editor Engine** therefore owns generic concepts such as Document, Object, Selection, history, geometry, Object dispatch, and serialization. Board, sport, and React modules build above it. Reusable Tools are registered by editor instances instead of being privileged by the Engine.

This separation is defined by dependency direction and ownership, not by any single directory name. It keeps the Engine reusable across Host Apps while allowing Board and sport layers to guide product UX.
