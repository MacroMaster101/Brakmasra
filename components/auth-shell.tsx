import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

type AuthShellProps = {
  children: React.ReactNode;
  compact?: boolean;
  description: string;
  title: string;
};

export function AuthShell({ children, compact = false, description, title }: AuthShellProps) {
  return (
    <section className="auth-page">
      <div className={`auth-shell${compact ? " is-compact" : ""}`}>
        <Link className="auth-home-link" href="/" aria-label="BRAKMASRA home">
          <Image src="/images/brakmasra-logo-reference.png" alt="" width={34} height={34} />
          <span>BRAKMASRA</span>
        </Link>
        <Link className="auth-close" href="/" aria-label="Close and return to home">
          <X aria-hidden="true" />
        </Link>

        <div className="auth-art" aria-hidden="true">
          <Image
            src="/images/auth-manor.png"
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 48vw"
          />
          <div className="auth-art-scrim" />
          <div className="auth-art-copy">
            <span>Members</span>
            <h2>Your story stays with you.</h2>
            <p>Keep orders, delivery details, and future drops in one secure place.</p>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-inner">
            <header className="auth-heading">
              <h1>{title}</h1>
              <p>{description}</p>
            </header>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
