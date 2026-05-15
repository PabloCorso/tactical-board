import type { Board, ObjectId, ObjectType } from "./types";

const OBJECT_TYPE_LAYER_RANK: Partial<Record<ObjectType, number>> = {
  shape: 0,
  equipment: 1,
  arrow: 2,
  player: 3,
};

const DEFAULT_OBJECT_LAYER_RANK = 1;

function getObjectLayerRank(type: ObjectType) {
  return OBJECT_TYPE_LAYER_RANK[type] ?? DEFAULT_OBJECT_LAYER_RANK;
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
