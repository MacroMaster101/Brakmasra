import { describe, expect, it } from "vitest";
import { parseWishlist } from "@/lib/wishlist";

describe("saved collection storage", () => {
  it("recovers safely from malformed or unexpected browser storage", () => {
    expect(parseWishlist("not JSON")).toEqual([]);
    expect(parseWishlist('{"slug":"caged-freedom-tee"}')).toEqual([]);
    expect(parseWishlist("null")).toEqual([]);
  });
  it("keeps unique valid slugs without accepting arbitrary JSON values", () => {
    expect(
      parseWishlist(
        '["caged-freedom-tee",null,3,"caged-freedom-tee","paradise-lost-tee"]',
      ),
    ).toEqual(["caged-freedom-tee", "paradise-lost-tee"]);
  });
});
