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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    await getAuthoritativeDb();
    const result = await pgQuery(
      `UPDATE notifications
       SET read_at = now()
       WHERE id = $1 AND recipient_id = $2
       RETURNING id`,
      [id, user.id]
    );

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Notification not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API notifications/[id] PATCH]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
