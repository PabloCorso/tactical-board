# Migrate from board core to editor core incrementally

The repository will move from board-specific core names toward a generic Editor Engine vocabulary incrementally instead of doing a broad rename first. The migration should prioritize boundary violations, such as core imports from specific tools and selection living inside Select tool state, before renaming stable concepts from Board/BoardObject/BoardEditor toward Document/Shape/Editor. This keeps behavior protected while the architecture becomes more generic.
