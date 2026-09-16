import { describe, expect, it } from "vitest";
import { authNav, footerColumns, primaryNav } from "@/data/navigation";

const storeRoutes = ["/", "/shop", "/about", "/contact", "/cart"];

describe("site navigation", () => {
  it("offers only the store pages in the primary menu", () => {
    expect(primaryNav.map((link) => link.href)).toEqual(["/", "/shop", "/about", "/contact"]);
  });

  it("offers a clear login action in the site navigation", () => {
    expect(authNav).toEqual({ label: "Log in", href: "/login" });
  });

  it("links only to store routes from the footer", () => {
    const hrefs = footerColumns.flatMap((column) => column.links.map((link) => link.href));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(storeRoutes).toContain(href);
  });
});
