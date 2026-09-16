export type ProductCategory = "Apparel" | "Headwear";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sizes: string[];
  colors: string[];
  fabric: string;
  care: string[];
  stock: number;
  category?: ProductCategory;
  badge?: "NEW" | "LIMITED" | "BEST SELLER" | "SALE";
  preview?: boolean;
};

/**
 * Upcoming launch collection used by the public coming-soon storefront.
 * Replace these records with verified Supabase products, pricing, and live
 * inventory before commerce is enabled.
 */
export const products: Product[] = [
  {
    id: "e84d8668-35d5-47fb-bd50-01f35da3ac83",
    slug: "unknown-mark-tee",
    name: "Unknown Mark Tee",
    description: "Washed-black heavyweight tee with a distressed forest mark and relaxed drop-shoulder fit.",
    price: 690000,
    currency: "LKR",
    images: ["/images/products/unknown-mark-tee.png"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: ["Washed black"],
    fabric: "Heavyweight cotton jersey",
    care: ["Cold wash inside out", "Line dry", "Do not iron the print"],
    stock: 24,
    category: "Apparel",
    badge: "NEW",
    preview: true,
  },
  {
    id: "c76f064b-462f-4db2-92c7-eaa660df20b8",
    slug: "after-dark-hoodie",
    name: "After Dark Hoodie",
    description: "Oversized washed-black pullover with dense fleece, tonal seams, and a bone-white expedition mark.",
    price: 1250000,
    currency: "LKR",
    images: ["/images/products/after-dark-hoodie.png"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: ["Washed black"],
    fabric: "Heavyweight cotton-blend fleece",
    care: ["Cold wash inside out", "Line dry", "Wash with dark colors"],
    stock: 18,
    category: "Apparel",
    badge: "LIMITED",
    preview: true,
  },
  {
    id: "58027f89-5dc8-42fc-81b5-588b1955f91e",
    slug: "night-watch-cap",
    name: "Night Watch Cap",
    description: "Structured five-panel cap with weathered texture, embroidered forest mark, and adjustable back strap.",
    price: 490000,
    currency: "LKR",
    images: ["/images/products/night-watch-cap.png"],
    sizes: [],
    colors: ["Washed black"],
    fabric: "Brushed cotton twill",
    care: ["Spot clean only", "Air dry", "Do not machine wash"],
    stock: 30,
    category: "Headwear",
    badge: "NEW",
    preview: true,
  },
];
