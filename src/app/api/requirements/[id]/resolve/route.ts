import { NextResponse } from "next/server";
import { authenticateSession, markRequirementResolvedForUser } from "@/lib/server/db";
import { cookies } from "next/headers";

async function getAuthenticatedUser(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("FORMLY_CITIZEN_SESSION")?.value ||
    cookieStore.get("formly_citizen_session")?.value ||
    cookieStore.get("seva_saarthi_session")?.value ||
    (request.headers.get("Authorization")?.startsWith("Bearer ")
      ? request.headers.get("Authorization")?.substring(7)
      : null);

  if (!token) return null;
  return authenticateSession(token);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let note = "Resolved manually by applicant.";
  try {
    const body = await request.json();
    if (body.note) note = body.note;
  } catch {
    // default note
  }

  const updatedStatus = markRequirementResolvedForUser(user.id, id, note);

  return NextResponse.json({
    success: true,
    message: `Requirement ${id} marked as MANUALLY_RESOLVED (locked from auto-recompute)`,
    data: updatedStatus,
  });
}
