import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ControlRoomTeam, type TeamData } from "@/components/control-room/team";
import { listTeam } from "@/lib/control-room";
import { roleChoicesFor } from "@/lib/control-room-validation";

export const metadata: Metadata = { title: "Team", robots: noIndex };
export const dynamic = "force-dynamic";

export default async function ControlRoomTeamPage() {
  const viewer = await requireControlRoom("manage_team", "/admin/team");
  const team = await loadSection<TeamData>(async () => {
    const result = await listTeam();
    if (!result) return null;
    // The choices only shape each row's menu; changeRoleAction checks them again.
    return {
      members: result.members.map((member) => ({ ...member, choices: roleChoicesFor(viewer, member) })),
      truncated: result.truncated,
    };
  });

  return <ControlRoomTeam viewerId={viewer.id} team={team} />;
}
