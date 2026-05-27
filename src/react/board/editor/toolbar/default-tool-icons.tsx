import {
  ArrowUpRightIcon,
  CircleIcon,
  CursorIcon,
  HandIcon,
  SquareIcon,
  TextTIcon,
} from "@phosphor-icons/react";
import type { ToolId } from "../../../../core/board/types";

export function getDefaultToolIcon(toolId: ToolId) {
  switch (toolId) {
    case "select":
      return (
        <CursorIcon
          aria-hidden="true"
          className="size-6 text-current"
          weight="fill"
        />
      );
    case "hand":
      return (
        <HandIcon
          aria-hidden="true"
          className="size-6 text-current"
          weight="fill"
        />
      );
    case "arrow":
      return (
        <ArrowUpRightIcon
          aria-hidden="true"
          className="size-6 text-current"
          weight="bold"
        />
      );
    case "shape":
      return (
        <SquareIcon
          aria-hidden="true"
          className="size-6 text-current"
          weight="bold"
        />
      );
    case "player":
      return (
        <CircleIcon
          aria-hidden="true"
          className="size-6 text-current"
          weight="fill"
        />
      );
    case "equipment":
      return (
        <SquareIcon
          aria-hidden="true"
          className="size-6 text-current"
          weight="fill"
        />
      );
    case "text":
      return (
        <TextTIcon
          aria-hidden="true"
          className="size-6 text-current"
          weight="bold"
        />
      );
    default:
      return undefined;
  }
}
