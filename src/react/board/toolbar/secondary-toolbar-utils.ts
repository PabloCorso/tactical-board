export function matchesDraftStyle<T extends Record<string, unknown>>(
  current: T,
  toolDefault: Partial<T>,
) {
  return (Object.entries(toolDefault) as Array<[keyof T, T[keyof T]]>).every(
    ([key, value]) => JSON.stringify(current[key]) === JSON.stringify(value),
  );
}
