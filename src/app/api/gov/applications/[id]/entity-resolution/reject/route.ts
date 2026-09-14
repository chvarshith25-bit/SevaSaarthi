import { NextRequest, NextResponse } from "next/server";
import { officerReviewEntityResolution, getApplicationById } from "@/lib/server/db";
import { validateGovSession, unauthorizedResponse, forbiddenResponse } from "@/lib/server/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateGovSession(request);
    if (!auth.success) {
      return auth.error?.toLowerCase().includes("forbidden")
        ? forbiddenResponse(auth.error!)
        : unauthorizedResponse(auth.error!);
    }

    const { id } = await context.params;
    const body = await request.json();
    const { resolutionId, action, remarks } = body;

    if (!resolutionId) {
      return NextResponse.json(
        { success: false, error: "Missing mandatory resolutionId parameter" },
        { status: 400 }
      );
    }

    const reviewAction = action === "VERIFICATION_REQUIRED" ? "VERIFICATION_REQUIRED" : "REJECT";

    const res = await officerReviewEntityResolution(
      id,
      resolutionId,
      reviewAction,
      auth.user!.id,
      remarks || "Officer rejected candidate or flagged for manual verification."
    );

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    const updatedApp = await getApplicationById(id);

    return NextResponse.json({
      success: true,
      resolution: res.resolution,
      application: updatedApp,
    });
  } catch (error: any) {
    console.error("[POST /api/gov/applications/[id]/entity-resolution/reject]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
