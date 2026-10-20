import { NotFoundScene } from "@/components/not-found-scene";
import { getCurrentMember } from "@/lib/member";
import { can } from "@/lib/roles";

export default async function NotFound() {
  // Only staff learn that a missing /admin page belongs to the Control Room;
  // everyone else gets the store's 404, so the area's existence isn't confirmed.
  const member = await getCurrentMember();
  return <NotFoundScene staff={can(member?.role ?? null, "control_room")} />;
}
