export type ProductCategory = "Apparel" | "Headwear";

/** Customer-facing copy that changes with the page language. */
export type ProductCopy = {
  description: string;
  fabric: string;
  care: string[];
};

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
  /** Picked in the Control Room to appear on the home page. */
  featured?: boolean;
  /** Sinhala copy; the English fields above remain the canonical record. */
  si?: ProductCopy;
};

type TeeDetails = Pick<Product, "id" | "slug" | "name" | "description"> & {
  color: string;
  siDescription: string;
};

/** Every graphic tee shares its price, sizing, fabric, care, and stock. */
function tee({ color, siDescription, ...details }: TeeDetails): Product {
  return {
    ...details,
    price: 690000,
    currency: "LKR",
    images: [`/images/products/${details.slug}.webp`],
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: [color],
    fabric: "Cotton jersey",
    care: ["Cold wash inside out", "Line dry", "Do not iron the print"],
    stock: 25,
    category: "Apparel",
    badge: "NEW",
    si: {
      description: siDescription,
      fabric: "කපු ජර්සි රෙදි",
      care: ["ඇතුළත පිටතට හරවා සීතල ජලයෙන් සෝදන්න", "වැලක එල්ලා වියළන්න", "මුද්‍රණය මත ස්ත්‍රික්ක නොකරන්න"],
    },
  };
}

/**
 * The launch collection. The shop shows these until products exist in the
 * database; the Control Room's import copies them there once.
 */
export const products: Product[] = [
  tee({
    id: "32149a77-c59f-4ee3-a45d-931fdd3ea0f0",
    slug: "caged-freedom-tee",
    name: "Caged Freedom Tee",
    color: "Washed black",
    description: "Oversized washed-black tee with a blindfolded, chain-bound nun, blackletter “Caged Freedom” artwork, and a verse about breaking the chains we cannot see.",
    siDescription: "නොපෙනෙන දම්වැල් බිඳ දැමීම ගැන වදනක් සහිත, ඇස් බැඳි, දම්වැල්වලින් වෙළුණු කන්‍යා සොහොයුරියකගේ “Caged Freedom” චිත්‍රයක් ඇති, සේදූ කළු පැහැති ඕවර්සයිස් ටී-ෂර්ට් එකක්.",
  }),
  tee({
    id: "d31e26d2-8125-49c4-bbb6-5cdacc1f401e",
    slug: "look-for-the-light-tee",
    name: "Look for the Light Tee",
    color: "White",
    description: "Oversized white tee with a fiery, cinematic survival-story collage and the line “When you’re lost in the darkness, look for the light.”",
    siDescription: "“When you’re lost in the darkness, look for the light” යන වදන සහ ගිනිගත් සිනමාත්මක කොලාජ් චිත්‍රයක් සහිත සුදු ඕවර්සයිස් ටී-ෂර්ට් එකක්.",
  }),
  tee({
    id: "df528a8d-1b81-46eb-a2f0-2dbae058b3a7",
    slug: "silent-faith-tee",
    name: "Silent Faith Tee",
    color: "Washed black",
    description: "Oversized washed-black tee with a hushing marble statue, glowing pink eyes, “Faith” and rose tattoos, and a Latin verse beneath.",
    siDescription: "රෝස පැහැයෙන් දිලෙන දෑස්, “Faith” සහ රෝස මල් පච්ච සහිත, නිහඬ වන්නැයි සංඥා කරන කිරිගරුඬ ප්‍රතිමාවක් සහ ලතින් වදනක් ඇති, සේදූ කළු පැහැති ඕවර්සයිස් ටී-ෂර්ට් එකක්.",
  }),
  tee({
    id: "174b4bce-e028-42c5-ac31-7347c5ec69ed",
    slug: "paradise-lost-tee",
    name: "Paradise Lost Tee",
    color: "White",
    description: "Oversized white tee with a cracked marble bust, a red rose, and a torn-poster collage under a brush-script “Paradise Lost” headline.",
    siDescription: "පින්සලෙන් ලියූ “Paradise Lost” මාතෘකාවක් යටතේ, ඉරිතැලුණු කිරිගරුඬ ප්‍රතිමාවක්, රතු රෝස මලක් සහ ඉරුණු පෝස්ටර් කොලාජ් චිත්‍රයක් සහිත සුදු ඕවර්සයිස් ටී-ෂර්ට් එකක්.",
  }),
  tee({
    id: "2479dd44-adae-4475-896a-92822f0a01d6",
    slug: "vigorous-archangel-tee",
    name: "Vigorous Archangel Tee",
    color: "White",
    description: "Oversized white tee with a sword-wielding archangel statue framed by bold red “Vigorous” type and “Celestial Grace” details.",
    siDescription: "තද රතු “Vigorous” අකුරු සහ “Celestial Grace” විස්තර මැද, කඩුවක් දරන අග්‍ර දේවදූත ප්‍රතිමාවක් සහිත සුදු ඕවර්සයිස් ටී-ෂර්ට් එකක්.",
  }),
  tee({
    id: "fbc4699c-e080-4616-849e-3e4bd0c66524",
    slug: "naga-guard-tee",
    name: "Naga Guard Tee",
    color: "White",
    description: "Oversized white tee with an ornate mythical Naga serpent coiled through red slashes and graffiti “Naga Guards” tags.",
    siDescription: "රතු ඉරි සහ “Naga Guards” ග්‍රැෆිටි අකුරු හරහා දඟර ගැසුණු, අලංකාර කැටයම් සහිත මිථ්‍යා නාගයෙකුගේ චිත්‍රයක් ඇති සුදු ඕවර්සයිස් ටී-ෂර්ට් එකක්.",
  }),
  tee({
    id: "bc85b61f-91b2-466c-9ec7-2e7930626ed8",
    slug: "intoxicated-medusa-tee",
    name: "Intoxicated Medusa Tee",
    color: "Washed black",
    description: "Oversized washed-black tee with a cracked stone Medusa crowned in vivid green serpents above blackletter “Intoxicated” type.",
    siDescription: "දීප්තිමත් කොළ පැහැ සර්පයින්ගෙන් ඔටුනු පැළඳි, ඉරිතැලුණු ගල් මෙඩූසා හිසක් සහ “Intoxicated” අකුරු සහිත, සේදූ කළු පැහැති ඕවර්සයිස් ටී-ෂර්ට් එකක්.",
  }),
  tee({
    id: "30cededa-9c76-4ff1-8bdb-a7b31fde514b",
    slug: "ruthless-tee",
    name: "Ruthless Tee",
    color: "Black",
    description: "Oversized black tee with a skeletal ribcage wound by a teal serpent under a “Ruthless” headline.",
    siDescription: "“Ruthless” මාතෘකාව යටතේ, නිල්-කොළ පැහැ සර්පයෙකු වෙළී ඇති ඇටසැකිලි ඉළ ඇට කූඩුවක චිත්‍රයක් සහිත කළු ඕවර්සයිස් ටී-ෂර්ට් එකක්.",
  }),
  tee({
    id: "3a65dbb3-5700-48a2-9218-1001147080d7",
    slug: "eternal-watcher-tee",
    name: "Eternal Watcher Tee",
    color: "Washed black",
    description: "Oversized washed-black tee with a blood-red eye gripped by dripping tentacles, “Eternal Watcher” script, and the BRAKMASRA mark.",
    siDescription: "ගලා හැලෙන ස්පර්ශාංගවලින් වෙළුණු ලේ-රතු ඇසක්, “Eternal Watcher” අකුරු සහ BRAKMASRA සලකුණ සහිත, සේදූ කළු පැහැති ඕවර්සයිස් ටී-ෂර්ට් එකක්.",
  }),
];
