import { NextResponse } from "next/server";
import { authenticateSession, getUserProfileFields, updateUserProfileField } from "@/lib/server/db";
import { cookies } from "next/headers";

async function getAuthenticatedUser(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("FORMLY_CITIZEN_SESSION")?.value ||
    cookieStore.get("formly_citizen_session")?.value ||
    cookieStore.get("seva_saarthi_session")?.value ||
    (request.headers.get("Authorization")?.startsWith("Bearer ") ? request.headers.get("Authorization")?.substring(7) : null);

  if (!token) return null;
  return await authenticateSession(token);
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const fields = await getUserProfileFields(user.id);
  return NextResponse.json({
    success: true,
    data: fields,
  });
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { field_name, value, fields } = body;

    // Support batch update
    if (fields && typeof fields === "object") {
      const updatedFields = [];
      for (const [key, val] of Object.entries(fields)) {
        if (typeof val === "string") {
          const updated = await updateUserProfileField(user.id, key, val);
          updatedFields.push(updated);
        }
      }
      return NextResponse.json({
        success: true,
        message: `${updatedFields.length} profile fields updated successfully`,
        data: await getUserProfileFields(user.id),
      });
    }

    if (!field_name) {
      return NextResponse.json({ success: false, error: "field_name or fields is required" }, { status: 400 });
    }

    const updatedField = await updateUserProfileField(user.id, field_name, value || "");

    return NextResponse.json({
      success: true,
      message: `Profile field '${field_name}' updated successfully`,
      data: updatedField,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid payload" }, { status: 400 });
  }
}
