import { redirect } from "next/navigation";

import { getAccountMember } from "@/app/account/current-member";
import { AvatarEditor } from "@/components/account/avatar-editor";
import { ProfileForm } from "@/components/account/profile-form";
import { Translated } from "@/components/translated";
import { authDemoMode, authEnabled } from "@/lib/features";
import type { TextKey } from "@/lib/i18n";
import { nationalNumber } from "@/lib/phone";

type ProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  // The layout shows the closed state; pages may render alongside it, so bail out here too.
  if (!authEnabled) return null;
  const member = await getAccountMember();
  if (!member) redirect("/login?next=/account");

  const params = await searchParams;
  const notice: TextKey | null = authDemoMode
    ? "accountNoticeDemo"
    : params.password === "updated"
      ? "accountNoticePassword"
      : params.welcome === "1"
        ? "accountNoticeReady"
        : null;

  return (
    <>
      {notice && (
        <p className="account-notice" role="status">
          <Translated k={notice} />
        </p>
      )}
      <AvatarEditor
        member={{ name: member.name, email: member.email, initials: member.initials, avatarUrl: member.avatarUrl }}
        source={member.avatarSource}
      />
      <ProfileForm
        email={member.email}
        name={member.name}
        phoneCountry={member.phoneCountry ?? "LK"}
        phoneNumber={nationalNumber(member.phone, member.phoneCountry)}
      />
    </>
  );
}
