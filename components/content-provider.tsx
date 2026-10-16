"use client";
import { createContext, useContext } from "react";
import { journalPosts } from "@/data/journal";
import type { PublicContent } from "@/lib/content";
import { PAGE_IMAGES, CONTENT_PAGES, replaceText } from "@/lib/content-fields";
import type { Language } from "@/lib/i18n";

const ContentContext = createContext<PublicContent>({ pages: {}, posts: journalPosts });
const PathContext = createContext("");
export function ContentScope({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  return <PathContext.Provider value={pathname}>{children}</PathContext.Provider>;
}
export function ContentProvider({ content, children }: { content: PublicContent; children: React.ReactNode }) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}
export const useContent = () => useContext(ContentContext);
export function usePageCopy<T>(page: string, lang: Language, defaults: T): T {
  return replaceText(defaults, useContent().pages[page]?.[lang] ?? {}, "copy");
}
export function useContentImage(src: string) {
  const pathname = useContext(PathContext);
  const content = useContent();
  const page = ["/signup", "/forgot-password", "/reset-password"].includes(pathname) ? "auth"
    : CONTENT_PAGES.find((item) => item.path === pathname)?.id;
  const field = page && Object.entries(PAGE_IMAGES[page] ?? {}).find(([, original]) => original === src)?.[0];
  return page && field ? content.pages[page]?.en[field] ?? src : src;
}
