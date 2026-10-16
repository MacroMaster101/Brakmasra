import { notFound } from "next/navigation";
import { JournalArticle } from "@/components/journal-view";
import { journalPosts } from "@/data/journal";
import { getPublicContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return journalPosts.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props) {
  const slug = (await params).slug;
  const post = (await getPublicContent()).posts.find((item) => item.slug === slug);
  if (!post) notFound();
  return pageMetadata({ title: post.copy.en.title, description: post.copy.en.excerpt, path: `/blog/${post.slug}`, images: [post.image] });
}

export default async function BlogArticlePage({ params }: Props) {
  const slug = (await params).slug;
  const post = (await getPublicContent()).posts.find((item) => item.slug === slug);
  if (!post) notFound();
  return <JournalArticle post={post} />;
}
