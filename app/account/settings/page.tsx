import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAccountMember } from "@/app/account/current-member";
import { EmailSettings } from "@/components/account/email-settings";
import { PasswordSettings } from "@/components/account/password-settings";
import { DeleteAccountNote, SignInMethods } from "@/components/account/sign-in-methods";
import { site } from "@/data/site";
import { authEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Account settings" };

export default async function SettingsPage() {
  // The layout shows the closed state; pages may render alongside it, so bail out here too.
  if (!authEnabled) return null;
  const member = await getAccountMember();
  if (!member) redirect("/login?next=/account/settings");

  return (
    <div className="account-settings">
      <EmailSettings email={member.email} />
      <PasswordSettings email={member.email} hasPassword={member.hasPassword} />
      <SignInMethods hasPassword={member.hasPassword} providers={member.providers} />
      <DeleteAccountNote supportEmail={site.supportEmail} />
    </div>
  );
}
