import { describe, expect, it } from "vitest";

import {
  collectionSchema,
  csvCell,
  discountSchema,
  isoToLocalDateTime,
  localDateTimeToIso,
  orderUpdateSchema,
  parseList,
  parseMoney,
  productFormValues,
  productSchema,
  slugify,
  stockField,
  variantCombos,
} from "@/lib/store-admin-validation";
import { isAllowedProductImage, productFromRow, type ProductRow } from "@/lib/store-mapping";

const supabaseUrl = "https://abcd.supabase.co";

function productForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  const values: Record<string, string> = {
    name: "Night Watch Cap",
    slug: "",
    status: "active",
    category: "Headwear",
    badge: "NEW",
    position: "2",
    price: "4,900",
    description: "Structured five-panel cap with a forest mark.",
    fabric: "Cotton twill",
    care: "Spot clean\n\nAir dry",
    siDescription: "",
    siFabric: "",
    siCare: "",
    sizes: "S, M, m, ",
    colors: "Black",
    [stockField("S", "Black")]: "3",
    [stockField("M", "Black")]: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

describe("store form rules", () => {
  it("turns names into web addresses", () => {
    expect(slugify("  After Dark Hoodie!! ")).toBe("after-dark-hoodie");
    expect(slugify("Café 2026 / Drop")).toBe("cafe-2026-drop");
  });

  it("reads rupee amounts into cents and rejects anything else", () => {
    expect(parseMoney("6900")).toBe(690000);
    expect(parseMoney("6,900.5")).toBe(690050);
    expect(parseMoney("0.99")).toBe(99);
    expect(parseMoney("-5")).toBeNull();
    expect(parseMoney("12.345")).toBeNull();
    expect(parseMoney("1e5")).toBeNull();
    expect(parseMoney("20000000")).toBeNull();
  });

  it("keeps list entries unique and trimmed", () => {
    expect(parseList(" S, m ,M,, L ")).toEqual(["S", "m", "L"]);
  });

  it("builds one variant per size and colour, or a single one", () => {
    expect(variantCombos(["S", "M"], ["Black"])).toEqual([{ size: "S", color: "Black" }, { size: "M", color: "Black" }]);
    expect(variantCombos([], [])).toEqual([{ size: "", color: "" }]);
  });

  it("parses the product form, deriving the address and stock", () => {
    const parsed = productSchema.safeParse(productFormValues(productForm()));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.slug).toBe("night-watch-cap");
    expect(parsed.data.price).toBe(490000);
    expect(parsed.data.comingSoon).toBe(false);
    expect(parsed.data.care).toEqual(["Spot clean", "Air dry"]);
    expect(parsed.data.siDescription).toBeNull();
    expect(parsed.data.variants).toEqual([
      { size: "S", color: "Black", inventory: 3 },
      { size: "M", color: "Black", inventory: 0 },
    ]);
  });

  it("rejects bad product input", () => {
    const cases: Record<string, string>[] = [
      { price: "free" },
      { slug: "Bad Slug" },
      { status: "published" },
      { badge: "HOT" },
      { [stockField("S", "Black")]: "-1" },
      { description: "short" },
    ];
    for (const overrides of cases) {
      expect(productSchema.safeParse(productFormValues(productForm(overrides))).success, JSON.stringify(overrides)).toBe(false);
    }
  });

  it("checks collections", () => {
    const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
    const parsed = collectionSchema.safeParse({ name: "Night Drop", slug: "night-drop", description: "", active: true, productIds: [id, id] });
    expect(parsed.success && parsed.data.productIds).toEqual([id]);
    expect(collectionSchema.safeParse({ name: "X", slug: "x", description: "", active: true, productIds: [] }).success).toBe(false);
    expect(collectionSchema.safeParse({ name: "Drop", slug: "drop", description: "", active: true, productIds: ["1; drop table"] }).success).toBe(false);
  });

  it("checks discount codes by type", () => {
    const base = { code: "night-10", kind: "percent", value: "10", startsAt: "", endsAt: "", usageLimit: "", active: true };
    const percent = discountSchema.safeParse(base);
    expect(percent.success && percent.data).toMatchObject({ code: "NIGHT-10", value: 10, usageLimit: null, startsAt: null });

    const fixed = discountSchema.safeParse({ ...base, kind: "fixed", value: "500", usageLimit: "50" });
    expect(fixed.success && fixed.data).toMatchObject({ value: 50000, usageLimit: 50 });

    expect(discountSchema.safeParse({ ...base, value: "150" }).success).toBe(false);
    expect(discountSchema.safeParse({ ...base, code: "no spaces" }).success).toBe(false);
    expect(discountSchema.safeParse({ ...base, usageLimit: "0" }).success).toBe(false);
    expect(discountSchema.safeParse({ ...base, startsAt: "2026-10-02T10:00", endsAt: "2026-10-01T10:00" }).success).toBe(false);
  });

  it("reads dates as Sri Lanka time both ways", () => {
    expect(localDateTimeToIso("2026-10-01T10:30")).toBe("2026-10-01T05:00:00.000Z");
    expect(localDateTimeToIso("")).toBeNull();
    expect(localDateTimeToIso("tomorrow")).toBeUndefined();
    expect(isoToLocalDateTime("2026-10-01T05:00:00.000Z")).toBe("2026-10-01T10:30");
  });

  it("accepts only known order statuses", () => {
    expect(orderUpdateSchema.safeParse({ publicId: "BRK-1001", status: "fulfilled", trackingNumber: "", adminNote: "" }).success).toBe(true);
    expect(orderUpdateSchema.safeParse({ publicId: "BRK-1001", status: "shipped", trackingNumber: "", adminNote: "" }).success).toBe(false);
  });

  it("stops spreadsheet formulas in exported cells", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+94771234567")).toBe("'+94771234567");
    expect(csvCell("plain@example.com")).toBe("plain@example.com");
    expect(csvCell("a,b")).toBe("\"a,b\"");
  });
});

describe("store catalog mapping", () => {
  const row: ProductRow = {
    id: "e84d8668-35d5-47fb-bd50-01f35da3ac83",
    slug: "unknown-mark-tee",
    name: "Unknown Mark Tee",
    description: "Washed-black heavyweight tee.",
    currency: "lkr",
    price_minor: 690000,
    fabric: "Cotton",
    care: ["Cold wash", 3],
    category: "Apparel",
    badge: "NEW",
    coming_soon: true,
    si_description: "ටී-ෂර්ට්",
    si_fabric: null,
    si_care: ["සෝදන්න"],
    product_variants: [
      { size: "S", color: "Black", inventory: 2, active: true },
      { size: "M", color: "Black", inventory: 5, active: true },
      { size: "XL", color: "Black", inventory: 9, active: false },
    ],
    product_images: [
      { url: `${supabaseUrl}/storage/v1/object/public/product-images/a/2.webp`, alt_text: "Back", position: 1 },
      { url: "/images/products/unknown-mark-tee.png", alt_text: "Front", position: 0 },
      { url: "https://evil.example/x.png", alt_text: "Bad", position: 2 },
    ],
  };

  it("maps active variants, allowed photos, and Sinhala copy", () => {
    const product = productFromRow(row, supabaseUrl);
    expect(product.sizes).toEqual(["S", "M"]);
    expect(product.colors).toEqual(["Black"]);
    expect(product.stock).toBe(7);
    expect(product.currency).toBe("LKR");
    expect(product.care).toEqual(["Cold wash"]);
    expect(product.images).toEqual(["/images/products/unknown-mark-tee.png", `${supabaseUrl}/storage/v1/object/public/product-images/a/2.webp`]);
    expect(product.preview).toBe(true);
    expect(product.si).toEqual({ description: "ටී-ෂර්ට්", fabric: "Cotton", care: ["සෝදන්න"] });
  });

  it("only shows photos from this site or its own storage bucket", () => {
    expect(isAllowedProductImage("/images/products/a.png", undefined)).toBe(true);
    expect(isAllowedProductImage("/images/../secret", undefined)).toBe(false);
    expect(isAllowedProductImage(`${supabaseUrl}/storage/v1/object/public/avatars/a.webp`, supabaseUrl)).toBe(false);
    expect(isAllowedProductImage("https://abcd.supabase.co.evil.example/storage/v1/object/public/product-images/a.webp", supabaseUrl)).toBe(false);
    expect(isAllowedProductImage("javascript:alert(1)", supabaseUrl)).toBe(false);
  });
});
