import { NextRequest, NextResponse } from "next/server";
import { authenticateSession, getPanApplications } from "@/lib/server/db";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("FORMLY_CITIZEN_SESSION")?.value ||
      cookieStore.get("formly_citizen_session")?.value ||
      cookieStore.get("seva_saarthi_session")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await authenticateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get the most recent application for this user
    const apps = await getPanApplications({ userId: user.id });
    if (!apps || apps.length === 0) {
      return NextResponse.json({ success: false, error: "No applications found for this user" }, { status: 404 });
    }

    // Sort by created_at descending
    const latestApp = apps.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return NextResponse.json({
      success: true,
      applicationId: latestApp.id,
      applicationNumber: (latestApp as any).application_number || latestApp.id
    });
  } catch (error: any) {
    console.error("[API track/latest GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
