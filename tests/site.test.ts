import { describe, expect, it } from "vitest";
import { buildSocialLinks, buildWhatsAppLink, site, withWhatsAppMessage } from "@/data/site";

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

describe("WhatsApp link", () => {
  it("turns a number in international form into a wa.me link", () => {
    expect(buildWhatsAppLink("94771234567")).toBe("https://wa.me/94771234567");
    expect(buildWhatsAppLink("+94 77 123 4567")).toBe("https://wa.me/94771234567");
  });

  it("keeps a configured WhatsApp link", () => {
    expect(buildWhatsAppLink("https://wa.me/94771234567")).toBe("https://wa.me/94771234567");
    expect(buildWhatsAppLink("https://api.whatsapp.com/send?phone=94771234567")).toBe("https://api.whatsapp.com/send?phone=94771234567");
  });

  it("hides the button when the value is missing or not WhatsApp", () => {
    expect(buildWhatsAppLink(undefined)).toBeNull();
    expect(buildWhatsAppLink("  ")).toBeNull();
    expect(buildWhatsAppLink("12345")).toBeNull();
    expect(buildWhatsAppLink("http://wa.me/94771234567")).toBeNull();
    expect(buildWhatsAppLink("https://example.com/wa.me/94771234567")).toBeNull();
    expect(buildWhatsAppLink("javascript:alert(1)")).toBeNull();
  });

  it("adds the prefilled message", () => {
    expect(withWhatsAppMessage("https://wa.me/94771234567", "Hi BRAKMASRA & team")).toBe("https://wa.me/94771234567?text=Hi+BRAKMASRA+%26+team");
  });
});
