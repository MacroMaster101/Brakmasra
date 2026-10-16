import { describe, expect, it } from "vitest";
import { parseSearchHistory } from "@/lib/search-history";

describe("recent store searches", () => {
  it("ignores corrupted storage and non-string records", () => {
    expect(parseSearchHistory("broken")).toEqual([]);
    expect(parseSearchHistory('{"query":"tee"}')).toEqual([]);
    expect(parseSearchHistory('[null,42,"Paradise"]')).toEqual(["Paradise"]);
  });
  it("keeps real terms in recent order without repeated casing or blank entries", () => {
    expect(parseSearchHistory('[" Paradise ","paradise","","Black","black"]')).toEqual(["Paradise", "Black"]);
  });
  it("bounds old stored data to five searches and a readable term length", () => {
    const result = parseSearchHistory(JSON.stringify(["a".repeat(400), "b", "c", "d", "e", "f"]));
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveLength(100);
  });
});
