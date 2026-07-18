import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notificationRepository } from "@/features/notifications/repositories/notification.repository";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const notifications = await notificationRepository.findByUser(session.user.id);
  const unreadCount = await notificationRepository.countUnread(session.user.id);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { id, markAll } = await req.json();

  if (markAll) {
    await notificationRepository.markAllAsRead(session.user.id);
  } else if (id) {
    await notificationRepository.markAsRead(id, session.user.id);
  }

  return NextResponse.json({ success: true });
}
