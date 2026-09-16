import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { footerColumns } from "@/data/navigation";
import { site, socialLinks } from "@/data/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <span className="footer-watermark" aria-hidden>BRAKMASRA</span>

      <div className="footer-shell">
        <section className="footer-cta">
          <div>
            <h2>{site.slogan}</h2>
          </div>
          <Link className="button button-primary" href="/shop">
            <ShoppingBag />Shop the collection
          </Link>
        </section>

        <div className="footer-grid">
          <div className="footer-intro">
            <div className="footer-brand"><span className="brand-image"><Image src="/images/brakmasra-logo-reference.png" alt="" width={44} height={44} /></span><span>BRAKMASRA</span></div>
            <p>{site.summary}</p>
            {socialLinks.length > 0 && (
              <div className="footer-social">
                {socialLinks.map((social) => (
                  <a key={social.label} href={social.href} target="_blank" rel="noreferrer">{social.label} <ArrowUpRight /></a>
                ))}
              </div>
            )}
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} className="footer-col" aria-label={column.title}>
              <h2>{column.title}</h2>
              {column.links.map((link) => <Link key={link.label} href={link.href}>{link.label}</Link>)}
            </nav>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© {year} BRAKMASRA. All rights reserved.</span>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
