"use client";

import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import { AvatarPhoto } from "@/components/avatar-photo";
import { useLanguage } from "@/components/language-provider";
import { formatDate } from "@/lib/i18n";
import type { Member } from "@/lib/member";

type AccountHeaderProps = {
  /** Only these fields cross to the browser. */
  member: Pick<Member, "name" | "email" | "initials" | "createdAt" | "avatarUrl">;
  demo: boolean;
  logoutAction: () => Promise<void>;
  /** Extra detail under the email, such as role badges. */
  children?: ReactNode;
  /** Extra buttons or links shown before Sign out. */
  actions?: ReactNode;
};

export function AccountHeader({ member, demo, logoutAction, children, actions }: AccountHeaderProps) {
  const { t, lang } = useLanguage();
  const joined = member.createdAt ? formatDate(member.createdAt, lang, { day: false }) : t.accountLocalPreview;

  return (
    <header className="account-hero">
      <div className="account-identity">
        <AvatarPhoto className="account-avatar" src={member.avatarUrl} initials={member.initials} />
        <div className="account-identity-copy">
          <span className="eyebrow">{t.accountEyebrow}</span>
          <h1>{member.name}</h1>
          <p className="account-identity-email">{member.email}</p>
          <p className="account-identity-since">
            <span>{t.accountMemberSince}</span> {joined}
          </p>
          {children}
        </div>
      </div>
      <div className="account-hero-actions">
        {actions}
        <form action={logoutAction}>
          <button className="button button-secondary" type="submit">
            <LogOut aria-hidden="true" />
            {demo ? t.accountExitPreview : t.accountSignOut}
          </button>
        </form>
      </div>
    </header>
  );
}
