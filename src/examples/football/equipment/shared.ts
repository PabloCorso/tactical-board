export function renderFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.beginPath();
  context.roundRect(-width / 2, -height / 2, width, height, 6);
  context.stroke();
}

export function darkenHexColor(color: string, factor = 0.22) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);

  if (!match) {
    return null;
  }

  const [red, green, blue] = [0, 2, 4].map((offset) =>
    Number.parseInt(match[1].slice(offset, offset + 2), 16),
  );
  const toHex = (channel: number) =>
    Math.round(channel * (1 - factor))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}
