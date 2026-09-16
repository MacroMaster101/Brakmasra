import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = { title: "About", description: "The story behind BRAKMASRA and its official merch store.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <div className="page-shell page-top about-page">
      <header className="page-hero about-hero"><span className="eyebrow">The story behind the mark</span><h1>We go where the road gets quiet.</h1><p>BRAKMASRA turns nocturnal exploration into objects you can carry.</p></header>

      <div className="about-collage">
        <Reveal className="about-wide"><Image src="/images/brakmasra-hero.png" alt="Moonlit abandoned manor surrounded by tropical forest and fog" fill loading="eager" sizes="(max-width: 767px) 100vw, 68vw" /></Reveal>
        <Reveal className="about-mark" delay={1}><Image src="/images/brakmasra-logo-reference.png" alt="Original BRAKMASRA haunting artwork" fill sizes="(max-width: 767px) 100vw, 32vw" /></Reveal>
      </div>

      <section className="about-story">
        <Reveal><h2>Curiosity came first.</h2></Reveal>
        <Reveal delay={1}><div><p>BRAKMASRA began with late drives, forgotten buildings, and places shaped by paranormal stories. We document the atmosphere without sanding away what makes it unsettling.</p><p>The store extends that same visual world into restrained apparel and accessories. Every release should feel like part of the journey, not a logo placed on a blank product.</p><Link className="text-link" href="/shop">Explore the collection <ArrowUpRight /></Link></div></Reveal>
      </section>

      <section className="about-belief">
        <Reveal><p>We make for people who still take the long road after dark.</p></Reveal>
      </section>
    </div>
  );
}
