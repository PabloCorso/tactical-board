import { describe, expect, it } from "vitest";
import type { BoardFrameConfig } from "./types";
import { createArrowObject } from "../objects/arrow-object";
import { createPlayerObject } from "../objects/player-object";
import { createShapeObject } from "../objects/shape-object";
import {
  remapObjectToFrameRotation,
  remapObjectToFrameSize,
} from "./frame-object-remap";

const previousFrame: BoardFrameConfig = {
  width: 100,
  height: 50,
  fill: "#fff",
};

const nextFrame: BoardFrameConfig = {
  width: 50,
  height: 100,
  fill: "#fff",
};

describe("remapObjectToFrameSize", () => {
  it("keeps a center-positioned object centered in the next frame", () => {
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 50, y: 25 },
    });

    const nextPlayer = remapObjectToFrameSize({
      object: player,
      previousFrame,
      nextFrame,
    });

    expect(nextPlayer.position).toEqual({ x: 25, y: 50 });
  });

  it("keeps a corner-positioned object in the same relative corner", () => {
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 100, y: 50 },
    });

    const nextPlayer = remapObjectToFrameSize({
      object: player,
      previousFrame,
      nextFrame,
    });

    expect(nextPlayer.position).toEqual({ x: 50, y: 100 });
  });

  it("remaps arrow endpoints and derived center", () => {
    const arrow = createArrowObject({
      id: "arrow-1",
      start: { x: 20, y: 10 },
      end: { x: 80, y: 40 },
      color: "#000",
      lineStyle: "solid",
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
    });

    const nextArrow = remapObjectToFrameSize({
      object: arrow,
      previousFrame,
      nextFrame,
    });

    expect(nextArrow.props.start).toEqual({ x: 10, y: 20 });
    expect(nextArrow.props.end).toEqual({ x: 40, y: 80 });
    expect(nextArrow.position).toEqual({ x: 25, y: 50 });
  });

  it("remaps polygon points and keeps shape rotation unchanged", () => {
    const shape = createShapeObject({
      id: "shape-1",
      kind: "polygon",
      points: [
        { x: 20, y: 10 },
        { x: 80, y: 10 },
        { x: 50, y: 40 },
      ],
      rotation: 45,
      color: "#000",
      lineStyle: "solid",
      fillStyle: "none",
    });

    const nextShape = remapObjectToFrameSize({
      object: shape,
      previousFrame,
      nextFrame,
    });

    expect(nextShape.props.points).toEqual([
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 25, y: 80 },
    ]);
    expect(nextShape.position).toEqual({ x: 25, y: 50 });
    expect(nextShape.rotation).toBe(45);
  });
});

describe("remapObjectToFrameRotation", () => {
  it("moves a player from the top goal to the right goal after a 90 degree field rotation", () => {
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 50, y: 0 },
    });

    const nextPlayer = remapObjectToFrameRotation({
      object: player,
      previousFrame: {
        ...previousFrame,
        orientation: 0,
      },
      nextFrame: {
        width: 50,
        height: 100,
        fill: "#fff",
        orientation: 90,
      },
    });

    expect(nextPlayer.position).toEqual({ x: 0, y: 50 });
  });

  it("moves a player through half-pitch goal orientations", () => {
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 0, y: 50 },
    });

    const nextPlayer = remapObjectToFrameRotation({
      object: player,
      previousFrame: {
        width: 50,
        height: 100,
        fill: "#fff",
        orientation: 90,
      },
      nextFrame: {
        width: 100,
        height: 50,
        fill: "#fff",
        orientation: 180,
      },
    });

    expect(nextPlayer.position).toEqual({ x: 50, y: 50 });
  });

  it("rotates arrow endpoints with the field", () => {
    const arrow = createArrowObject({
      id: "arrow-1",
      start: { x: 50, y: 0 },
      end: { x: 50, y: 25 },
      color: "#000",
      lineStyle: "solid",
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
    });

    const nextArrow = remapObjectToFrameRotation({
      object: arrow,
      previousFrame: {
        ...previousFrame,
        orientation: 0,
      },
      nextFrame: {
        width: 50,
        height: 100,
        fill: "#fff",
        orientation: 90,
      },
    });

    expect(nextArrow.props.start).toEqual({ x: 0, y: 50 });
    expect(nextArrow.props.end).toEqual({ x: 25, y: 50 });
    expect(nextArrow.position).toEqual({ x: 12.5, y: 50 });
  });

  it("keeps object facing rotation unchanged", () => {
    const shape = createShapeObject({
      id: "shape-1",
      kind: "rectangle",
      start: { x: 40, y: 10 },
      end: { x: 60, y: 30 },
      rotation: 45,
      color: "#000",
      lineStyle: "solid",
      fillStyle: "none",
    });

    const nextShape = remapObjectToFrameRotation({
      object: shape,
      previousFrame: {
        ...previousFrame,
        orientation: 0,
      },
      nextFrame: {
        width: 50,
        height: 100,
        fill: "#fff",
        orientation: 90,
      },
    });

    expect(nextShape.props.start).toEqual({ x: 10, y: 60 });
    expect(nextShape.props.end).toEqual({ x: 30, y: 40 });
    expect(nextShape.rotation).toBe(45);
  });

  it("rotates object facing when requested", () => {
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 50, y: 0 },
      rotation: 15,
    });

    const nextPlayer = remapObjectToFrameRotation({
      object: player,
      previousFrame: {
        ...previousFrame,
        orientation: 0,
      },
      nextFrame: {
        width: 50,
        height: 100,
        fill: "#fff",
        orientation: 90,
      },
      rotateObject: true,
    });

    expect(nextPlayer.position).toEqual({ x: 0, y: 50 });
    expect(nextPlayer.rotation).toBe(285);
  });
});
