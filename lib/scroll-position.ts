/** Query variants such as saved pieces and colour filters have independent positions. */
export function scrollStorageKey(pathname: string, search = "") {
  return `brakmasra_scroll_${pathname}${search}`;
}

export function parseScrollPosition(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const position = Number(value);
  return Number.isFinite(position) && position >= 0 ? position : null;
}
