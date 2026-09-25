import type { Metadata } from "next";

import { loadSection, noIndex, requireControlRoom } from "@/app/admin/access";
import { ControlRoomMessages } from "@/components/control-room/messages";
import { listContactMessages } from "@/lib/control-room";
import { parseMessageFilter } from "@/lib/control-room-validation";

export const metadata: Metadata = { title: "Messages", robots: noIndex };
export const dynamic = "force-dynamic";

type MessagesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ControlRoomMessagesPage({ searchParams }: MessagesPageProps) {
  await requireControlRoom("view_messages", "/admin/messages");
  const filter = parseMessageFilter((await searchParams).status);
  const messages = await loadSection(() => listContactMessages(filter));

  return <ControlRoomMessages filter={filter} messages={messages} />;
}
