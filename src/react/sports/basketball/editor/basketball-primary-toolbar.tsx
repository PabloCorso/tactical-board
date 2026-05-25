import {
  BoardPrimaryToolbar,
  type BoardPrimaryToolbarProps,
} from "../../../board/toolbar/primary-toolbar";

export type BasketballPrimaryToolbarProps = Omit<
  BoardPrimaryToolbarProps,
  "children" | "showEquipment"
>;

export function BasketballPrimaryToolbar(props: BasketballPrimaryToolbarProps) {
  return <BoardPrimaryToolbar {...props} />;
}
