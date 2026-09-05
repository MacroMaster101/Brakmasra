import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { channel, socialLinks } from "@/data/channel";
import { BrandMark, Ornament } from "@/components/icons";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <span className="footer-watermark" aria-hidden>BRAKMASRA</span>

      <div className="footer-shell">
        {/* Closing call to action — the channel's actual goal */}
        <section className="footer-cta">
          <div>
            <span className="footer-cta-eyebrow"><i />Official channel · {channel.handle}</span>
            <h2>Travel with us and explore the unknown.</h2>
          </div>
          <a className="button button-primary" href={`${channel.url}?sub_confirmation=1`} target="_blank" rel="noreferrer">
            <Play fill="currentColor" />Subscribe on YouTube
          </a>
        </section>

        <div className="footer-grid">
          <div className="footer-intro">
            <div className="footer-brand"><BrandMark /><span>BRAKMASRA</span></div>
            <p>Exploring the unknown through mysterious journeys, paranormal investigations, and haunted places.</p>
            <Ornament className="footer-ornament" />
            <div className="footer-social">
              <a href={channel.url} target="_blank" rel="noreferrer">YouTube <ArrowUpRight /></a>
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noreferrer">{social.label} <ArrowUpRight /></a>
              ))}
            </div>
          </div>

          <nav className="footer-col" aria-label="Explore">
            <h2>Explore</h2>
            <Link href="/videos">Videos</Link>
            <Link href="/shorts">Shorts</Link>
            <Link href="/playlists">Playlists</Link>
            <Link href="/about">About</Link>
          </nav>

          <nav className="footer-col" aria-label="Store">
            <h2>Store</h2>
            <Link href="/shop">Shop</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/contact">Merch support</Link>
          </nav>

          <nav className="footer-col" aria-label="Connect">
            <h2>Connect</h2>
            <a href={channel.url} target="_blank" rel="noreferrer">Watch on YouTube</a>
            <Link href="/contact">Contact</Link>
            <Link href="/about">The story</Link>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>© {year} BRAKMASRA. All rights reserved.</span>
          <span>Official channel: {channel.handle}</span>
        </div>
      </div>
    </footer>
  );
}
