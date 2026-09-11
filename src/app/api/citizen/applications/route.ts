import { NextRequest, NextResponse } from "next/server";
import { createPanApplication, authenticateSession } from "@/lib/server/db";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { applicantName, applicantEmail, applicantPhone, citizenData, consentGranted } = body;

    if (!applicantName || !applicantEmail || !citizenData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for application" },
        { status: 400 }
      );
    }

    const app = await createPanApplication({
      userId: user.id,
      applicantName,
      applicantEmail,
      applicantPhone: applicantPhone || "",
      citizenData,
      consentGranted: consentGranted ?? true,
    });

    return NextResponse.json({ success: true, application: app }, { status: 201 });
  } catch (error: any) {
    console.error("[API citizen/applications POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
