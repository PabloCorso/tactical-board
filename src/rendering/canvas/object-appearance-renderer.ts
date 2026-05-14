import type { ObjectAppearance } from "../../core/objects/object-appearance";

type AppearanceImageStatus = "loading" | "loaded" | "error";

interface AppearanceImageCacheEntry {
  image: HTMLImageElement;
  listeners: Set<() => void>;
  status: AppearanceImageStatus;
}

const appearanceImageCache = new Map<string, AppearanceImageCacheEntry>();

function createCacheKey(
  appearance: Exclude<ObjectAppearance, { kind: "render" }>,
) {
  switch (appearance.kind) {
    case "svg":
      return `svg:${appearance.svg}`;
    case "image":
      return `image:${appearance.src}`;
    case "sprite":
      return `sprite:${appearance.src}`;
  }
}

function createImageSource(
  appearance: Exclude<ObjectAppearance, { kind: "render" }>,
) {
  switch (appearance.kind) {
    case "svg":
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(appearance.svg)}`;
    case "image":
    case "sprite":
      return appearance.src;
  }
}

function notifyListeners(entry: AppearanceImageCacheEntry) {
  for (const listener of entry.listeners) {
    listener();
  }

  entry.listeners.clear();
}

function getAppearanceImage(
  appearance: Exclude<ObjectAppearance, { kind: "render" }>,
  requestRender: () => void,
) {
  const cacheKey = createCacheKey(appearance);
  const existingEntry = appearanceImageCache.get(cacheKey);

  if (existingEntry) {
    if (existingEntry.status !== "loaded") {
      existingEntry.listeners.add(requestRender);
    }

    return existingEntry;
  }

  const image = new Image();
  const entry: AppearanceImageCacheEntry = {
    image,
    listeners: new Set([requestRender]),
    status: "loading",
  };

  image.onload = () => {
    entry.status = "loaded";
    notifyListeners(entry);
  };

  image.onerror = () => {
    entry.status = "error";
    notifyListeners(entry);
  };

  image.src = createImageSource(appearance);
  appearanceImageCache.set(cacheKey, entry);

  return entry;
}

export function renderObjectAppearanceAsset({
  appearance,
  context,
  height,
  requestRender,
  width,
}: {
  appearance: ObjectAppearance;
  context: CanvasRenderingContext2D;
  height: number;
  requestRender: () => void;
  width: number;
}) {
  if (appearance.kind === "render") {
    return false;
  }

  const entry = getAppearanceImage(appearance, requestRender);

  if (entry.status !== "loaded") {
    return false;
  }

  if (appearance.kind === "sprite") {
    context.drawImage(
      entry.image,
      appearance.frame.x,
      appearance.frame.y,
      appearance.frame.width,
      appearance.frame.height,
      -width / 2,
      -height / 2,
      width,
      height,
    );
    return true;
  }

  context.drawImage(entry.image, -width / 2, -height / 2, width, height);
  return true;
}
