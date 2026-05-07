import { createBoard } from "../../core/board/create-board";
import type { Board } from "../../core/board/types";
import { soccer11v11Surface } from "./soccer-11v11-surface";

export const footballBoardExample: Board = createBoard({
  id: "football-example",
  version: 1,
  metadata: {
    name: "4-3-3 Pressing Shape",
    description:
      "Example board used to exercise the architecture in Storybook.",
    tags: ["football", "demo"],
  },
  surface: soccer11v11Surface,
  style: {
    themeId: "training-ground",
    skinIds: {
      "player-token": "numbered-circle",
    },
  },
  objects: {
    byId: {
      gk: {
        id: "gk",
        type: "player-token",
        position: { x: 8, y: 50 },
        props: { team: "home", number: 1 },
      },
      cb1: {
        id: "cb1",
        type: "player-token",
        position: { x: 22, y: 35 },
        props: { team: "home", number: 4 },
      },
      cb2: {
        id: "cb2",
        type: "player-token",
        position: { x: 22, y: 65 },
        props: { team: "home", number: 5 },
      },
      cm: {
        id: "cm",
        type: "player-token",
        position: { x: 48, y: 50 },
        props: { team: "home", number: 6 },
      },
      rw: {
        id: "rw",
        type: "player-token",
        position: { x: 76, y: 26 },
        props: { team: "home", number: 7 },
      },
      st: {
        id: "st",
        type: "player-token",
        position: { x: 81, y: 50 },
        props: { team: "home", number: 9 },
      },
      lw: {
        id: "lw",
        type: "player-token",
        position: { x: 76, y: 74 },
        props: { team: "home", number: 11 },
      },
    },
    order: ["gk", "cb1", "cb2", "cm", "rw", "st", "lw"],
  },
});
