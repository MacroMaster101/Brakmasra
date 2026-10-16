import { describe, expect, it } from "vitest";
import { parseScrollPosition, scrollStorageKey } from "@/lib/scroll-position";

describe("reload scroll positions", () => {
  it("keeps saved pieces and colour filters separate from the full shop", () => {
    const keys = ["", "?saved=1", "?color=white"].map((query) => scrollStorageKey("/shop", query));
    expect(new Set(keys).size).toBe(3);
    expect(scrollStorageKey("/about")).not.toBe(keys[0]);
  });
  it.each(["-1", "Infinity", "NaN", "50px", "", " "])("rejects invalid stored position %s", (value) => {
    expect(parseScrollPosition(value)).toBeNull();
  });
  it("accepts the top of the page and fractional browser offsets", () => {
    expect(parseScrollPosition(null)).toBeNull();
    expect(parseScrollPosition("0")).toBe(0);
    expect(parseScrollPosition("1425.5")).toBe(1425.5);
  });
});
