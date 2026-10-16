import { JournalView } from "@/components/journal-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Journal", description: "BRAKMASRA stories on personal style, graphic artwork, and caring for your favourite tees.", path: "/blog",
  images: ["/images/about/courtyard-campaign.webp"],
});

export default function BlogPage() { return <JournalView />; }
