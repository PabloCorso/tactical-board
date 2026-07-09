# Model player groups as inheritable player defaults

Board state and reusable Board Library code will use **Player Group** as the generic term for a board-level grouping of Players. Sport-specific UI may call the same concept a team, side, squad, or group through React UI Copy, but those words should not become the generic serialized Board shape or shared module vocabulary.

A Player Group provides optional defaults for Players that reference it through Group Identity. A Player may also exist without a Group Identity. Ungrouped Players resolve from built-in or Theme-provided Player defaults plus their own values, which keeps the Board model usable for one-versus-one sports, individual training boards, and Host Apps that hide grouping entirely.

Player Group styling is inheritance, not ownership transfer. The intended semantic model is: built-in or Theme Player defaults, then optional Player Group defaults, then Player-owned overrides. Rendering and editing should use an effective Player style resolved from those layers. Individual Players may override any inherited value, such as goalkeeper color, uploaded image, caption styling, size, appearance, media asset, appearance options, or color roles, without forcing other Players in the same Player Group to change.

Player-owned overrides are stored as ordinary optional Player props rather than in a separate override object. For example, if a grouped Player omits `props.color`, it inherits the Player Group color; if it sets `props.color`, that value is the Player-specific override. This keeps the serialized Board shape close to the Figma-like inheritance model without introducing a second parallel style container on Player props.

Current implementation may still materialize some geometry-oriented values such as placed Player size while the editor evolves. That should be treated as a transitional implementation detail, not as the durable meaning of every style field. Long-term modules should preserve the distinction between inherited defaults and explicit Player overrides so group-wide changes can update inherited Players without overwriting intentional per-Player differences.

Grouped coach workflows such as football may seed two default Player Groups and present them as teams. Those are workflow defaults, not a universal rule that every sport-specific Board or every Player must belong to a team.

## Consequences

- Generic Board state keeps `playerGroups` and Player `groupId` vocabulary instead of renaming those concepts to teams.
- Football and other team-sport React UI may still use "Team" as user-facing copy.
- Player Group style changes should eventually be implemented through an inheritance-aware module rather than blind propagation to every member Player.
- Tests for Player Group styling should target the effective Player style interface so inherited defaults, explicit overrides, and ungrouped Players are all covered in one place.
