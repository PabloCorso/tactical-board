import type { Board } from "../board/types";
import { PLAYER_OBJECT_TYPE } from "../objects/player-object";

export function parsePlayerNumericLabel(label: unknown) {
  if (typeof label !== "string" || label.trim() === "") {
    return undefined;
  }

  const value = Number.parseInt(label, 10);

  if (!Number.isFinite(value) || String(value) !== label.trim()) {
    return undefined;
  }

  return value;
}

export function getNextNumericPlayerLabel(
  board: Pick<Board, "objects">,
  color: string,
  groupId?: string,
) {
  const highestCurrentLabel = Math.max(
    0,
    ...Object.values(board.objects.byId)
      .filter((object) => {
        if (object.type !== PLAYER_OBJECT_TYPE) {
          return false;
        }

        if (groupId) {
          return object.props.groupId === groupId;
        }

        const colorKey = color.trim().toLowerCase();

        return (
          object.props.groupId === undefined &&
          typeof object.props.color === "string" &&
          object.props.color.trim().toLowerCase() === colorKey
        );
      })
      .map((object) => parsePlayerNumericLabel(object.props.label))
      .filter((value): value is number => typeof value === "number"),
  );

  return String(highestCurrentLabel + 1);
}
