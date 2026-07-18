import type { Board, ObjectId } from "./types";

export const DEFAULT_OBJECT_ORDER_RANKS = {
  background: 0,
  content: 100,
  annotation: 200,
  foreground: 300,
  text: 400,
} as const;

export const DEFAULT_OBJECT_ORDER_RANK = DEFAULT_OBJECT_ORDER_RANKS.content;

function getValidBoardObject(board: Board, objectId: ObjectId) {
  return board.objects.byId[objectId];
}

export function getOrderedBoardObjectIds(board: Board): ObjectId[] {
  return board.objects.order.filter(
    (objectId) => getValidBoardObject(board, objectId) !== undefined,
  );
}

export function canBringObjectToFront(board: Board, objectId: ObjectId) {
  return canMoveObjectIdsToBoundary(board, [objectId], "front");
}

export function canSendObjectToBack(board: Board, objectId: ObjectId) {
  return canMoveObjectIdsToBoundary(board, [objectId], "back");
}

export function moveObjectIdsToBoundary(
  board: Board,
  objectIds: ObjectId[],
  direction: "front" | "back",
): ObjectId[] {
  const objectIdsToMove = new Set(
    objectIds.filter(
      (objectId) => getValidBoardObject(board, objectId) !== undefined,
    ),
  );

  if (objectIdsToMove.size === 0) {
    return board.objects.order;
  }

  const selectedObjectIds = board.objects.order.filter((objectId) =>
    objectIdsToMove.has(objectId),
  );
  const remainingObjectIds = board.objects.order.filter(
    (objectId) => !objectIdsToMove.has(objectId),
  );

  return direction === "front"
    ? [...remainingObjectIds, ...selectedObjectIds]
    : [...selectedObjectIds, ...remainingObjectIds];
}

export function canMoveObjectIdsToBoundary(
  board: Board,
  objectIds: ObjectId[],
  direction: "front" | "back",
) {
  const nextOrder = moveObjectIdsToBoundary(board, objectIds, direction);

  return (
    nextOrder.length !== board.objects.order.length ||
    nextOrder.some((objectId, index) => objectId !== board.objects.order[index])
  );
}
