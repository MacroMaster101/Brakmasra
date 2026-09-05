import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Play, ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { NewsletterForm } from "@/components/newsletter-form";
import { getYouTubeData } from "@/lib/youtube";
import { products } from "@/data/products";
import { shorts } from "@/data/channel";

const shell = "mx-auto w-full max-w-[1240px] px-5 sm:px-6";
const section = "py-[clamp(4.5rem,9vw,8rem)]";
const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-clot bg-transparent px-5 font-mono text-[.72rem] font-semibold uppercase tracking-[.16em] text-bone transition hover:border-blood hover:bg-blood/10";
const arrowLink =
  "inline-flex items-center gap-2 font-mono text-[.72rem] font-semibold uppercase tracking-[.16em] text-bone transition hover:text-ember";

export default async function Home() {
  const { channel, videos } = await getYouTubeData();
  const latest = videos[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: channel.name,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    sameAs: [channel.url],
    description: channel.description,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero — original design (restored) */}
      <section className="hero">
        <Image className="hero-image" src="/images/brakmasra-hero.png" alt="Moonlit abandoned manor surrounded by tropical forest and fog" fill priority sizes="100vw" />
        <div className="hero-overlay" />
        <div className="hero-content page-shell">
          <span className="hero-kicker">HORROR <i /> STORIES <i /> MYSTERY</span>
          <h1>BRAK<span>MASRA</span></h1>
          <p>{channel.description}</p>
          <div className="button-row">
            <Link className="button button-primary" href={`/videos/${latest.id}`}><Play fill="currentColor" />Watch latest video</Link>
            <Link className="button button-secondary" href="/shop"><ShoppingBag />Shop merch</Link>
          </div>
        </div>
        <div className="stats" aria-label="Channel statistics">
          <div><strong>{channel.subscribers}</strong><span>Subscribers</span></div>
          <div><strong>{channel.videoCount}</strong><span>Videos</span></div>
          <div><strong>{channel.totalViews || "—"}</strong><span>Total views</span></div>
        </div>
      </section>

      {/* Latest field record */}
      <section className={`${shell} ${section}`}>
        <Reveal>
          <FieldHeading index="Rec 001" kicker="Latest encounter" title="The newest field record" />
          <article className="mt-8 grid overflow-hidden rounded-2xl border border-edge bg-surface md:grid-cols-[1.5fr_.9fr]">
            <Link href={`/videos/${latest.id}`} className="group relative block min-h-[300px] overflow-hidden bg-[#0b0b0b] md:min-h-[460px]">
              <Image src={`https://i.ytimg.com/vi/${latest.id}/maxresdefault.jpg`} alt="" fill sizes="(max-width:800px) 100vw, 58vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <PlayBadge large />
              <Tag>{latest.duration}</Tag>
            </Link>
            <div className="flex flex-col justify-center gap-3 p-[clamp(1.75rem,4vw,3rem)]">
              <span className="font-mono text-[.68rem] uppercase tracking-[.2em] text-ember">Recent upload · YouTube</span>
              <h3 className="font-serif text-[clamp(1.55rem,3vw,2.4rem)] leading-tight text-bone">{latest.title}</h3>
              <p className="font-mono text-[.75rem] text-smoke">{latest.views} · {latest.published}</p>
              <p className="text-ash">Continue the latest BRAKMASRA investigation and watch the full encounter on the official channel.</p>
              <a className={`${arrowLink} mt-1`} href={`https://www.youtube.com/watch?v=${latest.id}`} target="_blank" rel="noreferrer">Watch on YouTube <ExternalLink size={14} /></a>
            </div>
          </article>
        </Reveal>
      </section>

      {/* From the archive */}
      <section className="border-y border-edge bg-pitch">
        <div className={`${shell} ${section}`}>
          <Reveal>
            <div className="mb-9 flex items-end justify-between gap-6">
              <FieldHeading index="Archive" kicker="From the record" title="More horror stories" />
              <Link className={`${arrowLink} shrink-0`} href="/videos">View all <ArrowRight size={15} /></Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {videos.slice(1, 7).map((video, i) => (
                <VideoTile key={video.id} id={video.id} title={video.title} meta={`${video.views} · ${video.published}`} duration={video.duration} index={String(i + 2).padStart(3, "0")} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Official merch */}
      <section className={`${shell} ${section}`}>
        <Reveal>
          <div className="mb-9 flex items-end justify-between gap-6">
            <FieldHeading index="Store" kicker="Wear the mark" title="Official merch" />
            <Link className={`${arrowLink} shrink-0`} href="/shop">Enter the store <ArrowRight size={15} /></Link>
          </div>
          {products.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" />
          ) : (
            <div className="rounded-3xl border border-edge bg-pitch px-6 py-[clamp(3.5rem,8vw,6.5rem)] text-center" style={{ backgroundImage: "linear-gradient(135deg, rgba(122,0,0,.1), transparent 45%)" }}>
              <ShoppingBag className="mx-auto text-blood" size={38} />
              <h3 className="mt-4 font-serif text-[clamp(1.6rem,4vw,2.4rem)] text-bone">The first drop is being prepared</h3>
              <p className="mx-auto mt-2 max-w-xl text-ash">Official BRAKMASRA merch is on the way. Check back soon for the first drop.</p>
              <Link className={`${secondaryBtn} mt-6`} href="/shop">Visit the shop</Link>
            </div>
          )}
        </Reveal>
      </section>

      {/* Latest shorts */}
      <section className="border-y border-edge bg-pitch">
        <div className={`${shell} ${section}`}>
          <Reveal>
            <div className="mb-9 flex items-end justify-between gap-6">
              <FieldHeading index="Shorts" kicker="Brief encounters" title="Latest shorts" />
              <Link className={`${arrowLink} shrink-0`} href="/shorts">View shorts <ArrowRight size={15} /></Link>
            </div>
            <div className="grid max-w-[680px] grid-cols-2 gap-5">
              {shorts.slice(0, 2).map((video) => (
                <VideoTile key={video.id} id={video.id} title={video.title} meta={video.published} duration={video.duration} vertical />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* About */}
      <section className={`${shell} ${section}`}>
        <Reveal className="grid items-center gap-[clamp(2.5rem,8vw,7rem)] md:grid-cols-2">
          <div>
            <FieldHeading index="Dossier" kicker="Beyond the light" title="About BRAKMASRA" />
            <p className="mt-5 text-ash">Join BRAKMASRA on mysterious road trips, exploration videos, and ghost hunts—from abandoned locations to places known for paranormal stories.</p>
            <Link className={`${secondaryBtn} mt-6`} href="/about">Enter the story</Link>
          </div>
          <blockquote className="rounded-2xl border-l-2 border-blood bg-pitch p-[clamp(1.75rem,4vw,3rem)] font-serif text-[clamp(1.3rem,2.4vw,1.7rem)] italic leading-relaxed text-bone">
            “Subscribe to travel with us and explore the unknown.”
            <cite className="mt-5 block font-mono text-[.66rem] not-italic uppercase tracking-[.16em] text-smoke">— BRAKMASRA channel description</cite>
          </blockquote>
        </Reveal>
      </section>

      {/* Newsletter */}
      <section className="border-y border-edge bg-pitch py-[clamp(4.5rem,8vw,7.5rem)]" style={{ backgroundImage: "radial-gradient(circle at 78% 50%, rgba(122,0,0,.18), transparent 38%)" }}>
        <div className={shell}>
          <Reveal className="grid items-center gap-[clamp(2.5rem,8vw,7rem)] md:grid-cols-2">
            <div>
              <FieldHeading index="Signal" kicker="Community transmissions" title="Join the darkness" />
              <p className="mt-5 text-ash">Be first to hear about new investigations and verified merch drops. No false urgency. No noise.</p>
            </div>
            <NewsletterForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ---- Local presentational helpers (homepage-scoped) ---- */

function FieldHeading({ index, kicker, title }: { index?: string; kicker: string; title: string }) {
  return (
    <div className="max-w-[620px]">
      <div className="flex items-center gap-3 font-mono text-[.7rem] uppercase tracking-[.22em]">
        <span aria-hidden className="h-px w-8 bg-blood" />
        {index && <span className="text-smoke">{index}</span>}
        <span className="text-ember">{kicker}</span>
      </div>
      <h2 className="mt-4 font-serif text-[clamp(2.1rem,5vw,3.6rem)] leading-[1.02] tracking-[-.02em] text-bone">{title}</h2>
    </div>
  );
}

function PlayBadge({ large }: { large?: boolean }) {
  return (
    <span className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-ember bg-ink/80 text-ember transition group-hover:bg-blood group-hover:text-bone group-hover:shadow-[0_0_30px_-6px_var(--color-ember)] ${large ? "size-20" : "size-14"}`}>
      <Play size={large ? 26 : 20} fill="currentColor" />
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="absolute bottom-3 right-3 rounded-full bg-ink/85 px-2.5 py-1 font-mono text-[.7rem] text-ash">{children}</span>;
}

function VideoTile({ id, title, meta, duration, index, vertical }: { id: string; title: string; meta: string; duration: string; index?: string; vertical?: boolean }) {
  return (
    <Link href={`/videos/${id}`} className="group block overflow-hidden rounded-2xl border border-edge bg-surface transition duration-300 hover:-translate-y-1 hover:border-blood hover:shadow-[0_18px_40px_-22px_var(--color-ember)]">
      <div className={`relative overflow-hidden bg-[#080808] ${vertical ? "aspect-[9/16]" : "aspect-video"}`}>
        <Image src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" fill sizes="(max-width:640px) 100vw, (max-width:1050px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        <PlayBadge />
        <Tag>{duration}</Tag>
      </div>
      <div className="p-4">
        <p className="font-mono text-[.66rem] uppercase tracking-[.12em] text-smoke">{index ? `${index} · ` : ""}{meta}</p>
        <h3 className="mt-2 line-clamp-2 font-serif text-[1.05rem] leading-snug text-bone">{title}</h3>
      </div>
    </Link>
  );
}
