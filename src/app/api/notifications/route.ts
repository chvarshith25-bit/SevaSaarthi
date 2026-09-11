import { NextRequest, NextResponse } from "next/server";
import { pgQuery, getAuthoritativeDb } from "@/lib/server/pg-db";
import { authenticateSession } from "@/lib/server/db";
import { cookies } from "next/headers";

async function getAuthenticatedUser(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("seva_saarthi_session")?.value ||
    (request.headers.get("Authorization")?.startsWith("Bearer ")
      ? request.headers.get("Authorization")?.substring(7)
      : null);

  if (!token) return null;
  return authenticateSession(token);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await getAuthoritativeDb();
    const notifications = await pgQuery(
      `SELECT * FROM notifications
       WHERE recipient_id = $1 AND recipient_type = 'CITIZEN'
       ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: notifications.filter((n: any) => !n.read_at).length,
    });
  } catch (error: any) {
    console.error("[API notifications GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ success: false, error: "Use /api/notifications/[id] to mark as read" }, { status: 400 });
}
