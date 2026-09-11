import { NextRequest, NextResponse } from "next/server";
import { getApplications, createPanApplication } from "@/lib/server/db";
import { validateGovSession, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const stage = searchParams.get("stage") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const search = searchParams.get("search") || undefined;
    const userId = searchParams.get("userId") || undefined;

    const apps = await getApplications({ status, stage, priority, search, userId });
    return NextResponse.json({ success: true, applications: apps, count: apps.length });
  } catch (error: any) {
    console.error("[API gov/applications GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const body = await request.json();
    const { userId, applicantName, applicantEmail, applicantPhone, citizenData, consentGranted } = body;

    if (!applicantName || !applicantEmail || !citizenData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for PAN application" },
        { status: 400 }
      );
    }

    const app = await createPanApplication({
      userId: userId || "u_0bc5a3b6-f059-4ab2-9870-46a9c25178b7",
      applicantName,
      applicantEmail,
      applicantPhone: applicantPhone || "1234567890",
      citizenData,
      consentGranted: consentGranted ?? true,
    });

    return NextResponse.json({ success: true, application: app }, { status: 201 });
  } catch (error: any) {
    console.error("[API gov/applications POST]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
