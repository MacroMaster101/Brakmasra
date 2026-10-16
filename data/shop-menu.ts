import type { Product } from "@/data/products";

export const shopCategories = [
  { id: "tees", labelKey: "storeTees", group: "clothing" },
  { id: "hoodies", labelKey: "storeHoodies", group: "clothing" },
  { id: "sweatshirts", labelKey: "storeSweatshirts", group: "clothing" },
  { id: "headwear", labelKey: "storeHeadwear", group: "accessories" },
  { id: "bags", labelKey: "storeBags", group: "accessories" },
] as const;
export type ShopCategory = (typeof shopCategories)[number]["id"];

/** Shared by the menu and shop so an available category opens matching items. */
export function matchesShopCategory(product: Product, category: string): boolean {
  if (category === "headwear") return product.category === "Headwear";
  const name = product.name.toLowerCase();
  if (category === "tees") return /\b(tees?|t[ -]?shirts?)\b/.test(name);
  if (category === "hoodies") return /\bhoodies?\b/.test(name);
  if (category === "sweatshirts") return /\bsweatshirts?\b/.test(name);
  if (category === "bags") return /\b(bags?|totes?|backpacks?)\b/.test(name);
  return false;
}

export type ShopMenu = {
  searchItems: Pick<Product, "slug" | "name" | "description" | "images" | "featured">[];
  categories: { id: ShopCategory; href: string; available: boolean }[];
  cards: { color: "black" | "white"; image: string; href: string | null }[];
};

export function buildShopMenu(catalog: Product[]): ShopMenu {
  const tees = catalog.filter((product) => matchesShopCategory(product, "tees"));
  return {
    searchItems: catalog.map(({ slug, name, description, images, featured }) => ({ slug, name, description, images: images.slice(0, 1), featured })),
    categories: shopCategories.map(({ id }) => ({
      id,
      href: `/shop?category=${id}`,
      available: catalog.some((product) => matchesShopCategory(product, id)),
    })),
    cards: (["black", "white"] as const).map((color) => {
      const matching = tees.filter((product) => product.colors.some((value) => value.toLowerCase().includes(color)));
      const preferred = color === "black" ? "caged-freedom-tee" : "paradise-lost-tee";
      const photographed = matching.find((product) => product.slug === preferred && product.images[0])
        ?? matching.find((product) => product.images[0]);
      return {
        color,
        image: photographed?.images[0] ?? `/images/models/${color === "black" ? "caged-freedom" : "paradise-lost"}.webp`,
        href: matching.length ? `/shop?category=tees&color=${color}` : null,
      };
    }),
  };
}
