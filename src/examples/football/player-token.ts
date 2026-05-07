import type { BoardObjectBase } from "../../core/board/types";
import type { ObjectDefinition } from "../../core/objects/types";

export interface PlayerTokenProps {
  team: "home" | "away" | "neutral";
  number?: number;
  label?: string;
}

export type PlayerTokenObject = BoardObjectBase<PlayerTokenProps>;

export const playerTokenDefinition: ObjectDefinition<PlayerTokenObject> = {
  type: "player-token",
  createDefault: ({ id, position }) => ({
    id,
    type: "player-token",
    position,
    props: {
      team: "home",
    },
  }),
  getBounds: (object) => ({
    x: object.position.x - 2,
    y: object.position.y - 2,
    width: 4,
    height: 4,
  }),
  render: () => {
    // Rendering stays in the canvas layer; this is just a placeholder hook.
  },
};
