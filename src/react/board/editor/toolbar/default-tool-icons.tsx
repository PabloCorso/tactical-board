import {
  ArrowUpRightIcon,
  CircleIcon,
  CursorIcon,
  HandGrabbingIcon,
  SquareIcon,
  TextTIcon,
} from "@phosphor-icons/react";
import type { ToolId } from "../../../../core/board/types";

export function getDefaultToolIcon(toolId: ToolId) {
  switch (toolId) {
    case "select":
      return <CursorIcon />;
    case "hand":
      return <HandGrabbingIcon />;
    case "arrow":
      return <ArrowUpRightIcon weight="bold" />;
    case "shape":
      return <SquareIcon weight="bold" />;
    case "player":
      return <CircleIcon weight="fill" />;
    case "equipment":
      return <SquareIcon weight="fill" />;
    case "text":
      return <TextTIcon weight="bold" />;
    default:
      return undefined;
  }
}
