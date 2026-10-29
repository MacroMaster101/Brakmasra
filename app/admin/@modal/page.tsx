import { requireControlRoom } from "@/app/admin/access";

export default async function EmptySlot() {
  await requireControlRoom("control_room", "/admin");
  return null;
}
