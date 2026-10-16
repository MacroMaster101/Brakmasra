import { describe, expect, it } from "vitest";
import { highResolutionImage } from "@/lib/image-quality";

describe("photographic master selection", () => {
  it("selects a local 4K master for catalog photography", () => {
    expect(highResolutionImage("/images/models/caged-freedom.webp")).toBe("/images/quality/models/caged-freedom-4k.webp");
  });
  it("preserves remote uploads, vectors and branding", () => {
    for (const src of ["https://example.com/photo.webp", "/images/flags/lk.svg", "/images/logo.png", "/opengraph-image"])
      expect(highResolutionImage(src)).toBe(src);
  });
  it("does not resolve inherited object properties as asset paths", () => {
    expect(highResolutionImage("constructor")).toBe("constructor");
    expect(highResolutionImage("__proto__")).toBe("__proto__");
  });
});
