import { NextRequest, NextResponse } from "next/server";
import { resolveApplicationIdentity } from "@/lib/server/ai/orchestrator";
import { authenticateSession } from "@/lib/server/db";
import { validateGovSession } from "@/lib/server/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("FORMLY_CITIZEN_SESSION")?.value ||
      cookieStore.get("formly_citizen_session")?.value ||
      cookieStore.get("seva_saarthi_session")?.value;

    let callerUserId = "system";

    if (token) {
      const user = await authenticateSession(token);
      if (user) callerUserId = user.id;
    } else {
      const govAuth = await validateGovSession(request);
      if (govAuth.success && govAuth.user) {
        callerUserId = govAuth.user.id;
      }
    }

    const body = await request.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Missing mandatory applicationId parameter" },
        { status: 400 }
      );
    }

    const result = await resolveApplicationIdentity(applicationId, {
      callerUserId,
      forceRecompute: true,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("[API POST /api/ai/entity-resolution]", error);
    const isConsentViolation = error.message?.includes("DPDP Statutory Consent Violation");
    return NextResponse.json(
      { success: false, error: error.message },
      { status: isConsentViolation ? 403 : 500 }
    );
  }
}
