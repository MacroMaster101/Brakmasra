import { describe, expect, it } from "vitest";
import { buildSocialLinks, site } from "@/data/site";

describe("site identity", () => {
  it("describes the store, not a video channel", () => {
    expect(site.name).toBe("BRAKMASRA");
    for (const text of [site.tagline, site.slogan, site.description, site.summary]) {
      expect(text).not.toMatch(/youtube|subscribe|channel|video/i);
    }
  });

  it("only lists social links that have an approved URL", () => {
    const links = buildSocialLinks({ NEXT_PUBLIC_TIKTOK_URL: "https://www.tiktok.com/@Brakmasraofficial" });
    expect(links).toEqual([{ label: "TikTok", handle: "@Brakmasraofficial", href: "https://www.tiktok.com/@Brakmasraofficial" }]);
  });

  it("returns no social links when none are configured", () => {
    expect(buildSocialLinks({})).toEqual([]);
  });
});
