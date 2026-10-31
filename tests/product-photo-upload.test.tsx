import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { products } from "@/data/products";
import { translations } from "@/lib/i18n";

const mocks = vi.hoisted(() => ({ save: vi.fn(), upload: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }), usePathname: () => "/admin/products/new" }));
vi.mock("@/app/admin/store-actions", () => ({ saveProductAction: mocks.save, uploadProductImageAction: mocks.upload, saveProductSectionAction: vi.fn(), deleteProductAction: vi.fn(), deleteProductImageAction: vi.fn(), moveProductImageAction: vi.fn(), updateProductImageAltAction: vi.fn() }));
vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ t: translations.en, lang: "en", setLang: vi.fn() }) }));
vi.mock("@/components/currency-provider", () => ({ useCurrency: () => ({ usdRate: null }) }));

import { ProductForm } from "@/components/control-room/product-form";
import { ProductPhotos } from "@/components/control-room/product-photos";
import { MAX_PRODUCT_IMAGES } from "@/lib/store-admin-validation";
import { moveInList, photoError, photoRole, saveProductWithPhotos } from "@/lib/product-photo-upload";

const t = translations.en;
const idle = { status: "idle" as const, message: "" };
const photo = (name: string) => new File(["x"], name, { type: "image/webp" });
const adminImage = (id: string, position: number) => ({ id, url: `/images/products/${id}.webp`, altText: id, position });

beforeEach(() => vi.clearAllMocks());

describe("photo rules", () => {
  it("names what the first two photos do on a product card", () => {
    expect(photoRole(0)).toBe("crsBeforeHoverPhoto");
    expect(photoRole(1)).toBe("crsHoverPhoto");
    expect(photoRole(2)).toBeNull();
  });

  it("rejects the wrong file type and oversized files before any upload", () => {
    expect(photoError(new File(["x"], "a.gif", { type: "image/gif" }))).toContain("PNG, JPEG, or WebP");
    expect(photoError({ type: "image/png", size: 11 * 1024 * 1024 } as File)).toContain("too large");
    expect(photoError(photo("a.webp"))).toBeNull();
  });

  it("moves a photo and leaves the list alone at either end", () => {
    expect(moveInList(["a", "b", "c"], 1, "up")).toEqual(["b", "a", "c"]);
    expect(moveInList(["a", "b", "c"], 1, "down")).toEqual(["a", "c", "b"]);
    expect(moveInList(["a", "b"], 0, "up")).toEqual(["a", "b"]);
    expect(moveInList(["a", "b"], 1, "down")).toEqual(["a", "b"]);
  });
});

describe("creating a product with photos", () => {
  it("keeps the normal redirect when no photos were chosen", async () => {
    mocks.save.mockResolvedValue(idle);
    const form = new FormData();
    await saveProductWithPhotos(idle, form, [], mocks.push);
    expect(form.has("deferRedirect")).toBe(false);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("uploads photos in the chosen order, then opens the product", async () => {
    mocks.save.mockResolvedValue({ status: "success", message: "Product saved.", productId: "p1" });
    mocks.upload.mockResolvedValue({ status: "success", message: "Photo added." });
    const form = new FormData();
    const reply = await saveProductWithPhotos(idle, form, [photo("model.webp"), photo("shirt.webp")], mocks.push);
    expect(form.get("deferRedirect")).toBe("1");
    const sent = mocks.upload.mock.calls.map(([, data]) => [data.get("productId"), (data.get("photo") as File).name]);
    expect(sent).toEqual([["p1", "model.webp"], ["p1", "shirt.webp"]]);
    expect(mocks.push).toHaveBeenCalledWith("/admin/products/p1?created=1");
    expect(reply.status).toBe("success");
  });

  it("still opens the product and says so when a photo fails, keeping the order of the rest", async () => {
    mocks.save.mockResolvedValue({ status: "success", message: "Product saved.", productId: "p1" });
    mocks.upload.mockResolvedValueOnce({ status: "error", message: "nope" }).mockResolvedValue({ status: "success", message: "ok" });
    const reply = await saveProductWithPhotos(idle, new FormData(), [photo("a.webp"), photo("b.webp")], mocks.push);
    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.push).toHaveBeenCalledWith("/admin/products/p1?created=1");
    expect(reply.message).toContain("1 photo");
  });

  it("uploads nothing when the product could not be saved, or in preview mode", async () => {
    mocks.save.mockResolvedValue({ status: "error", message: "Check the form." });
    expect((await saveProductWithPhotos(idle, new FormData(), [photo("a.webp")], mocks.push)).status).toBe("error");
    mocks.save.mockResolvedValue({ status: "success", message: "Preview mode. Changes are not saved." });
    await saveProductWithPhotos(idle, new FormData(), [photo("a.webp")], mocks.push);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("offers photos on the new product form, without sending files with the details", () => {
    const html = renderToStaticMarkup(<ProductForm product={null} canManage />);
    expect(html).toContain(t.crsAddPhotos);
    expect(html).toContain(t.crsPhotosDesc);
    expect(html).toMatch(/<input[^>]*type="file"/);
    expect(html.match(/<input[^>]*type="file"[^>]*>/)?.[0]).not.toContain("name=");
    expect(t.crsNewProductDesc.toLowerCase()).not.toContain("once the product exists");
    expect(MAX_PRODUCT_IMAGES).toBe(8);
  });
});

describe("product photo labels", () => {
  it("marks the before-hover and on-hover photos", () => {
    const html = renderToStaticMarkup(<ProductPhotos productId="p1" images={[adminImage("a", 0), adminImage("b", 1), adminImage("c", 2)]} canManage />);
    expect(html).toContain(t.crsBeforeHoverPhoto);
    expect(html).toContain(t.crsHoverPhoto);
    expect(html).not.toContain(t.crsNoHoverPhoto);
  });

  it("tells staff when a product has no hover photo", () => {
    const html = renderToStaticMarkup(<ProductPhotos productId="p1" images={[adminImage("a", 0)]} canManage />);
    expect(html).toContain(t.crsNoHoverPhoto);
    for (const key of ["crsBeforeHoverPhoto", "crsHoverPhoto", "crsNoHoverPhoto"] as const) expect(translations.si[key]).not.toBe(t[key]);
  });
});

describe("model photos for the launch products", () => {
  const file = readdirSync(resolve(process.cwd(), "supabase/migrations")).find((name) => name.endsWith("_bundled_model_photos.sql"));
  const sql = file ? readFileSync(resolve(process.cwd(), "supabase/migrations", file), "utf8") : "";

  it("saves each product's model photo first, using files that exist", () => {
    for (const product of products) {
      expect(sql).toContain(`('${product.slug}', '${product.images[0]}')`);
      expect(existsSync(resolve(process.cwd(), "public", product.images[0].slice(1)))).toBe(true);
    }
  });

  it("only touches unchanged launch art and can run twice", () => {
    expect(sql).toContain("'/images/products/' || p.slug || '.webp'");
    expect(sql).toMatch(/NOT EXISTS/);
    expect(sql).toMatch(/position = position \+ 1/);
  });
});
