import { aboutCopy } from "@/data/about";
import { contactCopy } from "@/data/contact";
import { journalCopy } from "@/data/journal";
import { legalDocuments } from "@/data/legal";
import { translations, type Language } from "@/lib/i18n";

export const CONTENT_PAGES = [
  { id: "home", name: "Home & collection", path: "/", prefixes: ["store", "home", "newsletter"] },
  { id: "about", name: "About & channel", path: "/about", prefixes: ["about"] },
  { id: "contact", name: "Contact", path: "/contact", prefixes: ["contact"] },
  { id: "journal", name: "Journal", path: "/blog", prefixes: [] },
  { id: "shop", name: "Shop & products", path: "/shop", prefixes: ["shop", "product", "wishlist", "cart", "checkout"] },
  { id: "auth", name: "Sign in & account", path: "/login", prefixes: ["login", "signup", "register", "forgot", "reset", "auth", "account", "password", "email", "profile"] },
  { id: "terms", name: "Terms of service", path: "/terms", prefixes: ["terms"] },
  { id: "privacy", name: "Privacy policy", path: "/privacy", prefixes: ["privacy"] },
  { id: "shared", name: "Navigation & shared text", path: "/", prefixes: [] },
] as const;
export type ContentPageId = (typeof CONTENT_PAGES)[number]["id"];
export type CopyValues = Record<Language, Record<string, string>>;
export const PAGE_IMAGES: Partial<Record<ContentPageId, Record<string, string>>> = {
  home: { "image.hero": "/images/campaign/wide-cutout.webp", "image.blackCampaign": "/images/campaign/black-cutout.webp", "image.whiteCampaign": "/images/campaign/white-cutout.webp" },
  about: { "image.hero": "/images/campaign/wide-cutout.webp", "image.portrait": "/images/about/paradise-courtyard.webp", "image.detail": "/images/about/graphic-still-life.webp" },
  contact: { "image.detail": "/images/about/graphic-still-life.webp" },
  auth: { "image.login": "/images/auth/members-paradise-cutout.webp", "image.register": "/images/auth/members-medusa-cutout.webp" },
};

export function flattenText(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) =>
    Object.entries(flattenText(item, prefix ? `${prefix}.${key}` : key))));
}

/** Only existing string leaves can be replaced. No HTML, functions, or object paths are created. */
export function replaceText<T>(value: T, edits: Record<string, string>, prefix = ""): T {
  if (typeof value === "string") return (edits[prefix] ?? value) as T;
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item, index) => replaceText(item, edits, prefix ? `${prefix}.${index}` : String(index))) as T;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceText(item, edits, prefix ? `${prefix}.${key}` : key)])) as T;
}

function groupFor(key: string): ContentPageId {
  return CONTENT_PAGES.find((page) => page.prefixes.some((prefix) => key.toLowerCase().startsWith(prefix)))?.id ?? "shared";
}

export function pageDefaults(id: ContentPageId): CopyValues {
  const values = (lang: Language) => {
    const strings = Object.fromEntries(Object.entries(translations[lang])
      .filter(([key, value]) => typeof value === "string" && !key.startsWith("cr") && groupFor(key) === id)
      .map(([key, value]) => [`text.${key}`, value as string]));
    if (id === "about") Object.assign(strings, flattenText(aboutCopy[lang], "copy"));
    if (id === "contact") Object.assign(strings, flattenText(contactCopy[lang], "copy"));
    if (id === "journal") Object.assign(strings, flattenText(journalCopy[lang], "copy"));
    if (id === "terms" || id === "privacy") Object.assign(strings, Object.fromEntries(Object.entries(flattenText(legalDocuments[id][lang], "copy")).filter(([key]) => !/\.(id|type)$/.test(key))));
    Object.assign(strings, PAGE_IMAGES[id]);
    return strings;
  };
  return { en: values("en"), si: values("si") };
}

export const pageDefinition = (id: string) => CONTENT_PAGES.find((page) => page.id === id);
export function fieldLabel(key: string) {
  const label = key.replace(/^(text|copy)\./, "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\./g, " · ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Stable editing groups derived from existing field keys, never arbitrary object paths. */
export function pageFieldGroup(field: string) {
  if (field.startsWith("image.")) return "Images";
  if (field.startsWith("copy.")) return field.split(".").slice(0, 2).join(".");
  const key = field.replace(/^text\./, "");
  if (key.startsWith("store")) {
    const groups: [string, RegExp][] = [
      ["Currency & preferences", /^store(?:Currency|Lkr|Usd|Exchange|LightTheme|DarkTheme)/],
      ["Hero carousel", /^store(?:Campaign|Second|NextSlide|PrevSlide|PauseSlides|PlaySlides|Collection$)/],
      ["Reviews", /^store(?:Testimonials|Sample|Review)/],
      ["Search & quick view", /^store(?:RecentSearch|ClearHistory|NoSearchHistory|Search|QuickView|ViewDetails|Close$|ViewAll$)/],
      ["Wishlist", /^store(?:Saved$|Wishlist|Save$|Unsave|EmptySaved)/],
      ["Footer", /^store(?:Information|QuickShop|CustomerServices|Footer|Payment|Subscribe)/],
      ["Collection categories & filters", /^store(?:NewArrivals|AllTees|Clothing|Accessories|Tees|Hoodies|Sweatshirts|Headwear|Bags|BrowseAll|Category|WhileYouWait|ExploreTees|AllCategories|Color|AllColors|ClearFilters|NoFilter|ShopMenu|BlackTees|WhiteTees|Sort|Featured|Name$|Price)/],
      ["Campaign sections", /^store(?:Explore|BlackDesc|WhiteDesc|AllDesc|Editorial|Lookbook)/],
      ["Services", /^store(?:Services|CustomerService|Returns|OriginalDesign|Delivery|Cotton|Fit|Support)/],
    ];
    return groups.find(([, pattern]) => pattern.test(key))?.[0] ?? "Store navigation";
  }
  return key.split(/(?=[A-Z])/).slice(0, key.startsWith("home") ? 2 : 1).join(" ");
}
export function mergePageSection(id: ContentPageId, baseline: CopyValues, input: unknown, section: string): CopyValues | null {
  const match = /^page:(en|si):(.+)$/.exec(section);
  if (!match || !input || typeof input !== "object") return null;
  const lang = match[1] as Language;
  const keys = Object.keys(pageDefaults(id)[lang]).filter(key => pageFieldGroup(key) === match[2]);
  if (!keys.length) return null;
  const source = input as CopyValues;
  if (!source[lang] || keys.some(key => typeof source[lang][key] !== "string")) return null;
  const result = { en: { ...baseline.en }, si: { ...baseline.si } };
  for (const key of keys) {
    result[lang][key] = source[lang][key];
    if (key.startsWith("image.")) result[lang === "en" ? "si" : "en"][key] = source[lang][key];
  }
  return result;
}
