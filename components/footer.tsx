import Link from "next/link";
import { channel, socialLinks } from "@/data/channel";
import { BrandMark, Ornament } from "@/components/icons";

export function Footer() {
  return (
    <footer className="site-footer">
      <Ornament className="footer-ornament" />
      <div className="footer-grid">
        <div>
          <div className="footer-brand"><BrandMark /><span>BRAKMASRA</span></div>
          <p>Exploring the unknown through mysterious journeys, paranormal investigations, and haunted places.</p>
        </div>
        <div><h2>Explore</h2><Link href="/videos">Videos</Link><Link href="/shorts">Shorts</Link><Link href="/playlists">Playlists</Link><Link href="/about">About</Link></div>
        <div><h2>Store</h2><Link href="/shop">Shop</Link><Link href="/cart">Cart</Link><Link href="/contact">Merch support</Link></div>
        <div><h2>Follow</h2><a href={channel.url} target="_blank" rel="noreferrer">YouTube</a>{socialLinks.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noreferrer">{social.label}</a>)}</div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} BRAKMASRA. All rights reserved.</span><span>Official channel: {channel.handle}</span></div>
    </footer>
  );
}
