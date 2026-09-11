import { NextResponse } from "next/server";
import { authenticateSession, acceptExtractedFieldForUser } from "@/lib/server/db";
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
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id, fieldId } = await params;

  let customValue: string | undefined;
  try {
    const body = await request.json();
    customValue = body.custom_value;
  } catch {
    // No custom value provided, uses raw_value
  }

  const updatedProfileField = acceptExtractedFieldForUser(user.id, id, fieldId, customValue);

  return NextResponse.json({
    success: true,
    message: `Extracted field ${fieldId} from doc ${id} confirmed into profile_fields`,
    field_id: fieldId,
    verified: true,
    data: updatedProfileField,
    custom_value: customValue || null,
  });
}
