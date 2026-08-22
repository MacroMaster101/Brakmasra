import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Play, ShoppingBag } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { VideoCard } from "@/components/video-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { getYouTubeData } from "@/lib/youtube";
import { products } from "@/data/products";
import { shorts } from "@/data/channel";

export default async function Home() {
  const { channel, videos, source } = await getYouTubeData();
  const latest = videos[0];
  const jsonLd = { "@context": "https://schema.org", "@type": "Organization", name: channel.name, url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", sameAs: [channel.url], description: channel.description };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="hero">
        <Image className="hero-image" src="/images/brakmasra-hero.png" alt="Moonlit abandoned manor surrounded by tropical forest and fog" fill priority sizes="100vw" />
        <div className="hero-overlay" />
        <div className="hero-content page-shell">
          <span className="hero-kicker">HORROR <i /> STORIES <i /> MYSTERY</span>
          <h1>BRAK<span>MASRA</span></h1>
          <p>{channel.description}</p>
          <div className="button-row"><Link className="button button-primary" href={`/videos/${latest.id}`}><Play fill="currentColor" />Watch latest video</Link><Link className="button button-secondary" href="/shop"><ShoppingBag />Shop merch</Link></div>
        </div>
        <div className="stats" aria-label="Channel statistics">
          <div><strong>{channel.subscribers}</strong><span>Subscribers</span></div><div><strong>{channel.videoCount}</strong><span>Videos</span></div><div><strong>{channel.totalViews || "—"}</strong><span>Total views</span></div>
        </div>
      </section>

      <section className="section page-shell"><SectionTitle eyebrow="Latest investigation" title="The newest encounter" />
        <article className="feature-video">
          <Link href={`/videos/${latest.id}`} className="feature-thumb"><Image src={`https://i.ytimg.com/vi/${latest.id}/maxresdefault.jpg`} alt="" fill sizes="(max-width: 800px) 100vw, 58vw" /><span className="play large"><Play fill="currentColor" /></span><span className="duration">{latest.duration}</span></Link>
          <div className="feature-copy"><span className="eyebrow">Recent upload</span><h2>{latest.title}</h2><p>{latest.views} · {latest.published}</p><p>Continue the latest BRAKMASRA investigation and watch the full encounter on the official channel.</p><a className="text-link" href={`https://www.youtube.com/watch?v=${latest.id}`} target="_blank" rel="noreferrer">Watch on YouTube <ExternalLink /></a></div>
        </article>
      </section>

      <section className="section section-alt"><div className="page-shell"><div className="section-row"><SectionTitle eyebrow="From the archive" title="More horror stories" /><Link className="text-link" href="/videos">View all <ArrowRight /></Link></div><div className="card-grid">{videos.slice(1, 7).map((video) => <VideoCard key={video.id} video={video} />)}</div><p className="data-note">Channel data: {source === "api" ? "live YouTube API" : `verified public snapshot · ${channel.snapshotDate}`}</p></div></section>

      <section className="section page-shell"><div className="section-row"><SectionTitle eyebrow="Wear the mark" title="Official merch" /><Link className="text-link" href="/shop">Enter the store <ArrowRight /></Link></div>{products.length ? <div className="card-grid" /> : <div className="empty-state merch-empty"><ShoppingBag /><h3>The first drop is being prepared</h3><p>No products are published yet. Real items, photography, prices, and inventory will appear here once verified by the owner.</p><Link className="button button-secondary" href="/shop">Visit the shop</Link></div>}</section>

      <section className="section section-alt"><div className="page-shell"><div className="section-row"><SectionTitle eyebrow="Brief encounters" title="Latest shorts" /><Link className="text-link" href="/shorts">View shorts <ArrowRight /></Link></div><div className="shorts-row">{shorts.slice(0, 2).map((video) => <VideoCard key={video.id} video={video} vertical />)}</div></div></section>

      <section className="section about-strip"><div className="page-shell split"><div><SectionTitle eyebrow="Beyond the light" title="About BRAKMASRA" /><p>Join BRAKMASRA on mysterious road trips, exploration videos, and ghost hunts—from abandoned locations to places known for paranormal stories.</p><Link className="button button-secondary" href="/about">Enter the story</Link></div><blockquote>“Subscribe to travel with us and explore the unknown.”<cite>— BRAKMASRA channel description</cite></blockquote></div></section>

      <section className="newsletter"><div className="page-shell newsletter-inner"><SectionTitle eyebrow="Community transmissions" title="Join the darkness" copy="Be first to hear about new investigations and verified merch drops. No false urgency. No noise." /><NewsletterForm /></div></section>
    </>
  );
}
