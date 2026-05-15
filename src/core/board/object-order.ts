import type { Board, ObjectId, ObjectType } from "./types";

const OBJECT_TYPE_LAYER_RANK: Partial<Record<ObjectType, number>> = {
  shape: 0,
  equipment: 1,
  arrow: 2,
  player: 3,
};

const DEFAULT_OBJECT_LAYER_RANK = 1;

export function getObjectLayerRank(type: ObjectType) {
  return OBJECT_TYPE_LAYER_RANK[type] ?? DEFAULT_OBJECT_LAYER_RANK;
}

function getValidBoardObject(board: Board, objectId: ObjectId) {
  return board.objects.byId[objectId];
}

export function getOrderedBoardObjectIds(board: Board): ObjectId[] {
  return board.objects.order
    .map((objectId, index) => ({
      objectId,
      index,
      object: board.objects.byId[objectId],
    }))
    .filter(
      (
        entry,
      ): entry is {
        objectId: ObjectId;
        index: number;
        object: Board["objects"]["byId"][string];
      } => entry.object !== undefined,
    )
    .sort((left, right) => {
      const layerDifference =
        getObjectLayerRank(left.object.type) -
        getObjectLayerRank(right.object.type);

      if (layerDifference !== 0) {
        return layerDifference;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.objectId);
}

export function getLayerPeerObjectIds(
  board: Board,
  objectId: ObjectId,
): ObjectId[] {
  const targetObject = getValidBoardObject(board, objectId);

  if (!targetObject) {
    return [];
  }

  const targetLayerRank = getObjectLayerRank(targetObject.type);

  return board.objects.order.filter((candidateId) => {
    const candidateObject = getValidBoardObject(board, candidateId);

    return (
      candidateObject !== undefined &&
      getObjectLayerRank(candidateObject.type) === targetLayerRank
    );
  });
}

export function canBringObjectToFront(board: Board, objectId: ObjectId) {
  const peerObjectIds = getLayerPeerObjectIds(board, objectId);
  return peerObjectIds.length > 0 && peerObjectIds.at(-1) !== objectId;
}

export function canSendObjectToBack(board: Board, objectId: ObjectId) {
  const peerObjectIds = getLayerPeerObjectIds(board, objectId);
  return peerObjectIds.length > 0 && peerObjectIds[0] !== objectId;
}

function reorderLayerPeerObjectIds(
  peerObjectIds: ObjectId[],
  objectIdsToMove: Set<ObjectId>,
  direction: "front" | "back",
) {
  const selectedPeerObjectIds = peerObjectIds.filter((objectId) =>
    objectIdsToMove.has(objectId),
  );

  if (selectedPeerObjectIds.length === 0) {
    return peerObjectIds;
  }

  const remainingPeerObjectIds = peerObjectIds.filter(
    (objectId) => !objectIdsToMove.has(objectId),
  );

  return direction === "front"
    ? [...remainingPeerObjectIds, ...selectedPeerObjectIds]
    : [...selectedPeerObjectIds, ...remainingPeerObjectIds];
}

function replaceLayerObjectIdsInOrder(
  board: Board,
  layerRank: number,
  layerObjectIds: ObjectId[],
) {
  let layerIndex = 0;

  return board.objects.order.map((objectId) => {
    const object = getValidBoardObject(board, objectId);

    if (
      object !== undefined &&
      getObjectLayerRank(object.type) === layerRank &&
      layerIndex < layerObjectIds.length
    ) {
      const nextObjectId = layerObjectIds[layerIndex];
      layerIndex += 1;
      return nextObjectId;
    }

    return objectId;
  });
}

export function moveObjectIdsToLayerBoundary(
  board: Board,
  objectIds: ObjectId[],
  direction: "front" | "back",
): ObjectId[] {
  const validObjectIds = objectIds.filter(
    (objectId, index) =>
      getValidBoardObject(board, objectId) !== undefined &&
      objectIds.indexOf(objectId) === index,
  );

  if (validObjectIds.length === 0) {
    return board.objects.order;
  }

  const layerRanks = Array.from(
    new Set(
      validObjectIds.map((objectId) =>
        getObjectLayerRank(getValidBoardObject(board, objectId)!.type),
      ),
    ),
  );
  let nextOrder = [...board.objects.order];

  for (const layerRank of layerRanks) {
    const peerObjectIds = nextOrder.filter((candidateId) => {
      const candidateObject = getValidBoardObject(board, candidateId);

      return (
        candidateObject !== undefined &&
        getObjectLayerRank(candidateObject.type) === layerRank
      );
    });
    const nextLayerObjectIds = reorderLayerPeerObjectIds(
      peerObjectIds,
      new Set(
        validObjectIds.filter((objectId) => {
          const object = getValidBoardObject(board, objectId);
          return (
            object !== undefined &&
            getObjectLayerRank(object.type) === layerRank
          );
        }),
      ),
      direction,
    );

    nextOrder = replaceLayerObjectIdsInOrder(
      {
        ...board,
        objects: {
          ...board.objects,
          order: nextOrder,
        },
      },
      layerRank,
      nextLayerObjectIds,
    );
  }

  return nextOrder;
}
